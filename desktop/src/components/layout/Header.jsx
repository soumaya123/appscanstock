import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  DeleteForever as DeleteForeverIcon,
  Usb as UsbIcon,
} from '@mui/icons-material';
import apiClient, { authService } from '../../services/api';

function Header({ sidebarOpen, onToggleSidebar, drawerWidth }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const handlePurgeTransactions = async () => {
    const ok = window.confirm(
      "Supprimer toutes les transactions (entrées, sorties, mouvements, ajustements) et réinitialiser les stocks ? Les produits seront conservés."
    );
    if (!ok) return;
    try {
      await apiClient.delete('/maintenance/purge-transactions');
      alert('Transactions supprimées. Les stocks ont été réinitialisés.');
      window.location.reload();
    } catch (e) {
      if (e?.response?.status === 403) {
        alert("Action réservée à l'administrateur.");
      } else if (e?.response?.data?.detail) {
        alert(`Erreur: ${e.response.data.detail}`);
      } else {
        alert('Erreur lors de la purge des transactions.');
      }
    }
  };

  const handleUsbSync = async () => {
    try {
      // Vérifiez si l'URL est correcte
      console.log("Tentative de récupération des données depuis /export-data...");
      const response = await apiClient.get('/reports/export-data');
      const data = response.data;

      // Créer un fichier JSON à télécharger
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      alert("✅ Données exportées ! Transférez le fichier 'data.json' sur le mobile.");
    } catch (error) {
      console.error("Erreur lors de l'export USB :", error);
      if (error.response && error.response.status === 404) {
        alert("❌ L'endpoint '/export-data' est introuvable. Veuillez vérifier la configuration du backend.");
      } else {
        alert("Impossible d'exporter les données. Veuillez réessayer plus tard.");
      }
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
        ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Notifications */}
          <IconButton 
            color="inherit" 
            onClick={(e) => setNotificationAnchor(e.currentTarget)}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => setNotificationAnchor(null)}>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Stock faible détecté
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  3 produits en stock critique
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => setNotificationAnchor(null)}>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Nouvelle entrée de stock
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Réception de marchandises
                </Typography>
              </Box>
            </MenuItem>
          </Menu>

          {/* Profile Menu */}
          <IconButton 
            color="inherit" 
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              A
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => setAnchorEl(null)}>
              <Box sx={{ mr: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Administrateur
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  admin@stockerp.com
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)}>
              <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
              Paramètres
            </MenuItem>
            <MenuItem onClick={handlePurgeTransactions}>
              <DeleteForeverIcon sx={{ mr: 1, color: 'error.main' }} fontSize="small" />
              Purger les transactions
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Déconnexion
            </MenuItem>
            <MenuItem onClick={handleUsbSync}>
              <UsbIcon sx={{ mr: 1 }} fontSize="small" />
              Charger via USB
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
