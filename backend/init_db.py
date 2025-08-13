"""
Script d'initialisation pour créer un utilisateur admin par défaut
"""
import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base, User
from app.routers.auth import get_password_hash

async def create_default_user():
    """Créer un utilisateur admin par défaut"""
    db = SessionLocal()
    try:
        # Vérifier si un utilisateur admin existe déjà
        existing_admin = db.query(User).filter(User.is_admin == True).first()
        if existing_admin:
            print(f"Admin existant trouvé: {existing_admin.username}")
            return existing_admin
        
        # Créer l'utilisateur admin par défaut
        admin_user = User(
            username="admin",
            email="admin@stockapp.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("Utilisateur admin créé avec succès:")
        print(f"  Username: {admin_user.username}")
        print(f"  Email: {admin_user.email}")
        print(f"  Password: admin123")
        
        return admin_user
    
    except Exception as e:
        print(f"Erreur lors de la création de l'utilisateur: {e}")
        db.rollback()
        return None
    finally:
        db.close()

async def create_sample_products():
    """Créer quelques produits d'exemple"""
    db = SessionLocal()
    try:
        from app.database import Product
        
        # Vérifier si des produits existent déjà
        existing_products = db.query(Product).count()
        if existing_products > 0:
            print(f"{existing_products} produits existants trouvés")
            return
        
        sample_products = [
            {
                "code_produit": "PROD001",
                "code_barre": "1234567890123",
                "nom_produit": "Café Arabica Premium",
                "description": "Café en grains de haute qualité",
                "prix_achat": 8.50,
                "prix_vente": 12.99,
                "seuil_alerte": 10.0
            },
            {
                "code_produit": "PROD002",
                "code_barre": "2345678901234",
                "nom_produit": "Thé Vert Bio",
                "description": "Thé vert biologique en sachet",
                "prix_achat": 5.20,
                "prix_vente": 8.75,
                "seuil_alerte": 20.0
            },
            {
                "code_produit": "PROD003",
                "code_barre": "3456789012345",
                "nom_produit": "Sucre Blanc",
                "description": "Sucre blanc raffiné en sac de 1kg",
                "prix_achat": 1.80,
                "prix_vente": 2.50,
                "seuil_alerte": 50.0
            }
        ]
        
        for product_data in sample_products:
            product = Product(**product_data)
            db.add(product)
        
        db.commit()
        print(f"{len(sample_products)} produits d'exemple créés avec succès")
        
    except Exception as e:
        print(f"Erreur lors de la création des produits: {e}")
        db.rollback()
    finally:
        db.close()

async def main():
    print("🚀 Initialisation de l'application de gestion de stock...")
    
    # Créer les tables
    print("📊 Création des tables de base de données...")
    Base.metadata.create_all(bind=engine)
    
    # Créer l'utilisateur admin
    print("👤 Création de l'utilisateur admin...")
    admin = await create_default_user()
    
    # Créer des produits d'exemple
    print("📦 Création de produits d'exemple...")
    await create_sample_products()
    
    print("✅ Initialisation terminée!")
    print("\n" + "="*50)
    print("INFORMATIONS DE CONNEXION")
    print("="*50)
    print("Username: admin")
    print("Password: admin123")
    print("API URL: http://localhost:8000")
    print("Documentation: http://localhost:8000/docs")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())
