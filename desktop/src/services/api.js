import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config';
import { storage } from '../utils/helpers';

// Configuration d'axios
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
apiClient.interceptors.request.use(
  (config) => {
    // Éviter d'ajouter le token pour l'endpoint de connexion
    if (!config.url.includes('/auth/token')) {
      const token = storage.get(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré, nettoyer le stockage
      storage.remove(STORAGE_KEYS.TOKEN);
      storage.remove(STORAGE_KEYS.USER);
      // Rediriger vers la page de connexion (sera géré par l'application)
    }
    return Promise.reject(error);
  }
);

// =====================================
// SERVICES D'AUTHENTIFICATION
// =====================================

export const authService = {
  /**
   * Connexion utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise} Données de connexion
   */
  login: async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      // Utilisation de fetch pour éviter les interceptors axios sur l'authentification
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        storage.set(STORAGE_KEYS.TOKEN, data.access_token);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  /**
   * Inscription utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise} Données utilisateur
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Déconnexion utilisateur
   */
  logout: () => {
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.USER);
  },

  /**
   * Récupérer les informations de l'utilisateur actuel
   * @returns {Promise} Données utilisateur
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    storage.set(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },
};

// =====================================
// SERVICES PRODUITS
// =====================================

export const productService = {
  /**
   * Récupérer tous les produits
   * @param {Object} params - Paramètres de requête
   * @returns {Promise} Liste des produits
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/products/', { params });
    return response.data;
  },

  /**
   * Récupérer un produit par ID
   * @param {string|number} id - ID du produit
   * @returns {Promise} Données du produit
   */
  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouveau produit
   * @param {Object} productData - Données du produit
   * @returns {Promise} Produit créé
   */
  create: async (productData) => {
    const response = await apiClient.post('/products/', productData);
    return response.data;
  },

  /**
   * Mettre à jour un produit
   * @param {string|number} id - ID du produit
   * @param {Object} productData - Nouvelles données du produit
   * @returns {Promise} Produit mis à jour
   */
  update: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}/`, productData);
    return response.data;
  },

  /**
   * Supprimer un produit
   * @param {string|number} id - ID du produit
   * @returns {Promise} Confirmation de suppression
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/products/${id}/`);
    return response.data;
  },
};

// =====================================
// SERVICES ENTRÉES DE STOCK
// =====================================

export const stockEntryService = {
  /**
   * Récupérer toutes les entrées de stock
   * @param {Object} params - Paramètres de requête
   * @returns {Promise} Liste des entrées
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/stock-entries/', { params });
    return response.data;
  },

  /**
   * Créer une nouvelle entrée de stock
   * @param {Object} entryData - Données de l'entrée
   * @returns {Promise} Entrée créée
   */
  create: async (entryData) => {
    const response = await apiClient.post('/stock-entries/', entryData);
    return response.data;
  },

  /**
   * Récupérer une entrée par ID
   * @param {string|number} id - ID de l'entrée
   * @returns {Promise} Données de l'entrée
   */
  getById: async (id) => {
    const response = await apiClient.get(`/stock-entries/${id}/`);
    return response.data;
  },
};

// =====================================
// SERVICES SORTIES DE STOCK
// =====================================

export const stockExitService = {
  /**
   * Récupérer toutes les sorties de stock
   * @param {Object} params - Paramètres de requête
   * @returns {Promise} Liste des sorties
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/stock-exits/', { params });
    return response.data;
  },

  /**
   * Créer une nouvelle sortie de stock
   * @param {Object} exitData - Données de la sortie
   * @returns {Promise} Sortie créée
   */
  create: async (exitData) => {
    const response = await apiClient.post('/stock-exits/', exitData);
    return response.data;
  },

  /**
   * Récupérer une sortie par ID
   * @param {string|number} id - ID de la sortie
   * @returns {Promise} Données de la sortie
   */
  getById: async (id) => {
    const response = await apiClient.get(`/stock-exits/${id}/`);
    return response.data;
  },
};

// =====================================
// SERVICES STATISTIQUES
// =====================================

export const statsService = {
  /**
   * Récupérer les statistiques du tableau de bord
   * @returns {Promise} Données statistiques
   */
  getDashboardStats: async () => {
    try {
      // Récupérer les données en parallèle
      const [products, entries, exits] = await Promise.all([
        productService.getAll(),
        stockEntryService.getAll(),
        stockExitService.getAll()
      ]);

      // Calculer les statistiques
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyEntries = entries.filter(entry => {
        const entryDate = new Date(entry.receptionDate || entry.created_at);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length;

      const monthlyExits = exits.filter(exit => {
        const exitDate = new Date(exit.exitDate || exit.created_at);
        return exitDate.getMonth() === currentMonth && exitDate.getFullYear() === currentYear;
      }).length;

      // Produits avec stock faible
      const lowStockProducts = products.filter(product => 
        (product.currentStock || 0) < (product.alertThreshold || 50)
      );

      // Activités récentes
      const recentActivities = [
        ...entries.slice(0, 5).map(entry => ({
          type: 'entry',
          description: `Entrée: ${entry.productName || 'Produit'} - ${entry.quantityKg}kg`,
          date: new Date(entry.receptionDate || entry.created_at).toLocaleDateString(),
          user: 'Utilisateur'
        })),
        ...exits.slice(0, 5).map(exit => ({
          type: 'exit',
          description: `Sortie: ${exit.productName || 'Produit'} - ${exit.quantityKg}kg`,
          date: new Date(exit.exitDate || exit.created_at).toLocaleDateString(),
          user: 'Utilisateur'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

      const totalStock = products.reduce((sum, product) => sum + (product.currentStock || 0), 0);

      return {
        totalProducts: products.length,
        totalStock,
        monthlyEntries,
        monthlyExits,
        lowStockProducts,
        recentActivities
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
};

// Export par défaut du client API
export default apiClient;
