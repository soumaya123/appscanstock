from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db, Product, StockEntry, StockEntryItem, StockExit, StockExitItem, StockMovement
from app.schemas import Product as ProductSchema, StockEntryBatchCreate, StockExitCreateFlexible
from app.schemas import (
    StockExit as StockExitSchema,  # ancien schéma item (aplati)
    StockExitUpdate,
    TypeSortie,
    User,
)
from app.schemas import (
    StockEntryBatchCreate,
    StockEntryItem as StockEntryItemSchema,
    StockEntry as StockEntrySchema,
    StockEntryUpdate,
)
from app.routers.stock_entries import update_product_stock_on_entry
from app.routers.stock_exits import update_product_stock_on_exit
router = APIRouter()
from app.routers.auth import get_current_active_user

class StockEntryCreateFlexible(BaseModel):
    date_reception: datetime
    num_reception: str
    num_reception_carnet: Optional[str] = None
    num_facture: Optional[str] = None
    num_packing_liste: Optional[str] = None
    # Option A: items (préféré)
    items: Optional[List[StockEntryItemSchema]] = None
    # Option B: ligne unique (rétrocompat)
    product_id: Optional[int] = None
    qte_kg: Optional[float] = 0.0
    qte_cartons: Optional[int] = 0
    date_peremption: Optional[datetime] = None
    remarque: Optional[str] = None



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

@router.post("/stock-exits/batch", response_model=List[StockExitSchema])
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
            created_by= 0
        )
        db.add(header)
        db.commit()
        db.refresh(header)

        for it in exit_entry.items:
            product = db.query(Product).filter(Product.id == it.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")

            # Vérification stock dispo
            if product.stock_actuel_kg < it.qte_kg or product.stock_actuel_cartons < it.qte_cartons:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {it.product_id}. "
                           f"Available: {product.stock_actuel_kg} kg, {product.stock_actuel_cartons} cartons. "
                           f"Requested: {it.qte_kg} kg, {it.qte_cartons} cartons."
                )

            # Création item sortie
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

            # 🔥 MAJ stock avec la même logique que dans create_stock_exit
            old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_exit(
                db, it.product_id, it.qte_kg, it.qte_cartons
            )

            # 🔥 Création mouvement
            create_stock_movement_exit(
                db,
                it.product_id,
                old_kg,
                old_cartons,
                it.qte_kg,
                it.qte_cartons,
                new_kg,
                new_cartons,
                reference_id=item.id,
                user_id= 0,
            )

            all_created_items.append(serialize_exit_item(item, header))

    return all_created_items

def create_stock_movement_exit(
    db: Session,
    product_id: int,
    qte_kg_avant: float,
    qte_cartons_avant: int,
    qte_kg_mouvement: float,
    qte_cartons_mouvement: int,
    qte_kg_apres: float,
    qte_cartons_apres: int,
    reference_id: int,
    user_id: int,
):
    movement = StockMovement(
        product_id=product_id,
        type_mouvement="SORTIE",
        qte_kg_avant=qte_kg_avant,
        qte_cartons_avant=qte_cartons_avant,
        qte_kg_mouvement=-float(qte_kg_mouvement or 0.0),  # négatif
        qte_cartons_mouvement=-int(qte_cartons_mouvement or 0),
        qte_kg_apres=qte_kg_apres,
        qte_cartons_apres=qte_cartons_apres,
        reference_id=reference_id,
        reference_type="EXIT",
        created_by=0,
    )
    db.add(movement)
    db.commit()


def serialize_exit_item(item: StockExitItem, header: StockExit) -> dict:
    return {
        'id': item.id,
        'date_sortie': header.date_sortie,
        'num_facture': header.num_facture,
        'type_sortie': header.type_sortie,
        'remarque': header.remarque,
        'prix_vente': header.prix_vente,
        'product_id': item.product_id,
        'product': item.product,
        'qte_kg': item.qte_kg,
        'qte_cartons': item.qte_cartons,
        'date_peremption': item.date_peremption,
        'created_by': header.created_by,
        'created_at': header.created_at,
    }

# Mobile API for Stock Exits
@router.post("/stock-entries/batch", response_model=List[StockEntrySchema])
def add_multiple_stock_entries_public(
    payload: List[StockEntryCreateFlexible],
    db: Session = Depends(get_db),
):
    all_created_items = []

    for entry in payload:
        if not entry.items:
            raise HTTPException(status_code=400, detail="'items' cannot be empty")

        # Créer l'entête
        header = StockEntry(
            date_reception=entry.date_reception,
            num_reception=entry.num_reception,
            num_reception_carnet=entry.num_reception_carnet,
            num_facture=entry.num_facture,
            num_packing_liste=entry.num_packing_liste,
            created_by=0  # utilisateur par défaut
        )
        db.add(header)
        db.commit()
        db.refresh(header)

        for it in entry.items:
            product = db.query(Product).filter(Product.id == it.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")

            # Création item entrée
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

            # MAJ stock
            old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_entry(
                db, it.product_id, it.qte_kg, it.qte_cartons
            )

            # Création mouvement
            create_stock_movement(
                db,
                it.product_id,
                old_kg,
                old_cartons,
                it.qte_kg,
                it.qte_cartons,
                new_kg,
                new_cartons,
                reference_id=item.id,
                reference_type="ENTRY",
                user_id=0  # utilisateur par défaut
            )

            all_created_items.append(serialize_entry_item(item, header))

    return all_created_items


def create_stock_movement(
    db: Session,
    product_id: int,
    qte_kg_avant: float,
    qte_cartons_avant: int,
    qte_kg_mouvement: float,
    qte_cartons_mouvement: int,
    qte_kg_apres: float,
    qte_cartons_apres: int,
    reference_id: int,
    reference_type: str,
    user_id: int,
):
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
        created_by=0,
    )
    db.add(movement)
    db.commit()


def serialize_entry_item(item: StockEntryItem, header: StockEntry) -> dict:
    return {
        'id': item.id,
        'date_reception': header.date_reception,
        'num_reception': header.num_reception,
        'num_reception_carnet': header.num_reception_carnet,
        'num_facture': header.num_facture,
        'num_packing_liste': header.num_packing_liste,
        'product_id': item.product_id,
        'product': item.product,
        'qte_kg': item.qte_kg,
        'qte_cartons': item.qte_cartons,
        'date_peremption': item.date_peremption,
        'remarque': item.remarque,
        'created_by': header.created_by,
        'created_at': header.created_at,
    }
