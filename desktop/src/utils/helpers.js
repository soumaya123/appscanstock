// =====================================
// UTILITAIRES ET FONCTIONS HELPER
// =====================================

import { STORAGE_KEYS, FORMAT_CONFIG, DEFAULT_MESSAGES } from '../config';

// =====================================
// GESTION DU STOCKAGE LOCAL
// =====================================

export const storage = {
  /**
   * Récupérer une valeur du localStorage
   * @param {string} key - Clé de stockage
   * @param {*} defaultValue - Valeur par défaut
   * @returns {*} Valeur stockée ou valeur par défaut
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Sauvegarder une valeur dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à sauvegarder
   */
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
    }
  },

  /**
   * Supprimer une valeur du localStorage
   * @param {string} key - Clé de stockage
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
    }
  },

  /**
   * Vider complètement le localStorage
   */
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
    }
  }
};

// =====================================
// FORMATAGE DES DONNÉES
// =====================================

/**
 * Formater un nombre avec des séparateurs de milliers
 * @param {number} value - Nombre à formater
 * @param {number} decimals - Nombre de décimales
 * @returns {string} Nombre formaté
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Formater une devise
 * @param {number} value - Montant à formater
 * @param {string} currency - Code de devise
 * @returns {string} Montant formaté
 */
export const formatCurrency = (value, currency = 'TND') => {
  if (value === null || value === undefined || isNaN(value)) {
    return `0 ${currency}`;
  }
  return `${formatNumber(value, FORMAT_CONFIG.CURRENCY.decimals)} ${currency}`;
};

/**
 * Formater une date
 * @param {Date|string} date - Date à formater
 * @param {string} format - Format de sortie
 * @returns {string} Date formatée
 */
export const formatDate = (date, format = FORMAT_CONFIG.DATE_FORMAT) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'DD/MM/YYYY HH:mm':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      default:
        return dateObj.toLocaleDateString('fr-FR');
    }
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
};

/**
 * Formater une quantité avec unité
 * @param {number} quantity - Quantité
 * @param {string} unit - Unité
 * @returns {string} Quantité formatée
 */
export const formatQuantity = (quantity, unit = 'kg') => {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return `0 ${unit}`;
  }
  return `${formatNumber(quantity, 3)} ${unit}`;
};

// =====================================
// VALIDATION DES DONNÉES
// =====================================

/**
 * Valider une adresse email
 * @param {string} email - Adresse email
 * @returns {boolean} True si valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valider un numéro de téléphone
 * @param {string} phone - Numéro de téléphone
 * @returns {boolean} True si valide
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[0-9\s-()]{8,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Valider qu'une valeur n'est pas vide
 * @param {*} value - Valeur à valider
 * @returns {boolean} True si non vide
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Valider qu'un nombre est positif
 * @param {number} value - Nombre à valider
 * @returns {boolean} True si positif
 */
export const isPositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

// =====================================
// MANIPULATION DES CHAÎNES
// =====================================

/**
 * Capitaliser la première lettre d'une chaîne
 * @param {string} str - Chaîne à capitaliser
 * @returns {string} Chaîne capitalisée
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Tronquer une chaîne si elle dépasse la longueur maximale
 * @param {string} str - Chaîne à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Chaîne tronquée
 */
export const truncateString = (str, maxLength = 50) => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Générer un slug à partir d'une chaîne
 * @param {string} str - Chaîne à convertir
 * @returns {string} Slug généré
 */
export const generateSlug = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// =====================================
// UTILITAIRES POUR LES TABLEAUX
// =====================================

/**
 * Trier un tableau par une propriété
 * @param {Array} array - Tableau à trier
 * @param {string} property - Propriété de tri
 * @param {string} direction - Direction (asc/desc)
 * @returns {Array} Tableau trié
 */
export const sortArrayByProperty = (array, property, direction = 'asc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue > bValue ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filtrer un tableau par recherche textuelle
 * @param {Array} array - Tableau à filtrer
 * @param {string} searchTerm - Terme de recherche
 * @param {Array} searchFields - Champs dans lesquels chercher
 * @returns {Array} Tableau filtré
 */
export const filterArrayBySearch = (array, searchTerm, searchFields) => {
  if (!Array.isArray(array) || !searchTerm) return array;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearchTerm);
    });
  });
};

// =====================================
// UTILITAIRES POUR LES ERREURS
// =====================================

/**
 * Créer un message d'erreur standardisé
 * @param {string} message - Message d'erreur
 * @param {string} code - Code d'erreur
 * @returns {Object} Objet erreur
 */
export const createErrorMessage = (message, code = 'GENERIC_ERROR') => {
  return {
    type: 'error',
    message: message || DEFAULT_MESSAGES.ERROR_GENERIC,
    code,
    timestamp: new Date().toISOString()
  };
};

/**
 * Créer un message de succès standardisé
 * @param {string} message - Message de succès
 * @returns {Object} Objet succès
 */
export const createSuccessMessage = (message) => {
  return {
    type: 'success',
    message: message || DEFAULT_MESSAGES.SUCCESS_SAVE,
    timestamp: new Date().toISOString()
  };
};

// =====================================
// UTILITAIRES DIVERS
// =====================================

/**
 * Générer un ID unique
 * @returns {string} ID unique
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Attendre un délai spécifié
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise} Promise qui se résout après le délai
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Débouncer une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Délai d'attente
 * @returns {Function} Fonction débouncée
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Copier du texte dans le presse-papiers
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} True si succès
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    return false;
  }
};

// Export des constantes de stockage pour la compatibilité
export { STORAGE_KEYS };
