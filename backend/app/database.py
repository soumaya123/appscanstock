from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stock_management.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modèles de base de données
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code_produit = Column(String(50), unique=True, index=True, nullable=False)
    code_barre = Column(String(100), unique=True, index=True, nullable=True)
    nom_produit = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    unite_kg = Column(Boolean, default=True)
    unite_cartons = Column(Boolean, default=True)
    prix_achat = Column(Float, default=0.0)
    prix_vente = Column(Float, default=0.0)
    stock_actuel_kg = Column(Float, default=0.0)
    stock_actuel_cartons = Column(Integer, default=0)
    seuil_alerte = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class StockEntry(Base):
    __tablename__ = "stock_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    date_reception = Column(DateTime(timezone=True), nullable=False)
    num_reception = Column(String(50), nullable=False)
    num_reception_carnet = Column(String(50), nullable=True)
    num_facture = Column(String(50), nullable=True)
    num_packing_liste = Column(String(50), nullable=True)

    # Entête: plus de produit/quantités ici. Les lignes sont dans StockEntryItem
    items = relationship("StockEntryItem", back_populates="entry", cascade="all, delete-orphan")
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_user = relationship("User")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockExit(Base):
    __tablename__ = "stock_exits"
    
    id = Column(Integer, primary_key=True, index=True)
    date_sortie = Column(DateTime(timezone=True), nullable=False)
    num_facture = Column(String(50), nullable=True)

    # Entête: lignes dans StockExitItem
    items = relationship("StockExitItem", back_populates="exit", cascade="all, delete-orphan")

    prix_vente = Column(Float, nullable=True)
    
    # Types de sortie
    type_sortie = Column(String(50), nullable=False)  # vente, depot_vente, don, perime, non_consommable, non_utilisable
    remarque = Column(Text, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_user = relationship("User")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockEntryItem(Base):
    __tablename__ = "stock_entry_items"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("stock_entries.id"), nullable=False)
    entry = relationship("StockEntry", back_populates="items")

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product")

    qte_kg = Column(Float, default=0.0)
    qte_cartons = Column(Integer, default=0)
    date_peremption = Column(DateTime(timezone=True), nullable=True)
    remarque = Column(Text, nullable=True)

class StockExitItem(Base):
    __tablename__ = "stock_exit_items"

    id = Column(Integer, primary_key=True, index=True)
    exit_id = Column(Integer, ForeignKey("stock_exits.id"), nullable=False)
    exit = relationship("StockExit", back_populates="items")

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product")

    qte_kg = Column(Float, default=0.0)
    qte_cartons = Column(Integer, default=0)
    date_peremption = Column(DateTime(timezone=True), nullable=True)
    remarque = Column(Text, nullable=True)

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product")
    
    type_mouvement = Column(String(20), nullable=False)  # ENTREE, SORTIE
    qte_kg_avant = Column(Float, default=0.0)
    qte_cartons_avant = Column(Integer, default=0)
    qte_kg_mouvement = Column(Float, default=0.0)
    qte_cartons_mouvement = Column(Integer, default=0)
    qte_kg_apres = Column(Float, default=0.0)
    qte_cartons_apres = Column(Integer, default=0)
    
    reference_id = Column(Integer, nullable=True)  # ID de l'entrée ou sortie
    reference_type = Column(String(20), nullable=True)  # ENTRY, EXIT
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    date_ajustement = Column(DateTime(timezone=True), nullable=False)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product")

    type_ajustement = Column(String(20), nullable=False)  # increase, decrease
    qte_kg = Column(Float, default=0.0)
    qte_cartons = Column(Integer, default=0)

    raison = Column(Text, nullable=False)
    reference_document = Column(String(100), nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_user = relationship("User")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
