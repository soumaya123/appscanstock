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
      console.log("response",response)
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
   * Créer plusieurs entrées de stock d'un coup (une réception avec plusieurs items)
   * @param {Object} batchData - { date_reception, num_reception, num_reception_carnet?, num_facture?, num_packing_liste?, items: [{ product_id, qte_kg, qte_cartons, date_peremption?, remarque? }] }
   * @returns {Promise} Liste des entrées créées
   */
  createBatch: async (batchData) => {
    const response = await apiClient.post('/stock-entries/batch', batchData);
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
        const entryDate = new Date(entry.date_reception || entry.created_at);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length;

      const monthlyExits = exits.filter(exit => {
        const exitDate = new Date(exit.date_sortie || exit.created_at);
        return exitDate.getMonth() === currentMonth && exitDate.getFullYear() === currentYear;
      }).length;

      // Produits avec stock faible
      const lowStockProducts = products.filter(product => (
        (product.stock_actuel_kg || 0) <= (product.seuil_alerte || 0) ||
        (product.stock_actuel_cartons || 0) <= (product.seuil_alerte || 0)
      ));

      // Groupes d'entrées par réception
      const entryGroupsMap = (entries || []).reduce((acc, e) => {
        const key = e.num_reception || '—';
        if (!acc[key]) {
          acc[key] = {
            num_reception: key,
            date_reception: e.date_reception,
            num_facture: e.num_facture,
            num_packing_liste: e.num_packing_liste,
            num_reception_carnet: e.num_reception_carnet,
            itemsCount: 0,
            total_kg: 0,
            total_cartons: 0,
          };
        }
        const g = acc[key];
        if (e.date_reception && new Date(e.date_reception) < new Date(g.date_reception)) {
          g.date_reception = e.date_reception;
        }
        g.itemsCount += 1;
        g.total_kg += (e.qte_kg || 0);
        g.total_cartons += (e.qte_cartons || 0);
        return acc;
      }, {});
      const entryGroups = Object.values(entryGroupsMap)
        .sort((a, b) => new Date(b.date_reception) - new Date(a.date_reception))
        .slice(0, 10);

      // Groupes de sorties par facture
      const exitGroupsMap = (exits || []).reduce((acc, x) => {
        const key = x.num_facture || `${(x.type_sortie || 'sortie')}-${new Date(x.date_sortie).toISOString().slice(0,10)}`;
        if (!acc[key]) {
          acc[key] = {
            num_facture: x.num_facture || '-',
            type_sortie: x.type_sortie,
            date_sortie: x.date_sortie,
            itemsCount: 0,
            total_kg: 0,
            total_cartons: 0,
          };
        }
        const g = acc[key];
        if (x.date_sortie && new Date(x.date_sortie) < new Date(g.date_sortie)) {
          g.date_sortie = x.date_sortie;
        }
        g.itemsCount += 1;
        g.total_kg += (x.qte_kg || 0);
        g.total_cartons += (x.qte_cartons || 0);
        return acc;
      }, {});
      const exitGroups = Object.values(exitGroupsMap)
        .sort((a, b) => new Date(b.date_sortie) - new Date(a.date_sortie))
        .slice(0, 10);

      const totalStock = products.reduce((sum, product) => sum + (product.stock_actuel_kg || 0), 0);

      return {
        totalProducts: products.length,
        totalStock,
        monthlyEntries,
        monthlyExits,
        lowStockProducts,
        recentActivities: [],
        entryGroups,
        exitGroups,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
};

// =====================================
// SERVICES MOUVEMENTS DE STOCK
// =====================================
export const movementService = {
  // Récupérer les mouvements pour un produit
  getByProduct: async (productId, params = {}) => {
    const response = await apiClient.get(`/reports/movements/${productId}`, { params });
    return response.data;
  },
  // Récupérer tous les mouvements (ou filtrer via params)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/reports/movements', { params });
    return response.data;
  }
};
export const adjustmentService = {
  /**
   * Récupérer toutes les sorties de stock
   * @param {Object} params - Paramètres de requête
   * @returns {Promise} Liste des sorties
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/adjustments/', { params });
    return response.data;
  },

  /**
   * Créer une nouvelle sortie de stock
   * @param {Object} exitData - Données de la sortie
   * @returns {Promise} Sortie créée
   */
  create: async (exitData) => {
    const response = await apiClient.post('/adjustments/', exitData);
    return response.data;
  },

  /**
   * Récupérer une sortie par ID
   * @param {string|number} id - ID de la sortie
   * @returns {Promise} Données de la sortie
   */
  getById: async (id) => {
    const response = await apiClient.get(`/adjustments/${id}/`);
    return response.data;
  },
};

export async function fetchExportData() {
  try {
    const response = await apiClient.get('/reports/export-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching export data:', error);
    throw error;
  }
}

// Export par défaut du client API
export default apiClient;
