import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

function StockCard({
  title = '',
  value = 0,
  unit = '',
  trend = null,
  color = 'textPrimary',
  icon = null,
  loading = false,
}) {
  // Forcer trend en nombre si une string est passée
  const numericTrend = trend !== null ? Number(trend) : null;

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={color} fontWeight="bold">
              {loading ? '...' : value}
            </Typography>
            {unit && (
              <Typography variant="body2" color="textSecondary">
                {unit}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              color: color,
              opacity: 0.8,
              fontSize: '3rem',
            }}
          >
            {React.isValidElement(icon) ? icon : null}
          </Box>
        </Box>

        {numericTrend !== null && !loading && (
          <Box display="flex" alignItems="center" mt={2}>
            {numericTrend > 0 ? (
              <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              color={numericTrend > 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(numericTrend)}% ce mois
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// PropTypes
StockCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  trend: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
  icon: PropTypes.element,
  loading: PropTypes.bool,
};

export default StockCard;
