from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import (
    get_db,
    StockEntry,
    StockExit,
    StockMovement,
    StockAdjustment,
    Product,
)
from app.schemas import User
from app.routers.auth import get_current_active_user

router = APIRouter()

@router.delete("/purge-transactions")
def purge_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Purger toutes les transactions (entrées, sorties, mouvements, ajustements)
    tout en conservant les produits. Les stocks des produits sont réinitialisés à 0.

    Sécurisé: réservé aux administrateurs.
    """
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    # Réinitialiser les stocks des produits
    products = db.query(Product).all()
    for p in products:
        p.stock_actuel_kg = 0.0
        p.stock_actuel_cartons = 0
    db.commit()

    # Supprimer l'historique des mouvements et ajustements d'abord
    db.query(StockMovement).delete(synchronize_session=False)
    db.query(StockAdjustment).delete(synchronize_session=False)

    # Supprimer les entrées et les sorties
    db.query(StockEntry).delete(synchronize_session=False)
    db.query(StockExit).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Transactions purgées avec succès",
        "deleted": True,
    }
