import React from 'react';
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Assessment as ReportsIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import logo from '../../assets/smart_erp.png';

const drawerWidth = 260;

const menuItems = [
  { text: 'Tableau de Bord', icon: <DashboardIcon />, id: 'dashboard' },
  { text: 'Produits', icon: <InventoryIcon />, id: 'products' },
  { text: 'Ajustements de Stock', icon: <TrendingDownIcon />, id: 'adjustments' },
  { text: 'Entrées de Stock', icon: <TrendingUpIcon />, id: 'stock-in' },
  { text: 'Sorties de Stock', icon: <TrendingDownIcon />, id: 'stock-out' },
  { text: 'Mouvements', icon: <TimelineIcon />, id: 'movements' },
  { text: 'Rapports', icon: <ReportsIcon />, id: 'reports' },

  { text: 'Alertes Stock', icon: <WarningIcon />, id: 'alerts' },
];

const settingsItems = [
  { text: 'Paramètres', icon: <SettingsIcon />, id: 'settings' },
];

function Sidebar({ open, currentView, onViewChange }) {
  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%">
          <Box>
            <Box component="img" src={logo} alt="SmaertStock" sx={{ height: 90,width:90, display: 'block' }} />
           
          </Box>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => onViewChange(item.id)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: currentView === item.id ? 'bold' : 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mx: 2 }} />

      <List sx={{ px: 1, pb: 2 }}>
        {settingsItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => onViewChange(item.id)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: currentView === item.id ? 'bold' : 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export { drawerWidth };
export default Sidebar;
