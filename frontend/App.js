import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Button, TextInput, Snackbar, ActivityIndicator, Card, Divider, Appbar } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { API_BASE_URL } from './services/api';

// ============
// Helpers API
// ============
async function apiRequest(path, { method = 'GET', body, token, baseUrl } = {}) {
  const url = `${(baseUrl || API_BASE_URL)}${path}`;
  const headers = {
    'Accept': 'application/json',
  };
  let options = { method, headers };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (body instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = body.toString();
  } else if (body instanceof FormData) {
    options.body = body; // fetch gère le header Content-Type automatiquement
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { ok: res.ok, status: res.status, data };
}

// ==================
// Auth context/state
// ==================
const AuthContext = React.createContext({ token: null, setToken: () => {} });
const AppConfigContext = React.createContext({ baseUrl: API_BASE_URL, setBaseUrl: () => {} });

// ============
// Login Screen
// ============
function LoginScreen({ navigation }) {
  const { setToken } = React.useContext(AuthContext);
  const { baseUrl, setBaseUrl } = React.useContext(AppConfigContext);
  const [serverUrl, setServerUrl] = useState(baseUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => { setServerUrl(baseUrl); }, [baseUrl]);

  const onLogin = useCallback(async () => {
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);
      const res = await apiRequest('/api/auth/token', { method: 'POST', body: form, baseUrl: serverUrl });
      if (!res.ok || !res.data?.access_token) {
        throw new Error(res.data?.detail || 'Identifiants invalides');
      }
      const accessToken = res.data.access_token;
      await SecureStore.setItemAsync('token', accessToken);
      await SecureStore.setItemAsync('apiBaseUrl', serverUrl);
      setBaseUrl(serverUrl);
      setToken(accessToken);
    } catch (e) {
      setSnackbar({ visible: true, message: e.message || 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  }, [username, password, setToken]);

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        mode="outlined"
        label="URL du serveur"
        value={serverUrl}
        onChangeText={setServerUrl}
        autoCapitalize='none'
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize='none'
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading} style={styles.primaryBtn}>
        Se connecter
      </Button>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

// ================
// Dashboard Screen
// ================
function DashboardScreen({ navigation }) {
  const { token, setToken } = React.useContext(AuthContext);
  const { baseUrl } = React.useContext(AppConfigContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, monthlyEntries: 0, monthlyExits: 0 });

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
  }, [setToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [productsRes, entriesRes, exitsRes] = await Promise.all([
          apiRequest('/api/products/', { token, baseUrl }),
          apiRequest('/api/stock-entries/', { token, baseUrl }),
          apiRequest('/api/stock-exits/', { token, baseUrl })
        ]);
        if (!productsRes.ok || !entriesRes.ok || !exitsRes.ok) {
          throw new Error('Erreur de chargement des données');
        }
        const products = productsRes.data || [];
        const entries = entriesRes.data || [];
        const exits = exitsRes.data || [];

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

        const totalStock = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);

        if (mounted) {
          setStats({ totalProducts: products.length, totalStock, monthlyEntries, monthlyExits });
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Erreur');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.Content title="Tableau de bord" subtitle={`API: ${baseUrl}`} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.center}><Text>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.cards}>
          <Card style={styles.card}><Card.Title title="Produits" subtitle="Total" /><Card.Content><Text style={styles.metric}>{stats.totalProducts}</Text></Card.Content></Card>
          <Card style={styles.card}><Card.Title title="Stock total" subtitle="Unités" /><Card.Content><Text style={styles.metric}>{stats.totalStock}</Text></Card.Content></Card>
          <Card style={styles.card}><Card.Title title="Entrées" subtitle="Mois courant" /><Card.Content><Text style={styles.metric}>{stats.monthlyEntries}</Text></Card.Content></Card>
          <Card style={styles.card}><Card.Title title="Sorties" subtitle="Mois courant" /><Card.Content><Text style={styles.metric}>{stats.monthlyExits}</Text></Card.Content></Card>

          <Divider style={{ marginVertical: 16 }} />
          <Button mode="contained" onPress={() => navigation.navigate('Products')}>Aller aux produits</Button>
        </ScrollView>
      )}
    </View>
  );
}

// =================
// Products Screen
// =================
function ProductsScreen() {
  const { token } = React.useContext(AuthContext);
  const { baseUrl } = React.useContext(AppConfigContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      const res = await apiRequest('/api/products/', { token, baseUrl });
      if (!mounted) return;
      if (!res.ok) setError('Erreur de chargement');
      setProducts(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [token]);

  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.Content title="Produits" />
      </Appbar.Header>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.center}><Text>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {products.map((p) => (
            <Card key={p.id || p.name} style={styles.listItem}>
              <Card.Title title={p.name || 'Produit'} subtitle={`Stock: ${p.currentStock ?? 0}`} />
            </Card>
          ))}
          {products.length === 0 && <View style={styles.center}><Text>Aucun produit</Text></View>}
        </ScrollView>
      )}
    </View>
  );
}

// =================
// Root Application
// =================
const Stack = createNativeStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [checking, setChecking] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [baseUrl, setBaseUrl] = useState(API_BASE_URL);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
  }, []);

  // Charger token initial
  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync('token');
      setToken(t);
      setChecking(false);
    })();
  }, []);

  // Vérifier la santé backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiRequest('/health', { baseUrl });
      if (!mounted) return;
      setBackendStatus(res.ok ? 'online' : 'offline');
    })();
    return () => { mounted = false; };
  }, [baseUrl]);

  const authValue = useMemo(() => ({ token, setToken }), [token]);

  // Charger URL serveur sauvegardée
  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('apiBaseUrl');
      if (saved) setBaseUrl(saved);
    })();
  }, []);

  if (checking) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <View style={styles.center}><ActivityIndicator /></View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppConfigContext.Provider value={{ baseUrl, setBaseUrl }}>
          <AuthContext.Provider value={authValue}>
            {token ? (
              <View style={styles.containerRow}>
                <View style={styles.sidebar}>
                  <Text style={styles.sidebarTitle}>Menu</Text>
                  <TouchableOpacity onPress={() => setSelectedMenu('dashboard')}>
                    <Text style={styles.menuItem}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedMenu('products')}>
                    <Text style={styles.menuItem}>Produits</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedMenu('entries')}>
                    <Text style={styles.menuItem}>Entrées</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedMenu('exits')}>
                    <Text style={styles.menuItem}>Sorties</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedMenu('reports')}>
                    <Text style={styles.menuItem}>Rapports</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={signOut}>
                    <Text style={styles.menuItem}>Déconnexion</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.main}>
                  {selectedMenu === 'dashboard' && <DashboardScreen />}
                  {selectedMenu === 'products' && <ProductsScreen />}
                  {selectedMenu === 'entries' && <View style={styles.center}><Text>Entrées (à implémenter)</Text></View>}
                  {selectedMenu === 'exits' && <View style={styles.center}><Text>Sorties (à implémenter)</Text></View>}
                  {selectedMenu === 'reports' && <View style={styles.center}><Text>Rapports (à implémenter)</Text></View>}
                </View>
              </View>
            ) : (
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            )}
          </AuthContext.Provider>
        </AppConfigContext.Provider>

        <View style={styles.footer}>
          <Text style={styles.footerText}>API: {baseUrl} · Status: {backendStatus}</Text>
        </View>

        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// ============
// Styles
// ============
const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 12,
  },
  primaryBtn: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
  },
  cards: {
    padding: 12,
    gap: 12,
  },
  card: {
    marginBottom: 8,
  },
  metric: {
    fontSize: 28,
    fontWeight: '700',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  listItem: {
    marginBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  containerRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#2c3e50',
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  menuItem: {
    color: '#fff',
    paddingVertical: 12,
    fontSize: 14,
  },
  main: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
