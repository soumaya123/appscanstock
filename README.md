# Application de Gestion de Stock

## Description
Application complète de gestion de stock avec interface React Native (mobile/desktop) et API Python FastAPI.

## Fonctionnalités

### Gestion des Entrées de Stock
- Date réception, Numéro réception, Numéro carnet
- Numéro facture, Numéro packing liste
- Code-barre, Code produit, Produit
- Quantités (kg, cartons), Date péremption
- Remarques et impression

### Gestion des Sorties de Stock
- Date sortie, Numéro facture
- Code-barre, Code produit, Produit
- Quantités (kg, cartons), Date péremption
- Prix de vente (visible pour responsable uniquement)
- Types de sortie : vente, dépôt vente, don, périmé, non consommable, non utilisable
- Remarques et impression

### Fonctionnalités Avancées
- Gestion des codes-barres
- Historique des mouvements de stock
- Rapports et statistiques
- Alertes de stock bas
- Gestion des dates de péremption
- Export PDF/Excel

## Architecture

### Backend (Python FastAPI)
- **API REST** avec FastAPI
- **Base de données** : SQLite (développement) / PostgreSQL (production)
- **Authentification** : JWT
- **ORM** : SQLAlchemy
- **Documentation** : Swagger UI automatique

### Frontend (React Native)
- **Mobile** : React Native avec Expo
- **Desktop** : React Native avec Tauri
- **UI** : React Native Elements
- **Navigation** : React Navigation
- **État** : Context API / Redux Toolkit

## Installation et Configuration

### Backend
```bash
cd backend

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env

# Initialiser la base de données
python init_db.py

# Démarrer le serveur
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application
npm start

# Pour mobile (Expo)
npx expo start

# Pour desktop (après configuration Tauri)
npm run tauri dev
```

## Informations de Connexion
- **Username**: admin
- **Password**: admin123
- **API URL**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/token` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Produits
- `GET /api/products/` - Liste des produits
- `POST /api/products/` - Créer un produit
- `GET /api/products/{id}` - Détails d'un produit
- `PUT /api/products/{id}` - Modifier un produit
- `DELETE /api/products/{id}` - Supprimer un produit

### Entrées de Stock
- `GET /api/stock-entries/` - Liste des entrées
- `POST /api/stock-entries/` - Créer une entrée
- `GET /api/stock-entries/{id}` - Détails d'une entrée
- `PUT /api/stock-entries/{id}` - Modifier une entrée

### Sorties de Stock
- `GET /api/stock-exits/` - Liste des sorties
- `POST /api/stock-exits/` - Créer une sortie
- `GET /api/stock-exits/{id}` - Détails d'une sortie
- `PUT /api/stock-exits/{id}` - Modifier une sortie

### Rapports
- `GET /api/reports/stock-summary` - Résumé du stock
- `GET /api/reports/period-report` - Rapport de période
- `GET /api/reports/pdf/stock-summary` - Export PDF
- `GET /api/reports/excel/stock-summary` - Export Excel

## Technologies Utilisées

### Backend
- FastAPI
- SQLAlchemy
- Alembic (migrations)
- JWT pour l'authentification
- ReportLab (PDF)
- OpenPyXL (Excel)

### Frontend
- React Native
- Expo (mobile)
- Tauri (desktop)
- React Navigation
- React Native Elements
- React Native Camera (codes-barres)

## Structure du Projet
```
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Prochaines Étapes
1. Configuration du frontend React Native
2. Intégration de la lecture de codes-barres
3. Développement des écrans mobile
4. Configuration Tauri pour desktop
5. Tests et déploiement
