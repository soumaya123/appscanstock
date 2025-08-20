from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, Product, StockEntry, StockEntryItem, StockExit, StockExitItem
from app.schemas import Product as ProductSchema, StockEntryBatchCreate, StockExitCreateFlexible

router = APIRouter()

# Mobile API for Products
@router.get("/products", response_model=List[ProductSchema])
def get_products_mobile(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/products/{product_id}", response_model=ProductSchema)
def get_product_by_id_mobile(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Mobile API for Stock Entries
@router.post("/stock-entries/batch")
def add_multiple_stock_entries(
    payload: List[StockEntryBatchCreate],
    db: Session = Depends(get_db)
):
    all_created_items = []
    for entry in payload:
        if not entry.items:
            raise HTTPException(status_code=400, detail="'items' cannot be empty")

        header = StockEntry(
            date_reception=entry.date_reception,
            num_reception=entry.num_reception,
            num_reception_carnet=entry.num_reception_carnet,
            num_facture=entry.num_facture,
            num_packing_liste=entry.num_packing_liste,
            created_by=0
        )
        db.add(header)
        db.commit()
        db.refresh(header)

        for it in entry.items:
            item = StockEntryItem(
                entry_id=header.id,
                product_id=it.product_id,
                qte_kg=it.qte_kg,
                qte_cartons=it.qte_cartons,
                date_peremption=it.date_peremption,
                remarque=it.remarque,
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            all_created_items.append(item)

    return all_created_items

# Mobile API for Stock Exits
@router.post("/stock-exits/batch")
def add_multiple_stock_exits(
    payload: List[StockExitCreateFlexible],
    db: Session = Depends(get_db)
):
    all_created_items = []
    for exit_entry in payload:
        if not exit_entry.items:
            raise HTTPException(status_code=400, detail="'items' cannot be empty")

        header = StockExit(
            date_sortie=exit_entry.date_sortie,
            num_facture=exit_entry.num_facture,
            type_sortie=exit_entry.type_sortie,
            remarque=exit_entry.remarque,
            prix_vente=exit_entry.prix_vente,
            created_by=0
        )
        db.add(header)
        db.commit()
        db.refresh(header)

        for it in exit_entry.items:
            product = db.query(Product).filter(Product.id == it.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")

            if product.stock_actuel_kg < it.qte_kg or product.stock_actuel_cartons < it.qte_cartons:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {it.product_id}. Available: {product.stock_actuel_kg} kg, {product.stock_actuel_cartons} cartons. Requested: {it.qte_kg} kg, {it.qte_cartons} cartons."
                )

            product.stock_actuel_kg -= it.qte_kg
            product.stock_actuel_cartons -= it.qte_cartons
            db.commit()

            item = StockExitItem(
                exit_id=header.id,
                product_id=it.product_id,
                qte_kg=it.qte_kg,
                qte_cartons=it.qte_cartons,
                date_peremption=it.date_peremption,
                remarque=it.remarque,
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            all_created_items.append(item)

    return all_created_items