# Copilot Instructions pour Application de Gestion de Stock

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Contexte du Projet
Cette application de gestion de stock utilise :
- **Backend** : Python avec FastAPI, SQLAlchemy, et base de données SQLite/PostgreSQL
- **Frontend** : React Native avec Expo pour mobile et Tauri pour desktop
- **Base de données** : Modèles pour gestion des stocks, entrées, sorties, produits, codes-barres

## Fonctionnalités Principales
1. **Gestion des Entrées de Stock** :
   - Date réception, Numéro réception, Numéro carnet
   - Numéro facture, Numéro packing liste
   - Code-barre, Code produit, Produit
   - Quantités (kg, cartons), Date péremption
   - Remarques et impression

2. **Gestion des Sorties de Stock** :
   - Date sortie, Numéro facture
   - Code-barre, Code produit, Produit
   - Quantités (kg, cartons), Date péremption
   - Prix de vente (visible pour responsable uniquement)
   - Types de sortie : vente, dépôt vente, don, périmé, non consommable, non utilisable
   - Remarques et impression

## Instructions de Développement
- Utiliser des modèles Pydantic pour la validation des données
- Implémenter l'authentification JWT pour la sécurité
- Utiliser React Native Elements ou NativeBase pour l'UI
- Intégrer la lecture de codes-barres avec react-native-camera
- Prévoir l'impression avec react-native-print
- Suivre les patterns REST API pour les endpoints
- Gérer les erreurs avec des réponses appropriées
- Documenter les APIs avec FastAPI Swagger
