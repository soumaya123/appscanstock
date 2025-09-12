from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db, StockExit, StockExitItem, Product, StockMovement
from app.schemas import (
    StockExit as StockExitSchema,  # ancien schéma item (aplati)
    StockExitUpdate,
    TypeSortie,
    User,
)
from app.routers.auth import get_current_active_user

router = APIRouter()


class StockExitItemInput(BaseModel):
    product_id: int
    qte_kg: float = 0.0
    qte_cartons: int = 0
    date_peremption: Optional[datetime] = None
    remarque: Optional[str] = None


class StockExitCreateFlexible(BaseModel):
    date_sortie: datetime
    num_facture: Optional[str] = None
    type_sortie: TypeSortie
    remarque: Optional[str] = None
    prix_vente: Optional[float] = None

    # Option A: items
    items: Optional[List[StockExitItemInput]] = None

    # Option B: un seul item (rétrocompat)
    product_id: Optional[int] = None
    qte_kg: Optional[float] = 0.0
    qte_cartons: Optional[int] = 0
    date_peremption: Optional[datetime] = None


# Utilitaires

def ensure_stock_available(product: Product, qte_kg: float, qte_cartons: int):
    if (product.stock_actuel_kg or 0.0) < float(qte_kg or 0.0):
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant en kg. Stock actuel: {product.stock_actuel_kg}, demandé: {qte_kg}",
        )
    if (product.stock_actuel_cartons or 0) < int(qte_cartons or 0):
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant en cartons. Stock actuel: {product.stock_actuel_cartons}, demandé: {qte_cartons}",
        )


def update_product_stock_on_exit(db: Session, product_id: int, qte_kg: float, qte_cartons: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
    ensure_stock_available(product, qte_kg, qte_cartons)
    old_kg = float(product.stock_actuel_kg or 0.0)
    old_cartons = int(product.stock_actuel_cartons or 0)
    product.stock_actuel_kg = old_kg - float(qte_kg or 0.0)
    product.stock_actuel_cartons = old_cartons - int(qte_cartons or 0)
    db.commit()
    return old_kg, old_cartons, product.stock_actuel_kg, product.stock_actuel_cartons


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
        created_by=user_id,
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


@router.post("/", response_model=List[StockExitSchema])
def create_stock_exit(
    payload: StockExitCreateFlexible,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Cas items[] recommandé
    if payload.items:
        header = StockExit(
            date_sortie=payload.date_sortie,
            num_facture=payload.num_facture,
            type_sortie=payload.type_sortie,
            remarque=payload.remarque,
            prix_vente=payload.prix_vente,
            created_by=current_user.id,
        )
        db.add(header)
        db.commit()
        db.refresh(header)

        created = []
        for it in payload.items:
            # Vérifier stock
            prod = db.query(Product).filter(Product.id == it.product_id).first()
            if prod is None:
                raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")
            ensure_stock_available(prod, it.qte_kg, it.qte_cartons)

            # Créer item
            item = StockExitItem(
                exit_id=header.id,
                product_id=it.product_id,
                qte_kg=it.qte_kg,
                qte_cartons=it.qte_cartons,
                date_peremption=it.date_peremption,
            )
            db.add(item)
            db.commit()
            db.refresh(item)

            # MAJ stock + mouvement
            old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_exit(
                db, it.product_id, it.qte_kg, it.qte_cartons
            )
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
                user_id=current_user.id,
            )

            created.append(serialize_exit_item(item, header))

        return created

    # Cas rétrocompat ligne unique
    if payload.product_id is None:
        raise HTTPException(status_code=400, detail="product_id is required when no items are provided")

    header = StockExit(
        date_sortie=payload.date_sortie,
        num_facture=payload.num_facture,
        type_sortie=payload.type_sortie,
        remarque=payload.remarque,
        prix_vente=payload.prix_vente,
        created_by=current_user.id,
    )
    db.add(header)
    db.commit()
    db.refresh(header)

    item = StockExitItem(
        exit_id=header.id,
        product_id=payload.product_id,
        qte_kg=float(payload.qte_kg or 0.0),
        qte_cartons=int(payload.qte_cartons or 0),
        date_peremption=payload.date_peremption,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    old_kg, old_cartons, new_kg, new_cartons = update_product_stock_on_exit(
        db, payload.product_id, item.qte_kg, item.qte_cartons
    )
    create_stock_movement_exit(
        db,
        payload.product_id,
        old_kg,
        old_cartons,
        item.qte_kg,
        item.qte_cartons,
        new_kg,
        new_cartons,
        reference_id=item.id,
        user_id=current_user.id,
    )

    return [serialize_exit_item(item, header)]


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
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(StockExitItem, StockExit).join(StockExit, StockExitItem.exit_id == StockExit.id)

    if product_id:
        q = q.filter(StockExitItem.product_id == product_id)
    if date_debut and date_fin:
        q = q.filter(and_(StockExit.date_sortie >= date_debut, StockExit.date_sortie <= date_fin))
    elif date_debut:
        q = q.filter(StockExit.date_sortie >= date_debut)
    elif date_fin:
        q = q.filter(StockExit.date_sortie <= date_fin)
    if type_sortie:
        q = q.filter(StockExit.type_sortie == type_sortie)
    if num_facture:
        q = q.filter(StockExit.num_facture.ilike(f"%{num_facture}%"))

    rows = q.offset(skip).limit(limit).all()
    return [
        {
            **serialize_exit_item(item, header),
            "remarque": header.remarque  # Include remarque in the response
        }
        for (item, header) in rows
    ]


@router.get("/{exit_id}", response_model=StockExitSchema)
def read_stock_exit(
    exit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockExitItem).filter(StockExitItem.id == exit_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    header = db.query(StockExit).filter(StockExit.id == item.exit_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock exit header not found")
    return serialize_exit_item(item, header)


@router.put("/{exit_id}", response_model=StockExitSchema)
def update_stock_exit(
    exit_id: int,
    exit_update: StockExitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockExitItem).filter(StockExitItem.id == exit_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    header = db.query(StockExit).filter(StockExit.id == item.exit_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock exit header not found")

    # Sauvegarde ancien état
    old_product_id = item.product_id
    old_qte_kg = float(item.qte_kg or 0.0)
    old_qte_cartons = int(item.qte_cartons or 0)

    data = exit_update.dict(exclude_unset=True)

    # Maj entête
    for field in ['date_sortie', 'num_facture', 'type_sortie', 'remarque']:
        if field in data:
            setattr(header, field, data[field])

    # Maj item
    for field in ['product_id', 'qte_kg', 'qte_cartons', 'date_peremption']:
        if field in data:
            setattr(item, field, data[field])

    # Vérifier disponibilité stock pour le nouveau état
    prod_new = db.query(Product).filter(Product.id == item.product_id).first()
    if prod_new is None:
        raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

    # Remettre l'ancien stock
    prod_old = db.query(Product).filter(Product.id == old_product_id).first()
    if prod_old:
        prod_old.stock_actuel_kg = float(prod_old.stock_actuel_kg or 0.0) + old_qte_kg
        prod_old.stock_actuel_cartons = int(prod_old.stock_actuel_cartons or 0) + old_qte_cartons

    # Consommer pour le nouveau
    ensure_stock_available(prod_new, float(item.qte_kg or 0.0), int(item.qte_cartons or 0))
    prod_new.stock_actuel_kg = float(prod_new.stock_actuel_kg or 0.0) - float(item.qte_kg or 0.0)
    prod_new.stock_actuel_cartons = int(prod_new.stock_actuel_cartons or 0) - int(item.qte_cartons or 0)

    db.commit()
    db.refresh(item)
    db.refresh(header)

    return serialize_exit_item(item, header)


@router.delete("/{exit_id}")
def delete_stock_exit(
    exit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    item = db.query(StockExitItem).filter(StockExitItem.id == exit_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Stock exit not found")
    header = db.query(StockExit).filter(StockExit.id == item.exit_id).first()
    if header is None:
        raise HTTPException(status_code=404, detail="Stock exit header not found")

    # Remise du stock
    prod = db.query(Product).filter(Product.id == item.product_id).first()
    if prod:
        prod.stock_actuel_kg = float(prod.stock_actuel_kg or 0.0) + float(item.qte_kg or 0.0)
        prod.stock_actuel_cartons = int(prod.stock_actuel_cartons or 0) + int(item.qte_cartons or 0)

    db.delete(item)
    db.commit()

    # Supprimer entête si plus d'items
    remaining = db.query(StockExitItem).filter(StockExitItem.exit_id == header.id).count()
    if remaining == 0:
        db.delete(header)
        db.commit()

    return {"message": "Stock exit item deleted successfully"}


@router.get("/by-product/{product_id}", response_model=List[StockExitSchema])
def get_exits_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = (
        db.query(StockExitItem, StockExit)
        .join(StockExit, StockExitItem.exit_id == StockExit.id)
        .filter(StockExitItem.product_id == product_id)
    )
    rows = q.all()
    return [serialize_exit_item(item, header) for (item, header) in rows]


@router.get("/by-type/{type_sortie}", response_model=List[StockExitSchema])
def get_exits_by_type(
    type_sortie: TypeSortie,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(StockExitItem, StockExit).join(StockExit, StockExitItem.exit_id == StockExit.id).filter(StockExit.type_sortie == type_sortie)
    rows = q.all()
    return [serialize_exit_item(item, header) for (item, header) in rows]
