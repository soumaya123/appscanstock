import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import logo from '../../assets/smart_erp.png';

import { authService } from '../../services/api';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  console.log("username",username,"pwd",password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
   
    try {
      await authService.login(username, password);

      await onLogin({ username, password });
    } catch (err) {
      setError('Erreur de connexion. Vérifiez vos identifiants.');
      console.error('Erreur de connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center'
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
          }}>
            <Box sx={{
              width: 127,
              height: 127,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              
            }}
            component="img" src={logo} alt="SmaertStock"
            >
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              Système de Gestion de Stock Avancé
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  Connexion...
                </Box>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginForm;
