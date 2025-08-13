from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from app.database import get_db, StockEntry, Product, StockMovement
from app.schemas import StockEntryCreate, StockEntryUpdate, StockEntry as StockEntrySchema, User
from app.routers.auth import get_current_active_user

router = APIRouter()

def update_product_stock_on_entry(db: Session, product_id: int, qte_kg: float, qte_cartons: int):
    """Mettre à jour le stock du produit lors d'une entrée"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        old_kg = product.stock_actuel_kg
        old_cartons = product.stock_actuel_cartons
        
        product.stock_actuel_kg += qte_kg
        product.stock_actuel_cartons += qte_cartons
        
        db.commit()
        return old_kg, old_cartons, product.stock_actuel_kg, product.stock_actuel_cartons
    return None

def create_stock_movement(db: Session, product_id: int, qte_kg_avant: float, qte_cartons_avant: int,
                         qte_kg_mouvement: float, qte_cartons_mouvement: int,
                         qte_kg_apres: float, qte_cartons_apres: int,
                         reference_id: int, reference_type: str, user_id: int):
    """Créer un mouvement de stock"""
    movement = StockMovement(
        product_id=product_id,
        type_mouvement="ENTREE",
        qte_kg_avant=qte_kg_avant,
        qte_cartons_avant=qte_cartons_avant,
        qte_kg_mouvement=qte_kg_mouvement,
        qte_cartons_mouvement=qte_cartons_mouvement,
        qte_kg_apres=qte_kg_apres,
        qte_cartons_apres=qte_cartons_apres,
        reference_id=reference_id,
        reference_type=reference_type,
        created_by=user_id
    )
    db.add(movement)
    db.commit()

@router.post("/", response_model=StockEntrySchema)
def create_stock_entry(
    entry: StockEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vérifier que le produit existe
    product = db.query(Product).filter(Product.id == entry.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Créer l'entrée de stock
    db_entry = StockEntry(**entry.dict(), created_by=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Mettre à jour le stock du produit
    stock_update = update_product_stock_on_entry(
        db, entry.product_id, entry.qte_kg, entry.qte_cartons
    )
    
    if stock_update:
        old_kg, old_cartons, new_kg, new_cartons = stock_update
        # Créer le mouvement de stock
        create_stock_movement(
            db, entry.product_id, old_kg, old_cartons,
            entry.qte_kg, entry.qte_cartons, new_kg, new_cartons,
            db_entry.id, "ENTRY", current_user.id
        )
    
    return db_entry

@router.get("/", response_model=List[StockEntrySchema])
def read_stock_entries(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = Query(None),
    date_debut: Optional[datetime] = Query(None),
    date_fin: Optional[datetime] = Query(None),
    num_reception: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(StockEntry)
    
    # Filtres
    if product_id:
        query = query.filter(StockEntry.product_id == product_id)
    
    if date_debut and date_fin:
        query = query.filter(
            and_(
                StockEntry.date_reception >= date_debut,
                StockEntry.date_reception <= date_fin
            )
        )
    elif date_debut:
        query = query.filter(StockEntry.date_reception >= date_debut)
    elif date_fin:
        query = query.filter(StockEntry.date_reception <= date_fin)
    
    if num_reception:
        query = query.filter(StockEntry.num_reception.ilike(f"%{num_reception}%"))
    
    entries = query.offset(skip).limit(limit).all()
    return entries

@router.get("/{entry_id}", response_model=StockEntrySchema)
def read_stock_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(StockEntry).filter(StockEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    return entry

@router.put("/{entry_id}", response_model=StockEntrySchema)
def update_stock_entry(
    entry_id: int,
    entry_update: StockEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(StockEntry).filter(StockEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    # Sauvegarder les anciennes quantités pour ajuster le stock
    old_qte_kg = entry.qte_kg
    old_qte_cartons = entry.qte_cartons
    
    # Mettre à jour les champs
    update_data = entry_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    # Ajuster le stock si les quantités ont changé
    if 'qte_kg' in update_data or 'qte_cartons' in update_data:
        product = db.query(Product).filter(Product.id == entry.product_id).first()
        if product:
            # Annuler l'ancien impact
            product.stock_actuel_kg -= old_qte_kg
            product.stock_actuel_cartons -= old_qte_cartons
            
            # Appliquer le nouveau
            product.stock_actuel_kg += entry.qte_kg
            product.stock_actuel_cartons += entry.qte_cartons
            
            db.commit()
    
    return entry

@router.delete("/{entry_id}")
def delete_stock_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(StockEntry).filter(StockEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    # Ajuster le stock en retirant les quantités de cette entrée
    product = db.query(Product).filter(Product.id == entry.product_id).first()
    if product:
        product.stock_actuel_kg -= entry.qte_kg
        product.stock_actuel_cartons -= entry.qte_cartons
    
    db.delete(entry)
    db.commit()
    return {"message": "Stock entry deleted successfully"}

@router.get("/by-product/{product_id}", response_model=List[StockEntrySchema])
def get_entries_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtenir toutes les entrées pour un produit spécifique"""
    entries = db.query(StockEntry).filter(StockEntry.product_id == product_id).all()
    return entries
