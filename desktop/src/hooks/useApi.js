import { useState, useEffect, useCallback } from 'react';
import { 
  productService, 
  stockEntryService, 
  stockExitService, 
  statsService 
} from '../services/api';

// Hook pour gérer les produits
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error('Erreur produits:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const newProduct = await productService.create(productData);
      await fetchProducts();
      return newProduct;
    } catch (err) {
      setError('Erreur lors de la création du produit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (productId, productData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProduct = await productService.update(productId, productData);
      await fetchProducts();
      return updatedProduct;
    } catch (err) {
      setError('Erreur lors de la mise à jour du produit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    try {
      await productService.delete(productId);
      await fetchProducts();
    } catch (err) {
      setError('Erreur lors de la suppression du produit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};

// Hook pour gérer les entrées de stock
export const useStockEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockEntryService.getAll();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erreur lors du chargement des entrées');
      console.error('Erreur entrées:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entryData) => {
    setLoading(true);
    setError(null);
    try {
      const newEntry = await stockEntryService.create(entryData);
      await fetchEntries();
      return newEntry;
    } catch (err) {
      setError('Erreur lors de la création de l\'entrée');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry
  };
};

// Hook pour gérer les sorties de stock
export const useStockExits = () => {
  const [exits, setExits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockExitService.getAll();
      setExits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erreur lors du chargement des sorties');
      console.error('Erreur sorties:', err);
      setExits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExit = useCallback(async (exitData) => {
    setLoading(true);
    setError(null);
    try {
      const newExit = await stockExitService.create(exitData);
      await fetchExits();
      return newExit;
    } catch (err) {
      setError('Erreur lors de la création de la sortie');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExits]);

  useEffect(() => {
    fetchExits();
  }, [fetchExits]);

  return {
    exits,
    loading,
    error,
    fetchExits,
    createExit
  };
};

// Hook pour les statistiques du tableau de bord
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    monthlyEntries: 0,
    monthlyExits: 0,
    lowStockProducts: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statsService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Erreur stats:', err);
      setStats({
        totalProducts: 0,
        totalStock: 0,
        monthlyEntries: 0,
        monthlyExits: 0,
        lowStockProducts: [],
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};
