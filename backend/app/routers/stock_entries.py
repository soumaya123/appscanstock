from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db, StockEntry, StockEntryItem, Product, StockMovement
from app.schemas import (
    StockEntryBatchCreate,
    StockEntryItem as StockEntryItemSchema,
    StockEntry as StockEntrySchema,
    StockEntryUpdate,
    User,
)
from app.routers.auth import get_current_active_user

router = APIRouter()


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


# Utilitaires

def update_product_stock_on_entry(db: Session, product_id: int, qte_kg: float, qte_cartons: int):
    """Met à jour le stock du produit (ajout) et renvoie (old_kg, old_cartons, new_kg, new_cartons)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
    old_kg = float(product.stock_actuel_kg or 0.0)
    old_cartons = int(product.stock_actuel_cartons or 0)
    product.stock_actuel_kg = old_kg + float(qte_kg or 0.0)
    product.stock_actuel_cartons = old_cartons + int(qte_cartons or 0)
    db.commit()
    return old_kg, old_cartons, product.stock_actuel_kg, product.stock_actuel_cartons


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
        created_by=user_id,
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


@router.post("/batch", response_model=List[StockEntrySchema])
def create_stock_entries_batch(
    payload: StockEntryBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="'items' cannot be empty")

    # Créer l'entête
    header = StockEntry(
        date_reception=payload.date_reception,
        num_reception=payload.num_reception,
        num_reception_carnet=payload.num_reception_carnet,
        num_facture=payload.num_facture,
        num_packing_liste=payload.num_packing_liste,
        created_by=current_user.id,
    )
    db.add(header)
    db.commit()
    db.refresh(header)

    created_items = []
    for it in payload.items:
        # Ligne item
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

        # MAJ stock + mouvement
        old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_entry(
            db, it.product_id, it.qte_kg, it.qte_cartons
        )
        create_stock_movement(
            db,
            it.product_id,
            old_kg,
            old_cartons,
            float(it.qte_kg or 0.0),
            int(it.qte_cartons or 0),
            new_kg,
            new_cartons,
            reference_id=item.id,
            reference_type="ENTRY",
            user_id=current_user.id,
        )
        created_items.append(serialize_entry_item(item, header))

    return created_items


@router.post("/", response_model=List[StockEntrySchema])
def create_stock_entry(
    entry: StockEntryCreateFlexible,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Cas items[] (recommandé)
    if entry.items:
        batch_payload = StockEntryBatchCreate(
            date_reception=entry.date_reception,
            num_reception=entry.num_reception,
            num_reception_carnet=entry.num_reception_carnet,
            num_facture=entry.num_facture,
            num_packing_liste=entry.num_packing_liste,
            items=entry.items,
        )
        return create_stock_entries_batch(batch_payload, db, current_user)  # type: ignore

    # Cas rétrocompat: une seule ligne
    if entry.product_id is None:
        raise HTTPException(status_code=400, detail="product_id is required when no items are provided")

    # Créer l'entête
    header = StockEntry(
        date_reception=entry.date_reception,
        num_reception=entry.num_reception,
        num_reception_carnet=entry.num_reception_carnet,
        num_facture=entry.num_facture,
        num_packing_liste=entry.num_packing_liste,
        created_by=current_user.id,
    )
    db.add(header)
    db.commit()
    db.refresh(header)

    # Créer l'item
    item = StockEntryItem(
        entry_id=header.id,
        product_id=entry.product_id,
        qte_kg=float(entry.qte_kg or 0.0),
        qte_cartons=int(entry.qte_cartons or 0),
        date_peremption=entry.date_peremption,
        remarque=entry.remarque,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # MAJ stock + mouvement
    old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_entry(
        db, entry.product_id, item.qte_kg, item.qte_cartons
    )
    create_stock_movement(
        db,
        entry.product_id,
        old_kg,
        old_cartons,
        item.qte_kg,
        item.qte_cartons,
        new_kg,
        new_cartons,
        reference_id=item.id,
        reference_type="ENTRY",
        user_id=current_user.id,
    )

    return [serialize_entry_item(item, header)]


@router.get("/", response_model=List[StockEntrySchema])
def read_stock_entries(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = Query(None),
    date_debut: Optional[datetime] = Query(None),
    date_fin: Optional[datetime] = Query(None),
    num_reception: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Jointure items + entête
    q = db.query(StockEntryItem, StockEntry).join(StockEntry, StockEntryItem.entry_id == StockEntry.id)

    if product_id:
        q = q.filter(StockEntryItem.product_id == product_id)
    if date_debut and date_fin:
        q = q.filter(and_(StockEntry.date_reception >= date_debut, StockEntry.date_reception <= date_fin))
    elif date_debut:
        q = q.filter(StockEntry.date_reception >= date_debut)
    elif date_fin:
        q = q.filter(StockEntry.date_reception <= date_fin)
    if num_reception:
        q = q.filter(StockEntry.num_reception.ilike(f"%{num_reception}%"))

    rows = q.offset(skip).limit(limit).all()
    return [serialize_entry_item(item, header) for (item, header) in rows]


@router.get("/{entry_id}", response_model=StockEntrySchema)
def read_stock_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockEntryItem).filter(StockEntryItem.id == entry_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    header = db.query(StockEntry).filter(StockEntry.id == item.entry_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock entry header not found")
    return serialize_entry_item(item, header)


@router.put("/{entry_id}", response_model=StockEntrySchema)
def update_stock_entry(
    entry_id: int,
    entry_update: StockEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockEntryItem).filter(StockEntryItem.id == entry_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    header = db.query(StockEntry).filter(StockEntry.id == item.entry_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock entry header not found")

    # Sauvegarder ancien impact
    old_product_id = item.product_id
    old_qte_kg = float(item.qte_kg or 0.0)
    old_qte_cartons = int(item.qte_cartons or 0)

    data = entry_update.dict(exclude_unset=True)

    # Mettre à jour entête si champs présents
    for field in ['date_reception', 'num_reception', 'num_reception_carnet', 'num_facture', 'num_packing_liste']:
        if field in data:
            setattr(header, field, data[field])

    # Mettre à jour item
    for field in ['product_id', 'qte_kg', 'qte_cartons', 'date_peremption', 'remarque']:
        if field in data:
            setattr(item, field, data[field])

    db.commit()
    db.refresh(item)
    db.refresh(header)

    # Ajuster le stock si quantités/produit ont changé
    new_product_id = item.product_id
    new_qte_kg = float(item.qte_kg or 0.0)
    new_qte_cartons = int(item.qte_cartons or 0)

    if old_product_id != new_product_id or old_qte_kg != new_qte_kg or old_qte_cartons != new_qte_cartons:
        # Annuler l'ancien impact
        prod_old = db.query(Product).filter(Product.id == old_product_id).first()
        if prod_old:
            prod_old.stock_actuel_kg = float(prod_old.stock_actuel_kg or 0.0) - old_qte_kg
            prod_old.stock_actuel_cartons = int(prod_old.stock_actuel_cartons or 0) - old_qte_cartons
        # Appliquer le nouveau
        prod_new = db.query(Product).filter(Product.id == new_product_id).first()
        if prod_new:
            prod_new.stock_actuel_kg = float(prod_new.stock_actuel_kg or 0.0) + new_qte_kg
            prod_new.stock_actuel_cartons = int(prod_new.stock_actuel_cartons or 0) + new_qte_cartons
        db.commit()

    return serialize_entry_item(item, header)


@router.delete("/{entry_id}")
def delete_stock_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockEntryItem).filter(StockEntryItem.id == entry_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    header = db.query(StockEntry).filter(StockEntry.id == item.entry_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock entry header not found")

    # Ajuster le stock en retirant les quantités de cette ligne
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product:
        product.stock_actuel_kg = float(product.stock_actuel_kg or 0.0) - float(item.qte_kg or 0.0)
        product.stock_actuel_cartons = int(product.stock_actuel_cartons or 0) - int(item.qte_cartons or 0)

    # Supprimer la ligne
    db.delete(item)
    db.commit()

    # Si plus aucune ligne sur l'entête, supprimer l'entête
    remaining = db.query(StockEntryItem).filter(StockEntryItem.entry_id == header.id).count()
    if remaining == 0:
        db.delete(header)
        db.commit()

    return {"message": "Stock entry item deleted successfully"}


@router.get("/by-product/{product_id}", response_model=List[StockEntrySchema])
def get_entries_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        db.query(StockEntryItem, StockEntry)
        .join(StockEntry, StockEntryItem.entry_id == StockEntry.id)
        .filter(StockEntryItem.product_id == product_id)
    )
    rows = q.all()
    return [serialize_entry_item(item, header) for (item, header) in rows]
