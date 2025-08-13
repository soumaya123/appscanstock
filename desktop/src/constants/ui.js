// Constantes pour l'interface utilisateur

// Messages d'interface
export const UI_MESSAGES = {
  LOADING: {
    PRODUCTS: 'Chargement des produits...',
    ENTRIES: 'Chargement des entrées...',
    EXITS: 'Chargement des sorties...',
    STATS: 'Chargement des statistiques...',
    SAVING: 'Enregistrement en cours...',
    DELETING: 'Suppression en cours...',
    LOGIN: 'Connexion en cours...'
  },
  SUCCESS: {
    PRODUCT_CREATED: 'Produit créé avec succès',
    PRODUCT_UPDATED: 'Produit modifié avec succès',
    PRODUCT_DELETED: 'Produit supprimé avec succès',
    ENTRY_CREATED: 'Entrée de stock enregistrée avec succès',
    EXIT_CREATED: 'Sortie de stock enregistrée avec succès',
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGOUT_SUCCESS: 'Déconnexion réussie'
  },
  ERROR: {
    GENERIC: 'Une erreur est survenue',
    NETWORK: 'Erreur de connexion réseau',
    UNAUTHORIZED: 'Accès non autorisé',
    PRODUCT_NOT_FOUND: 'Produit introuvable',
    INVALID_DATA: 'Données invalides',
    LOGIN_FAILED: 'Échec de la connexion',
    PERMISSION_DENIED: 'Permission refusée'
  },
  CONFIRMATION: {
    DELETE_PRODUCT: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
    DELETE_ENTRY: 'Êtes-vous sûr de vouloir supprimer cette entrée ?',
    DELETE_EXIT: 'Êtes-vous sûr de vouloir supprimer cette sortie ?',
    LOGOUT: 'Êtes-vous sûr de vouloir vous déconnecter ?'
  },
  EMPTY_STATE: {
    NO_PRODUCTS: 'Aucun produit trouvé',
    NO_ENTRIES: 'Aucune entrée de stock',
    NO_EXITS: 'Aucune sortie de stock',
    NO_ACTIVITIES: 'Aucune activité récente',
    NO_NOTIFICATIONS: 'Aucune notification',
    NO_SEARCH_RESULTS: 'Aucun résultat trouvé pour votre recherche'
  }
};

// Labels pour les formulaires
export const FORM_LABELS = {
  PRODUCT: {
    CODE: 'Code Produit',
    NAME: 'Nom du Produit',
    DESCRIPTION: 'Description',
    UNIT: 'Unité de mesure',
    ALERT_THRESHOLD: 'Seuil d\'alerte',
    CURRENT_STOCK: 'Stock actuel'
  },
  ENTRY: {
    RECEPTION_DATE: 'Date de Réception',
    RECEPTION_NUMBER: 'Numéro de Réception',
    CARNET_NUMBER: 'Numéro Carnet',
    INVOICE_NUMBER: 'Numéro Facture',
    PACKING_LIST: 'Numéro Packing Liste',
    BARCODE: 'Code-Barre',
    PRODUCT: 'Produit',
    QUANTITY_KG: 'Quantité (kg)',
    QUANTITY_CARTONS: 'Quantité (cartons)',
    EXPIRATION_DATE: 'Date de Péremption',
    REMARKS: 'Remarques'
  },
  EXIT: {
    EXIT_DATE: 'Date de Sortie',
    TYPE: 'Type de Sortie',
    INVOICE_NUMBER: 'Numéro Facture',
    BARCODE: 'Code-Barre',
    PRODUCT: 'Produit',
    QUANTITY_KG: 'Quantité (kg)',
    QUANTITY_CARTONS: 'Quantité (cartons)',
    EXPIRATION_DATE: 'Date de Péremption',
    SALE_PRICE: 'Prix de Vente (DT)',
    REMARKS: 'Remarques'
  },
  AUTH: {
    USERNAME: 'Nom d\'utilisateur',
    PASSWORD: 'Mot de passe',
    REMEMBER_ME: 'Se souvenir de moi'
  }
};

// Placeholders pour les champs de saisie
export const PLACEHOLDERS = {
  SEARCH: 'Rechercher...',
  PRODUCT: {
    CODE: 'Ex: PRD001',
    NAME: 'Ex: Produit ABC',
    DESCRIPTION: 'Description détaillée du produit...'
  },
  ENTRY: {
    RECEPTION_NUMBER: 'REC-2024-001',
    CARNET_NUMBER: 'CAR-001',
    INVOICE_NUMBER: 'FAC-2024-001',
    PACKING_LIST: 'PL-001',
    BARCODE: 'Scannez ou saisissez le code-barre'
  },
  EXIT: {
    INVOICE_NUMBER: 'FAC-2024-001',
    BARCODE: 'Scannez ou saisissez le code-barre'
  }
};

// Titres des sections
export const SECTION_TITLES = {
  DASHBOARD: 'Tableau de Bord',
  PRODUCTS: 'Gestion des Produits',
  ENTRIES: 'Entrées de Stock',
  EXITS: 'Sorties de Stock',
  REPORTS: 'Rapports',
  SETTINGS: 'Paramètres',
  PROFILE: 'Profil Utilisateur'
};

// Titres des dialogs
export const DIALOG_TITLES = {
  NEW_PRODUCT: 'Nouveau Produit',
  EDIT_PRODUCT: 'Modifier le Produit',
  NEW_ENTRY: 'Nouvelle Entrée de Stock',
  EDIT_ENTRY: 'Modifier l\'Entrée',
  NEW_EXIT: 'Nouvelle Sortie de Stock',
  EDIT_EXIT: 'Modifier la Sortie',
  CONFIRMATION: 'Confirmation',
  ERROR: 'Erreur',
  INFO: 'Information'
};

// Textes des boutons
export const BUTTON_LABELS = {
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  DELETE: 'Supprimer',
  EDIT: 'Modifier',
  ADD: 'Ajouter',
  SEARCH: 'Rechercher',
  FILTER: 'Filtrer',
  EXPORT: 'Exporter',
  PRINT: 'Imprimer',
  REFRESH: 'Actualiser',
  LOGIN: 'Se connecter',
  LOGOUT: 'Se déconnecter',
  SUBMIT: 'Valider',
  CLOSE: 'Fermer',
  VIEW: 'Voir',
  DETAILS: 'Détails'
};

// Messages d'aide et tooltips
export const HELP_TEXTS = {
  PRODUCT: {
    CODE: 'Code unique pour identifier le produit',
    ALERT_THRESHOLD: 'Quantité minimale avant alerte de stock faible'
  },
  ENTRY: {
    RECEPTION_NUMBER: 'Numéro unique pour cette réception',
    EXPIRATION_DATE: 'Date limite de consommation du produit'
  },
  EXIT: {
    TYPE: 'Sélectionnez le motif de la sortie de stock',
    SALE_PRICE: 'Prix de vente unitaire (visible pour les responsables uniquement)'
  }
};

// Labels pour les statuts
export const STATUS_LABELS = {
  STOCK: {
    IN_STOCK: 'En Stock',
    LOW_STOCK: 'Stock Faible',
    OUT_OF_STOCK: 'Rupture',
    CRITICAL: 'Critique'
  },
  ORDER: {
    PENDING: 'En Attente',
    CONFIRMED: 'Confirmé',
    SHIPPED: 'Expédié',
    DELIVERED: 'Livré',
    CANCELLED: 'Annulé'
  },
  USER: {
    ACTIVE: 'Actif',
    INACTIVE: 'Inactif',
    PENDING: 'En Attente',
    SUSPENDED: 'Suspendu'
  }
};

// Navigation et menu
export const NAVIGATION = {
  BREADCRUMBS: {
    HOME: 'Accueil',
    DASHBOARD: 'Tableau de Bord',
    PRODUCTS: 'Produits',
    ENTRIES: 'Entrées',
    EXITS: 'Sorties',
    REPORTS: 'Rapports',
    SETTINGS: 'Paramètres'
  },
  MENU: {
    MAIN: 'Menu Principal',
    USER: 'Menu Utilisateur',
    NOTIFICATIONS: 'Notifications'
  }
};

// Formats d'affichage
export const DISPLAY_FORMATS = {
  DATE: {
    SHORT: 'DD/MM/YYYY',
    LONG: 'dddd DD MMMM YYYY',
    WITH_TIME: 'DD/MM/YYYY HH:mm'
  },
  NUMBER: {
    CURRENCY: '0,0.00 DT',
    WEIGHT: '0,0.0 kg',
    QUANTITY: '0,0'
  }
};

// Export par défaut
export default {
  UI_MESSAGES,
  FORM_LABELS,
  PLACEHOLDERS,
  SECTION_TITLES,
  DIALOG_TITLES,
  BUTTON_LABELS,
  HELP_TEXTS,
  STATUS_LABELS,
  NAVIGATION,
  DISPLAY_FORMATS
};
