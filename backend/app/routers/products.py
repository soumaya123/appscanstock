from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db, Product
from app.schemas import ProductCreate, ProductUpdate, Product as ProductSchema, User
from app.routers.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=ProductSchema)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vérifier si le code produit existe déjà
    db_product = db.query(Product).filter(Product.code_produit == product.code_produit).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Code produit already exists")
    
    # Vérifier si le code-barre existe déjà (s'il est fourni)
    if product.code_barre:
        db_product_barcode = db.query(Product).filter(Product.code_barre == product.code_barre).first()
        if db_product_barcode:
            raise HTTPException(status_code=400, detail="Code-barre already exists")
    
    # Valeurs par défaut côté backend pour éviter erreurs de payload partiel
    data = product.dict()
    data.setdefault('unite_kg', True)
    data.setdefault('unite_cartons', True)
    data.setdefault('prix_achat', 0.0)
    data.setdefault('prix_vente', 0.0)
    data.setdefault('seuil_alerte', 0.0)

    db_product = Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductSchema])
def read_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Rechercher par nom, code produit ou code-barre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Product)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.nom_produit.ilike(search_filter)) |
            (Product.code_produit.ilike(search_filter)) |
            (Product.code_barre.ilike(search_filter))
        )
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductSchema)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/by-code/{code_produit}", response_model=ProductSchema)
def read_product_by_code(
    code_produit: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.code_produit == code_produit).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/by-barcode/{code_barre}", response_model=ProductSchema)
def read_product_by_barcode(
    code_barre: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.code_barre == code_barre).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Vérifier les doublons si les codes sont mis à jour
    if product_update.code_produit and product_update.code_produit != product.code_produit:
        existing = db.query(Product).filter(Product.code_produit == product_update.code_produit).first()
        if existing:
            raise HTTPException(status_code=400, detail="Code produit already exists")
    
    if product_update.code_barre and product_update.code_barre != product.code_barre:
        existing = db.query(Product).filter(Product.code_barre == product_update.code_barre).first()
        if existing:
            raise HTTPException(status_code=400, detail="Code-barre already exists")
    
    # Mettre à jour les champs
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Vérifier s'il y a des mouvements de stock pour ce produit
    # (Vous pouvez ajouter cette logique selon vos besoins)
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/low-stock/alert", response_model=List[ProductSchema])
def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retourner les produits dont le stock est en dessous du seuil d'alerte"""
    products = db.query(Product).filter(
        (Product.stock_actuel_kg <= Product.seuil_alerte) |
        (Product.stock_actuel_cartons <= Product.seuil_alerte)
    ).all()
    return products
