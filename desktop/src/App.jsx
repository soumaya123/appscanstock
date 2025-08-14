import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert } from '@mui/material';

// Configuration et thème
import theme from './theme';
import { storage, STORAGE_KEYS } from './utils/helpers';

// Composants
import { LoginForm, Header, Sidebar, Dashboard, ProductsTable,StockInTable,StockOutTable, MovementsTable } from './components';
import { useProducts, useStockEntries, useStockExits, useDashboardStats } from './hooks/useApi';

// Services
import { authService } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = storage.get(STORAGE_KEYS.TOKEN);
        const savedUser = storage.get(STORAGE_KEYS.USER);

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error(error);
        storage.remove(STORAGE_KEYS.TOKEN);
        storage.remove(STORAGE_KEYS.USER);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const result = await authService.login(credentials.username, credentials.password);
      if (result.access_token) {
        const userData = { username: credentials.username };
        storage.set(STORAGE_KEYS.USER, JSON.stringify(userData));
        setUser(userData);
        showSnackbar('Connexion réussie !', 'success');
        return { success: true };
      }
    } catch (error) {
      showSnackbar('Erreur de connexion. Vérifiez vos identifiants.', 'error');
      return { success: false, error: error.message };
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setSelectedMenu('dashboard');
    showSnackbar('Déconnexion réussie', 'info');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const { products, fetchProducts } = useProducts();
  const { entries, fetchEntries } = useStockEntries();
  const { exits, fetchExits } = useStockExits();
  const { stats, fetchStats } = useDashboardStats();

  // Rafraîchir les produits après login et à l'ouverture de la vue Produits
  useEffect(() => {
    if (user) {
      fetchProducts().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedMenu === 'products') {
      fetchProducts().catch(() => {});
    }
  }, [selectedMenu, user]);

  // Rafraîchir les produits après login et à l'ouverture de la vue Produits
  useEffect(() => {
    if (user) {
      fetchProducts().catch(() => {});
      fetchEntries().catch(() => {});
      fetchExits().catch(() => {});
      fetchStats().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedMenu === 'products') {
      fetchProducts().catch(() => {});
    }
    if (user && selectedMenu === 'stock-in') {
      fetchEntries().catch(() => {});
    }
    if (user && selectedMenu === 'stock-out') {
      fetchExits().catch(() => {});
    }
    if (user && selectedMenu === 'dashboard') {
      fetchStats().catch(() => {});
    }
  }, [selectedMenu, user]);

  const renderMainContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <Dashboard
            stockData={{
              totalProducts: stats.totalProducts,
              totalStock: stats.totalStock,
              monthlyEntries: stats.monthlyEntries,
              monthlyExits: stats.monthlyExits,
            }}
            onNewProduct={() => setSelectedMenu('products')}
            onNewEntry={() => setSelectedMenu('stock-in')}
            onNewExit={() => setSelectedMenu('stock-out')}
            recentActivities={stats.recentActivities || []}
            lowStockProducts={stats.lowStockProducts || []}
          />
        );
      case 'products':
        return <ProductsTable 
            products={products}
            onAdd={() => { fetchProducts(); showSnackbar('Produit ajouté'); }}
            onEdit={() => { fetchProducts(); showSnackbar('Produit modifié'); }}
            onDelete={() => { fetchProducts(); showSnackbar('Produit supprimé'); }}
            onView={() => showSnackbar('Voir produit')}
        />;
      case 'stock-in':
          return <StockInTable 
                  entries={entries}
                  products={products}
                  onAdd={() => { fetchEntries(); fetchProducts(); fetchStats(); showSnackbar('Entrée stock enregistrée'); }}
                  onEdit={() => showSnackbar('Modifier entrée')}
                  onDelete={() => showSnackbar('Supprimer entrée')}
                  onView={() => showSnackbar('Voir entrée')}
                />;
      case 'stock-out':
        return <StockOutTable 
                exits={exits}
                products={products}
                onAdd={() => { fetchExits(); fetchProducts(); fetchStats(); showSnackbar('Sortie stock enregistrée'); }}
                onEdit={() => showSnackbar('Modifier sortie')}
                onDelete={() => showSnackbar('Supprimer sortie')}
                onView={() => showSnackbar('Voir sortie')}
              />;
      case 'movements':
        return <MovementsTable product={products[0] || null} products={products} />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          Chargement...
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginForm onLogin={handleLogin} />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          open={sidebarOpen}
          currentView={selectedMenu}      // Correction : correspond à la prop Sidebar
          onViewChange={setSelectedMenu}   // Correction : correspond à la prop Sidebar
        />
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Header
            user={user}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />
          <Box sx={{ flexGrow: 1, p: 3 }}>
            {renderMainContent()}
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
