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
import ProductDialog from './ProductDialog'; // 👈 import modal

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Padding,
} from '@mui/icons-material';
import { productService } from '../../services/api';

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
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    id: null,
    code: "",
    name: "",
    description: "",
    unit: "",
    alertThreshold: 10,
    barcode: "",
    pricePurchase: 0,
    priceSale: 0
  });

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

  const handleOpenModal = () => {
    setProduct({ id: null, code: "", name: "", description: "", unit: "", alertThreshold: 10, barcode: "", pricePurchase: 0, priceSale: 0 });
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  const resetProduct = () => setProduct({
    id: null,
    code: "",
    name: "",
    description: "",
    unit: "",
    alertThreshold: 10,
    barcode: "",
    pricePurchase: 0,
    priceSale: 0
  });

  const mapToBackendPayload = (p) => {
    const unite = p.unit || 'both';
    return {
      code_produit: p.code,
      code_barre: p.barcode || null,
      nom_produit: p.name,
      description: p.description || null,
      unite_kg: unite === 'kg' || unite === 'both',
      unite_cartons: unite === 'cartons' || unite === 'both',
      prix_achat: Number(p.pricePurchase || 0),
      prix_vente: Number(p.priceSale || 0),
      seuil_alerte: Number(p.alertThreshold || 0),
    };
  };

  const handleCreateProduct = async () => {
    setSaving(true);
    try {
      const payload = mapToBackendPayload(product);
      await productService.create(payload);
      handleCloseModal();
      resetProduct();
      // Optionnel: notifier le parent pour rafraîchir
      if (typeof onAdd === 'function') onAdd();
    } catch (err) {
      console.error('Erreur lors de la création du produit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setProduct({
      id: row.id,
      code: row.code_produit || '',
      name: row.nom_produit || '',
      description: row.description || '',
      unit: (row.unite_kg && row.unite_cartons) ? 'both' : (row.unite_kg ? 'kg' : (row.unite_cartons ? 'cartons' : '')),
      alertThreshold: row.seuil_alerte ?? 0,
      barcode: row.code_barre || '',
      pricePurchase: row.prix_achat ?? 0,
      priceSale: row.prix_vente ?? 0,
    });
    setOpenModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!product.id) return;
    setSaving(true);
    try {
      const payload = mapToBackendPayload(product);
      await productService.update(product.id, payload);
      handleCloseModal();
      resetProduct();
      if (typeof onEdit === 'function') onEdit();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du produit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await productService.delete(row.id);
      if (typeof onDelete === 'function') onDelete();
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err);
    }
  };

  return (
    <Grid  xs={12} md={12} style={{ padding: "50px" }}>
    <Paper sx={{ borderRadius: 2 }} >
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal} // 👈 ouvre le modal
              sx={{ borderRadius: 2 }}
            >
              Nouveau Produit
            </Button>
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
                              onClick={() => handleEdit(product)}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(product)} 
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
    <ProductDialog
      open={openModal}
      onClose={() => { handleCloseModal(); }}
      product={product}
      onChange={(updatedProduct) => setProduct(updatedProduct)}
      onSubmit={product.id ? handleUpdateProduct : handleCreateProduct}
      loading={saving}
    />
    </Grid>
  );
}

export default ProductsTable;
