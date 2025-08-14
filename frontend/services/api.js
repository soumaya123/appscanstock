import { Platform } from 'react-native';

// Détecte l'URL du backend
// Priorité : variable d'env EXPO_PUBLIC_API_BASE_URL, sinon valeur par défaut adaptée à l'environnement
// - Android émulateur: http://10.0.2.2:8000
// - Web/desktop: http://127.0.0.1:8000
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Ignorer si pas de JSON
  }
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
