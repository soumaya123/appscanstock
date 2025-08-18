#!/usr/bin/env python3
"""
Initialisation de la base de données.
- Supprime toutes les tables existantes (DROP ALL)
- Recrée toutes les tables selon les modèles actuels

ATTENTION: Cette opération efface toutes les données.
"""
from app.database import engine, Base

if __name__ == "__main__":
    print("[init] Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("[init] Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("[init] Done.")
