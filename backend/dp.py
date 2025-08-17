"""
Script d'initialisation pour créer des entrées et sorties de stock d'exemple
"""
import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base, User, Product
from app.models import StockEntry, StockExit   # Assurez-vous que vos modèles existent

NUM_ENTRIES = 2000
NUM_EXITS = 2000


async def create_sample_stock_entries():
    """Créer des entrées de stock (stock_in) d'exemple"""
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        admin = db.query(User).filter(User.is_admin == True).first()

        if not products or not admin:
            print("❌ Pas de produits ou utilisateur admin trouvé. Abandon.")
            return

        existing = db.query(StockEntry).count()
        if existing > 0:
            print(f"{existing} entrées de stock déjà présentes")
            return

        print(f"📦 Génération de {NUM_ENTRIES} entrées de stock...")

        for i in range(NUM_ENTRIES):
            product = random.choice(products)
            entry = StockEntry(
                date_reception=datetime.now() - timedelta(days=random.randint(1, 365)),
                num_reception=f"REC-{i+1:05d}",
                num_reception_carnet=f"CARN-{i+1:05d}",
                num_facture=f"FACT-{random.randint(1000, 9999)}",
                num_packing_liste=f"PACK-{random.randint(1000, 9999)}",
                product_id=product.id,
                qte_kg=round(random.uniform(5.0, 200.0), 2),
                qte_cartons=random.randint(1, 50),
                date_peremption=datetime.now() + timedelta(days=random.randint(30, 365)),
                remarque="Entrée auto-générée",
                created_by=admin.id,
            )
            db.add(entry)

            if i % 200 == 0:
                db.commit()  # Commit par batch pour éviter surcharge mémoire

        db.commit()
        print("✅ Entrées de stock générées avec succès")

    except Exception as e:
        print(f"Erreur lors de la création des entrées de stock: {e}")
        db.rollback()
    finally:
        db.close()


async def create_sample_stock_exits():
    """Créer des sorties de stock (stock_out) d'exemple"""
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        admin = db.query(User).filter(User.is_admin == True).first()

        if not products or not admin:
            print("❌ Pas de produits ou utilisateur admin trouvé. Abandon.")
            return

        existing = db.query(StockExit).count()
        if existing > 0:
            print(f"{existing} sorties de stock déjà présentes")
            return

        print(f"📦 Génération de {NUM_EXITS} sorties de stock...")

        for i in range(NUM_EXITS):
            product = random.choice(products)
            exit_item = StockExit(
                date_sortie=datetime.now() - timedelta(days=random.randint(1, 365)),
                num_facture=f"FACT-{random.randint(1000, 9999)}",
                product_id=product.id,
                qte_kg=round(random.uniform(5.0, 200.0), 2),
                qte_cartons=random.randint(1, 50),
                date_peremption=datetime.now() + timedelta(days=random.randint(10, 365)),
                prix_vente=round(random.uniform(10.0, 300.0), 2),
                type_sortie=random.choice(["Vente", "Don", "Retour"]),
                remarque="Sortie auto-générée",
                created_by=admin.id,
            )
            db.add(exit_item)

            if i % 200 == 0:
                db.commit()

        db.commit()
        print("✅ Sorties de stock générées avec succès")

    except Exception as e:
        print(f"Erreur lors de la création des sorties de stock: {e}")
        db.rollback()
    finally:
        db.close()


async def main():
    print("🚀 Initialisation des mouvements de stock...")

    # Générer stock_in
    await create_sample_stock_entries()

    # Générer stock_out
    await create_sample_stock_exits()

    print("🎉 Données de stock générées avec succès")


if __name__ == "__main__":
    asyncio.run(main())
