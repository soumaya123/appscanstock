import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Inventory,
  Add as AddIcon,
  GetApp as EntryIcon,
  ShoppingCart as ExitIcon,
} from '@mui/icons-material';
import StockCard from '../common/StockCard';

function Dashboard({ 
  stockData = {},
  onNewProduct,
  onNewEntry,
  onNewExit,
  recentActivities = [],
  lowStockProducts = []
}) {
  // Conversion des données pour StockCard
  const stockStats = [
    {
      title: 'Produits Total',
      value: stockData.totalProducts || 0,
      trend: 5, // nombre, pas string
      color: 'primary.main',
      icon: <Inventory /> // élément React
    },
    {
      title: 'Stock Total (kg)',
      value: stockData.totalStock || 0,
      trend: 12, 
      color: 'success.main',
      icon: <TrendingUp />
    },
    {
      title: 'Entrées du Mois',
      value: stockData.monthlyEntries || 0,
      trend: 8, 
      color: 'info.main',
      icon: <EntryIcon />
    },
    {
      title: 'Sorties du Mois',
      value: stockData.monthlyExits || 0,
      trend: -3, 
      color: 'warning.main',
      icon: <ExitIcon />
    }
  ];

  return (
    <Box>
      {/* Header avec boutons d'actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Tableau de Bord
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewProduct}
            sx={{ borderRadius: 2 }}
          >
            Nouveau Produit
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<EntryIcon />}
            onClick={onNewEntry}
            sx={{ borderRadius: 2 }}
          >
            Entrée Stock
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<ExitIcon />}
            onClick={onNewExit}
            sx={{ borderRadius: 2 }}
          >
            Sortie Stock
          </Button>
        </Box>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} mb={4}>
        {stockStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StockCard
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              color={stat.color}
              icon={stat.icon}
            />
          </Grid>
        ))}
      </Grid>

      {/* Section inférieure avec activités récentes et alertes */}
      <Grid container spacing={3}>
        {/* Activités récentes */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2} color="primary.main">
              Activités Récentes
            </Typography>
            {recentActivities.length > 0 ? (
              <List>
                {recentActivities.slice(0, 8).map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.type === 'entry' ? (
                          <EntryIcon color="success" />
                        ) : activity.type === 'exit' ? (
                          <ExitIcon color="warning" />
                        ) : (
                          <AddIcon color="primary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${activity.date} - ${activity.user}`}
                      />
                    </ListItem>
                    {index < recentActivities.slice(0, 8).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} color="text.secondary">
                <Inventory sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  Aucune activité récente
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Les dernières actions sur le stock apparaîtront ici
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Alertes stock faible */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="warning.main">
                Alertes Stock
              </Typography>
            </Box>
            
            {lowStockProducts.length > 0 ? (
              <List>
                {lowStockProducts.slice(0, 5).map((product, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0, '&:hover': { bgcolor: 'warning.50', borderRadius: 1 } }}>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight="bold">{product.name}</Typography>}
                        secondary={<Typography variant="caption" color="warning.main">Stock: {product.currentStock} kg (Seuil: {product.alertThreshold} kg)</Typography>}
                      />
                    </ListItem>
                    {index < lowStockProducts.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4} color="text.secondary">
                <TrendingUp sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: 'success.main' }} />
                <Typography variant="body2" textAlign="center" color="success.main">
                  Tous les stocks sont au niveau optimal
                </Typography>
              </Box>
            )}

            {lowStockProducts.length > 5 && (
              <Box mt={2} textAlign="center">
                <Button size="small" color="warning" sx={{ borderRadius: 2 }}>
                  Voir tous ({lowStockProducts.length})
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
