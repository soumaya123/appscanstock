from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime

from app.database import get_db, Product, StockAdjustment, StockMovement
from app.schemas import (
    StockAdjustmentCreate,
    StockAdjustmentUpdate,
    StockAdjustment as StockAdjustmentSchema,
    AdjustmentType,
    User,
)
from app.routers.auth import get_current_active_user

router = APIRouter()

def create_stock_movement_for_adjustment(
    db: Session,
    product: Product,
    old_kg: float,
    old_cartons: int,
    delta_kg: float,
    delta_cartons: int,
    new_kg: float,
    new_cartons: int,
    reference_id: int,
    user_id: int,
):
    movement_type = "ENTREE" if delta_kg > 0 or delta_cartons > 0 else "SORTIE"
    movement = StockMovement(
        product_id=product.id,
        type_mouvement=movement_type,
        qte_kg_avant=old_kg,
        qte_cartons_avant=old_cartons,
        qte_kg_mouvement=delta_kg,
        qte_cartons_mouvement=delta_cartons,
        qte_kg_apres=new_kg,
        qte_cartons_apres=new_cartons,
        reference_id=reference_id,
        reference_type="ADJUSTMENT",
        created_by=user_id,
    )
    db.add(movement)
    db.commit()

@router.post("/", response_model=StockAdjustmentSchema)
def create_adjustment(
    payload: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_kg = float(product.stock_actuel_kg or 0.0)
    old_cartons = int(product.stock_actuel_cartons or 0)

    sign = 1 if payload.type_ajustement == AdjustmentType.INCREASE else -1
    delta_kg = sign * float(payload.qte_kg or 0.0)
    delta_cartons = sign * int(payload.qte_cartons or 0)

    new_kg = old_kg + delta_kg
    new_cartons = old_cartons + delta_cartons

    if new_kg < 0 or new_cartons < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative after adjustment")

    # Update product stock
    product.stock_actuel_kg = new_kg
    product.stock_actuel_cartons = new_cartons
    db.commit()

    # Create adjustment record
    adj = StockAdjustment(
        date_ajustement=payload.date_ajustement,
        product_id=payload.product_id,
        type_ajustement=payload.type_ajustement,
        qte_kg=payload.qte_kg,
        qte_cartons=payload.qte_cartons,
        raison=payload.raison,
        reference_document=payload.reference_document,
        created_by=current_user.id,
    )
    db.add(adj)
    db.commit()
    db.refresh(adj)

    # Log movement
    create_stock_movement_for_adjustment(
        db,
        product,
        old_kg,
        old_cartons,
        delta_kg,
        delta_cartons,
        new_kg,
        new_cartons,
        reference_id=adj.id,
        user_id=current_user.id,
    )

    return adj

@router.get("/", response_model=List[StockAdjustmentSchema])
def list_adjustments(
    product_id: Optional[int] = Query(None),
    type_ajustement: Optional[AdjustmentType] = Query(None),
    user_id: Optional[int] = Query(None),
    date_debut: Optional[datetime] = Query(None),
    date_fin: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(StockAdjustment)
    if product_id:
        q = q.filter(StockAdjustment.product_id == product_id)
    if type_ajustement:
        q = q.filter(StockAdjustment.type_ajustement == type_ajustement)
    if user_id:
        q = q.filter(StockAdjustment.created_by == user_id)
    if date_debut and date_fin:
        q = q.filter(and_(StockAdjustment.date_ajustement >= date_debut, StockAdjustment.date_ajustement <= date_fin))
    elif date_debut:
        q = q.filter(StockAdjustment.date_ajustement >= date_debut)
    elif date_fin:
        q = q.filter(StockAdjustment.date_ajustement <= date_fin)

    return q.order_by(StockAdjustment.date_ajustement.desc()).all()
