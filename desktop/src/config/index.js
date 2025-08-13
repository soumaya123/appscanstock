// =====================================
// CONFIGURATION DE L'APPLICATION
// =====================================

// Configuration API
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  TIMEOUT: 10000, // 10 secondes
  ENDPOINTS: {
    // Authentification
    AUTH_TOKEN: '/auth/token',
    AUTH_REGISTER: '/auth/register',
    AUTH_ME: '/auth/me',
    
    // Produits
    PRODUCTS: '/products/',
    PRODUCTS_BY_ID: (id) => `/products/${id}/`,
    
    // Entrées de stock
    STOCK_ENTRIES: '/stock-entries/',
    STOCK_ENTRIES_BY_ID: (id) => `/stock-entries/${id}/`,
    
    // Sorties de stock
    STOCK_EXITS: '/stock-exits/',
    STOCK_EXITS_BY_ID: (id) => `/stock-exits/${id}/`,
  }
};

// Configuration de l'application
export const APP_CONFIG = {
  NAME: 'Système de Gestion de Stock',
  VERSION: '1.0.0',
  COMPANY: 'Mahfoudh Stock Management',
  COPYRIGHT: '© 2024 Mahfoudh Stock Management. Tous droits réservés.',
  DESCRIPTION: 'Application de gestion de stock pour entreprise',
};

// Configuration de l'interface utilisateur
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  DEFAULT_ROWS_PER_PAGE: 10,
  MAX_SEARCH_RESULTS: 100,
  NOTIFICATION_DURATION: 6000, // 6 secondes
  ANIMATION_DURATION: 300, // 300ms
};

// Clés de stockage local
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  SETTINGS: 'settings',
  FILTERS: 'filters',
  SIDEBAR_STATE: 'sidebarState',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// Configuration du stock
export const STOCK_CONFIG = {
  DEFAULT_ALERT_THRESHOLD: 10,
  LOW_STOCK_THRESHOLD: 50,
  CRITICAL_STOCK_THRESHOLD: 10,
  
  // Unités de mesure
  UNITS: [
    { value: 'kg', label: 'Kilogrammes', symbol: 'kg' },
    { value: 'g', label: 'Grammes', symbol: 'g' },
    { value: 'pieces', label: 'Pièces', symbol: 'pcs' },
    { value: 'cartons', label: 'Cartons', symbol: 'ctn' },
    { value: 'liters', label: 'Litres', symbol: 'L' }
  ],
  
  // Types de sorties
  EXIT_TYPES: [
    { value: 'vente', label: 'Vente', color: 'success', icon: 'sell' },
    { value: 'depot_vente', label: 'Dépôt Vente', color: 'info', icon: 'store' },
    { value: 'don', label: 'Don', color: 'primary', icon: 'volunteer_activism' },
    { value: 'perime', label: 'Périmé', color: 'warning', icon: 'schedule' },
    { value: 'non_consommable', label: 'Non Consommable', color: 'error', icon: 'block' },
    { value: 'non_utilisable', label: 'Non Utilisable', color: 'error', icon: 'dangerous' }
  ],
  
  // Statuts des produits
  STATUS_TYPES: [
    { value: 'all', label: 'Tous', color: 'default' },
    { value: 'in_stock', label: 'En Stock', color: 'success' },
    { value: 'low_stock', label: 'Stock Faible', color: 'warning' },
    { value: 'out_of_stock', label: 'Rupture', color: 'error' }
  ]
};

// Configuration des formats
export const FORMAT_CONFIG = {
  // Formats de date
  DATE_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  TIME_FORMAT: 'HH:mm',
  
  // Formats numériques
  CURRENCY_FORMAT: '0,0.00',
  QUANTITY_FORMAT: '0,0.000',
  PERCENTAGE_FORMAT: '0.00%',
  
  // Monnaie
  CURRENCY: {
    symbol: 'TND',
    name: 'Dinar Tunisien',
    decimals: 3
  }
};

// Configuration des rôles et permissions
export const PERMISSIONS_CONFIG = {
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    VIEWER: 'viewer'
  },
  
  PERMISSIONS: {
    // Produits
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    
    // Stock
    STOCK_VIEW: 'stock:view',
    STOCK_ENTRY: 'stock:entry',
    STOCK_EXIT: 'stock:exit',
    
    // Rapports
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    
    // Administration
    ADMIN_USERS: 'admin:users',
    ADMIN_SETTINGS: 'admin:settings'
  }
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  
  POSITIONS: {
    TOP_RIGHT: { vertical: 'top', horizontal: 'right' },
    TOP_LEFT: { vertical: 'top', horizontal: 'left' },
    BOTTOM_RIGHT: { vertical: 'bottom', horizontal: 'right' },
    BOTTOM_LEFT: { vertical: 'bottom', horizontal: 'left' }
  },
  
  DEFAULT_DURATION: 6000,
  ERROR_DURATION: 8000,
  SUCCESS_DURATION: 4000
};

// Configuration de l'environnement
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  DEBUG: process.env.NODE_ENV === 'development'
};

// Messages par défaut
export const DEFAULT_MESSAGES = {
  LOADING: 'Chargement en cours...',
  NO_DATA: 'Aucune donnée disponible',
  ERROR_GENERIC: 'Une erreur est survenue',
  SUCCESS_SAVE: 'Enregistrement réussi',
  SUCCESS_DELETE: 'Suppression réussie',
  CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  UNSAVED_CHANGES: 'Vous avez des modifications non sauvegardées. Voulez-vous continuer ?'
};

// Export centralisé de toute la configuration
export default {
  API_CONFIG,
  APP_CONFIG,
  UI_CONFIG,
  STORAGE_KEYS,
  STOCK_CONFIG,
  FORMAT_CONFIG,
  PERMISSIONS_CONFIG,
  NOTIFICATION_CONFIG,
  ENV_CONFIG,
  DEFAULT_MESSAGES
};
