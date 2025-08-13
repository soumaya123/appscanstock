import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Button,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Padding,
} from '@mui/icons-material';

function ProductsTable({ 
  products = [],
  onEdit, 
  onDelete, 
  onView, 
  onAdd,
  title = "Gestion des Produits",
  showActions = true,
  maxRows = null 
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.nom_produit || product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.code_produit || product.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'low-stock') {
      return matchesSearch && (product.stock_actuel_kg <= (product.seuil_alerte || 0) || product.stock_actuel_cartons <= (product.seuil_alerte || 0));
    }
    if (filterStatus === 'out-of-stock') {
      return matchesSearch && (product.stock_actuel_kg === 0 && product.stock_actuel_cartons === 0);
    }
    return matchesSearch;
  });

  const displayProducts = maxRows ? filteredProducts.slice(0, maxRows) : filteredProducts;
  const paginatedProducts = maxRows ? displayProducts : filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStockStatus = (product) => {
    const totalStock = (product.stock_actuel_kg || 0) + (product.stock_actuel_cartons || 0);
    const threshold = product.seuil_alerte || 0;
    
    if (totalStock === 0) return { status: 'Rupture', color: 'error' };
    if (totalStock <= threshold) return { status: 'Stock Faible', color: 'warning' };
    return { status: 'En Stock', color: 'success' };
  };

  return (
    <Grid  xs={12} md={12} style={{ padding: "50px" }}>
    <Paper sx={{ borderRadius: 2 }} >
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          {onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
              sx={{ borderRadius: 2 }}
            >
              Nouveau Produit
            </Button>
          )}
        </Box>

        {!maxRows && (
          <Box display="flex" gap={2} mb={3}>
            <TextField
              size="small"
              placeholder="Rechercher par nom ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut Stock</InputLabel>
              <Select
                value={filterStatus}
                label="Statut Stock"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">Tous les produits</MenuItem>
                <MenuItem value="low-stock">Stock faible</MenuItem>
                <MenuItem value="out-of-stock">Rupture de stock</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nom du Produit</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock KG</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock Cartons</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Statut</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Prix Vente</TableCell>
                {showActions && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow 
                    key={product.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover' 
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {product.code_produit || product.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.nom_produit || product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock_actuel_kg || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock_actuel_cartons || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stockStatus.status}
                        color={stockStatus.color}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.prix_vente || 0} DT
                      </Typography>
                    </TableCell>
                    {showActions && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Voir détails">
                            <IconButton 
                              size="small" 
                              onClick={() => onView(product)}
                              sx={{ color: 'primary.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton 
                              size="small" 
                              onClick={() => onEdit(product)}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton 
                              size="small" 
                              onClick={() => onDelete(product)} 
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!maxRows && (
          <TablePagination
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </Box>
    </Paper>
    </Grid>
  );
}

export default ProductsTable;
