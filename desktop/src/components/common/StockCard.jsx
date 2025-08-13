import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

function StockCard({ title, value, unit, trend, color, icon, loading = false }) {
  return (
    <Card sx={{ 
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      }
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={color} fontWeight="bold">
              {loading ? '...' : value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {unit}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              color: color,
              opacity: 0.8,
              fontSize: '3rem'
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend !== undefined && !loading && (
          <Box display="flex" alignItems="center" mt={2}>
            {trend > 0 ? (
              <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
            )}
            <Typography 
              variant="body2" 
              color={trend > 0 ? "success.main" : "error.main"}
              fontWeight="medium"
            >
              {Math.abs(trend)}% ce mois
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StockCard;
