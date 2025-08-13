# 🚀 Guide de Démarrage Rapide

## 📋 Prérequis

- **Python 3.8+** installé
- **Node.js 18+** installé
- **npm** ou **yarn** installé

## 🔧 Installation et Configuration

### 1. **Backend (FastAPI)**

```bash
# Naviguer vers le dossier backend
cd "C:\Users\achref\Desktop\dossier posapplication mobile mahfoudh\backend"

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données et créer l'utilisateur admin
python init_db.py

# Démarrer le serveur backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. **Frontend (React + Vite)**

```bash
# Naviguer vers le dossier frontend
cd "C:\Users\achref\Desktop\dossier posapplication mobile mahfoudh\desktop"

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🌐 Accès à l'Application

### **Frontend**
- **URL**: http://localhost:3001
- **Interface**: Application de gestion de stock

### **Backend API**
- **URL**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## 🔐 Identifiants par Défaut

```
Username: admin
Password: admin123
```

## 📊 Endpoints API Principaux

### **Authentication**
- `POST /api/auth/token` - Authentification JWT
- `GET /api/auth/me` - Informations utilisateur actuel

### **Products**
- `GET /api/products/` - Liste tous les produits
- `POST /api/products/` - Créer un nouveau produit
- `PUT /api/products/{id}` - Modifier un produit
- `DELETE /api/products/{id}` - Supprimer un produit

### **Stock Entries**
- `GET /api/stock-entries/` - Liste toutes les entrées
- `POST /api/stock-entries/` - Créer une nouvelle entrée
- `GET /api/stock-entries/{id}` - Détails d'une entrée

### **Stock Exits**
- `GET /api/stock-exits/` - Liste toutes les sorties
- `POST /api/stock-exits/` - Créer une nouvelle sortie
- `GET /api/stock-exits/{id}` - Détails d'une sortie

## 🛠️ Dépannage

### **Erreur "Failed to load resource: 404"**
✅ **Solution**: Vérifier que le backend est démarré sur le port 8000

### **Erreur "Not authenticated"**
✅ **Solution**: Utiliser les identifiants `admin`/`admin123` pour se connecter

### **Erreur CORS**
✅ **Solution**: Le backend est configuré pour accepter les requêtes depuis localhost:3000 et localhost:3001

### **Backend ne démarre pas**
✅ **Solution**: 
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend ne démarre pas**
✅ **Solution**: 
```bash
cd desktop
npm install
npm run dev
```

## 📁 Structure du Projet

```
dossier posapplication mobile mahfoudh/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py            # Point d'entrée API
│   │   ├── database.py        # Configuration base de données
│   │   ├── routers/           # Endpoints API
│   │   └── schemas/           # Modèles Pydantic
│   ├── init_db.py             # Script d'initialisation
│   └── requirements.txt       # Dépendances Python
├── desktop/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants React modulaires
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── services/         # Services API
│   │   ├── config/           # Configuration
│   │   └── App.jsx           # Application principale
│   └── package.json          # Dépendances Node.js
└── README.md                 # Documentation
```

## 🔄 Commandes Utiles

### **Développement**
```bash
# Backend en mode développement
cd backend && python -m uvicorn app.main:app --reload

# Frontend en mode développement  
cd desktop && npm run dev

# Réinitialiser la base de données
cd backend && python init_db.py
```

### **Production**
```bash
# Build frontend pour production
cd desktop && npm run build

# Démarrer backend en production
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 📞 Support

En cas de problème :
1. Vérifier que le backend est démarré (http://localhost:8000/docs)
2. Vérifier que le frontend est démarré (http://localhost:3001)
3. Consulter les logs des terminaux pour les erreurs
4. Vérifier les identifiants de connexion

---

🎉 **Votre application de gestion de stock est maintenant prête à être utilisée !**
