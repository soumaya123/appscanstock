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
} from '@mui/icons-material';
import { authService } from '../../services/api';

function Header({ sidebarOpen, onToggleSidebar, drawerWidth }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
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
          Système de Gestion de Stock
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
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
