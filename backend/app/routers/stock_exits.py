from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from app.database import get_db, StockExit, Product, StockMovement
from app.schemas import StockExitCreate, StockExitUpdate, StockExit as StockExitSchema, User, TypeSortie
from app.routers.auth import get_current_active_user

router = APIRouter()

def update_product_stock_on_exit(db: Session, product_id: int, qte_kg: float, qte_cartons: int):
    """Mettre à jour le stock du produit lors d'une sortie"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        old_kg = product.stock_actuel_kg
        old_cartons = product.stock_actuel_cartons
        
        # Vérifier qu'il y a assez de stock
        if product.stock_actuel_kg < qte_kg:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuffisant en kg. Stock actuel: {product.stock_actuel_kg}, demandé: {qte_kg}"
            )
        
        if product.stock_actuel_cartons < qte_cartons:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuffisant en cartons. Stock actuel: {product.stock_actuel_cartons}, demandé: {qte_cartons}"
            )
        
        product.stock_actuel_kg -= qte_kg
        product.stock_actuel_cartons -= qte_cartons
        
        db.commit()
        return old_kg, old_cartons, product.stock_actuel_kg, product.stock_actuel_cartons
    return None

def create_stock_movement_exit(db: Session, product_id: int, qte_kg_avant: float, qte_cartons_avant: int,
                              qte_kg_mouvement: float, qte_cartons_mouvement: int,
                              qte_kg_apres: float, qte_cartons_apres: int,
                              reference_id: int, reference_type: str, user_id: int):
    """Créer un mouvement de stock pour une sortie"""
    movement = StockMovement(
        product_id=product_id,
        type_mouvement="SORTIE",
        qte_kg_avant=qte_kg_avant,
        qte_cartons_avant=qte_cartons_avant,
        qte_kg_mouvement=-qte_kg_mouvement,  # Négatif car c'est une sortie
        qte_cartons_mouvement=-qte_cartons_mouvement,
        qte_kg_apres=qte_kg_apres,
        qte_cartons_apres=qte_cartons_apres,
        reference_id=reference_id,
        reference_type=reference_type,
        created_by=user_id
    )
    db.add(movement)
    db.commit()

@router.post("/", response_model=StockExitSchema)
def create_stock_exit(
    exit: StockExitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vérifier que le produit existe
    product = db.query(Product).filter(Product.id == exit.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Créer la sortie de stock (cela vérifiera aussi le stock disponible)
    db_exit = StockExit(**exit.dict(), created_by=current_user.id)
    db.add(db_exit)
    db.commit()
    db.refresh(db_exit)
    
    # Mettre à jour le stock du produit
    try:
        stock_update = update_product_stock_on_exit(
            db, exit.product_id, exit.qte_kg, exit.qte_cartons
        )
        
        if stock_update:
            old_kg, old_cartons, new_kg, new_cartons = stock_update
            # Créer le mouvement de stock
            create_stock_movement_exit(
                db, exit.product_id, old_kg, old_cartons,
                exit.qte_kg, exit.qte_cartons, new_kg, new_cartons,
                db_exit.id, "EXIT", current_user.id
            )
    except HTTPException as e:
        # Annuler la création de la sortie si le stock est insuffisant
        db.delete(db_exit)
        db.commit()
        raise e
    
    return db_exit

@router.get("/", response_model=List[StockExitSchema])
def read_stock_exits(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = Query(None),
    date_debut: Optional[datetime] = Query(None),
    date_fin: Optional[datetime] = Query(None),
    type_sortie: Optional[TypeSortie] = Query(None),
    num_facture: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(StockExit)
    
    # Filtres
    if product_id:
        query = query.filter(StockExit.product_id == product_id)
    
    if date_debut and date_fin:
        query = query.filter(
            and_(
                StockExit.date_sortie >= date_debut,
                StockExit.date_sortie <= date_fin
            )
        )
    elif date_debut:
        query = query.filter(StockExit.date_sortie >= date_debut)
    elif date_fin:
        query = query.filter(StockExit.date_sortie <= date_fin)
    
    if type_sortie:
        query = query.filter(StockExit.type_sortie == type_sortie)
    
    if num_facture:
        query = query.filter(StockExit.num_facture.ilike(f"%{num_facture}%"))
    
    exits = query.offset(skip).limit(limit).all()
    return exits

@router.get("/{exit_id}", response_model=StockExitSchema)
def read_stock_exit(
    exit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exit = db.query(StockExit).filter(StockExit.id == exit_id).first()
    if exit is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    return exit

@router.put("/{exit_id}", response_model=StockExitSchema)
def update_stock_exit(
    exit_id: int,
    exit_update: StockExitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exit = db.query(StockExit).filter(StockExit.id == exit_id).first()
    if exit is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    
    # Sauvegarder les anciennes quantités pour ajuster le stock
    old_qte_kg = exit.qte_kg
    old_qte_cartons = exit.qte_cartons
    
    # Mettre à jour les champs
    update_data = exit_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exit, field, value)
    
    db.commit()
    db.refresh(exit)
    
    # Ajuster le stock si les quantités ont changé
    if 'qte_kg' in update_data or 'qte_cartons' in update_data:
        product = db.query(Product).filter(Product.id == exit.product_id).first()
        if product:
            # Remettre l'ancien stock
            product.stock_actuel_kg += old_qte_kg
            product.stock_actuel_cartons += old_qte_cartons
            
            # Vérifier qu'il y a assez de stock pour la nouvelle quantité
            if product.stock_actuel_kg < exit.qte_kg:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuffisant en kg. Stock disponible: {product.stock_actuel_kg}, demandé: {exit.qte_kg}"
                )
            
            if product.stock_actuel_cartons < exit.qte_cartons:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuffisant en cartons. Stock disponible: {product.stock_actuel_cartons}, demandé: {exit.qte_cartons}"
                )
            
            # Appliquer la nouvelle sortie
            product.stock_actuel_kg -= exit.qte_kg
            product.stock_actuel_cartons -= exit.qte_cartons
            
            db.commit()
    
    return exit

@router.delete("/{exit_id}")
def delete_stock_exit(
    exit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exit = db.query(StockExit).filter(StockExit.id == exit_id).first()
    if exit is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    
    # Remettre le stock en annulant cette sortie
    product = db.query(Product).filter(Product.id == exit.product_id).first()
    if product:
        product.stock_actuel_kg += exit.qte_kg
        product.stock_actuel_cartons += exit.qte_cartons
    
    db.delete(exit)
    db.commit()
    return {"message": "Stock exit deleted successfully"}

@router.get("/by-product/{product_id}", response_model=List[StockExitSchema])
def get_exits_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtenir toutes les sorties pour un produit spécifique"""
    exits = db.query(StockExit).filter(StockExit.product_id == product_id).all()
    return exits

@router.get("/by-type/{type_sortie}", response_model=List[StockExitSchema])
def get_exits_by_type(
    type_sortie: TypeSortie,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtenir toutes les sorties par type"""
    exits = db.query(StockExit).filter(StockExit.type_sortie == type_sortie).all()
    return exits
