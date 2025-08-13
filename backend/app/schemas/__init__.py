from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

# Énumérations
class TypeSortie(str, Enum):
    VENTE = "vente"
    DEPOT_VENTE = "depot_vente"
    DON = "don"
    PERIME = "perime"
    NON_CONSOMMABLE = "non_consommable"
    NON_UTILISABLE = "non_utilisable"

class TypeMouvement(str, Enum):
    ENTREE = "ENTREE"
    SORTIE = "SORTIE"

# Schémas pour l'authentification
class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_active: bool = True
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Schémas pour les produits
class ProductBase(BaseModel):
    code_produit: str
    code_barre: Optional[str] = None
    nom_produit: str
    description: Optional[str] = None
    unite_kg: bool = True
    unite_cartons: bool = True
    prix_achat: float = 0.0
    prix_vente: float = 0.0
    seuil_alerte: float = 0.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code_produit: Optional[str] = None
    code_barre: Optional[str] = None
    nom_produit: Optional[str] = None
    description: Optional[str] = None
    unite_kg: Optional[bool] = None
    unite_cartons: Optional[bool] = None
    prix_achat: Optional[float] = None
    prix_vente: Optional[float] = None
    seuil_alerte: Optional[float] = None

class Product(ProductBase):
    id: int
    stock_actuel_kg: float
    stock_actuel_cartons: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schémas pour les entrées de stock
class StockEntryBase(BaseModel):
    date_reception: datetime
    num_reception: str
    num_reception_carnet: Optional[str] = None
    num_facture: Optional[str] = None
    num_packing_liste: Optional[str] = None
    product_id: int
    qte_kg: float = 0.0
    qte_cartons: int = 0
    date_peremption: Optional[datetime] = None
    remarque: Optional[str] = None

class StockEntryCreate(StockEntryBase):
    pass

class StockEntryUpdate(BaseModel):
    date_reception: Optional[datetime] = None
    num_reception: Optional[str] = None
    num_reception_carnet: Optional[str] = None
    num_facture: Optional[str] = None
    num_packing_liste: Optional[str] = None
    qte_kg: Optional[float] = None
    qte_cartons: Optional[int] = None
    date_peremption: Optional[datetime] = None
    remarque: Optional[str] = None

class StockEntry(StockEntryBase):
    id: int
    product: Product
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schémas pour les sorties de stock
class StockExitBase(BaseModel):
    date_sortie: datetime
    num_facture: Optional[str] = None
    product_id: int
    qte_kg: float = 0.0
    qte_cartons: int = 0
    date_peremption: Optional[datetime] = None
    prix_vente: Optional[float] = None
    type_sortie: TypeSortie
    remarque: Optional[str] = None

class StockExitCreate(StockExitBase):
    pass

class StockExitUpdate(BaseModel):
    date_sortie: Optional[datetime] = None
    num_facture: Optional[str] = None
    qte_kg: Optional[float] = None
    qte_cartons: Optional[int] = None
    date_peremption: Optional[datetime] = None
    prix_vente: Optional[float] = None
    type_sortie: Optional[TypeSortie] = None
    remarque: Optional[str] = None

class StockExit(StockExitBase):
    id: int
    product: Product
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schémas pour les mouvements de stock
class StockMovement(BaseModel):
    id: int
    product_id: int
    product: Product
    type_mouvement: TypeMouvement
    qte_kg_avant: float
    qte_cartons_avant: int
    qte_kg_mouvement: float
    qte_cartons_mouvement: int
    qte_kg_apres: float
    qte_cartons_apres: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schémas pour les rapports
class StockReport(BaseModel):
    product: Product
    total_entrees_kg: float
    total_entrees_cartons: int
    total_sorties_kg: float
    total_sorties_cartons: int
    stock_actuel_kg: float
    stock_actuel_cartons: int

class PeriodReport(BaseModel):
    date_debut: datetime
    date_fin: datetime
    total_produits: int
    total_entrees: int
    total_sorties: int
    valeur_stock: float
