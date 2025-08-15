import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Autocomplete,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Grid,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Chip
} from '@mui/material';
import { ShoppingCart as ExitIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const exitTypes = [
  { value: 'vente', label: 'Vente', color: 'success' },
  { value: 'depot_vente', label: 'Dépôt Vente', color: 'info' },
  { value: 'don', label: 'Don', color: 'primary' },
  { value: 'perime', label: 'Périmé', color: 'warning' },
  { value: 'non_consommable', label: 'Non Consommable', color: 'error' },
  { value: 'non_utilisable', label: 'Non Utilisable', color: 'error' },
];

function ExitDialog({ 
  open, 
  onClose, 
  onSubmit, 
  exit = { items: [] }, 
  onChange = () => {}, 
  products = [],
  loading = false,
  userRole = 'user'
}) {
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(exit);
  };

  const handleAddItem = () => {
    const newItems = [...(exit.items || []), {
      productId: '',
      productCode: '',
      productName: '',
      barcode: '',
      quantityKg: 0,
      quantityCartons: 0,
      expirationDate: '',
      salePrice: 0,
      remarks: ''
    }];
    onChange?.({ ...exit, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = (exit.items || []).filter((_, i) => i !== index);
    onChange?.({ ...exit, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...(exit.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange?.({ ...exit, items: newItems });
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...(exit.items || [])];
    newItems[index] = {
      ...newItems[index],
      productId: product?.id || '',
      productCode: product?.code_produit || product?.code || '',
      productName: product?.nom_produit || product?.name || '',
      barcode: product?.code_barre || product?.barcode || ''
    };
    onChange?.({ ...exit, items: newItems });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ExitIcon color="warning" />
          <Typography variant="h6" fontWeight="bold">
            Nouvelle Sortie de Stock
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Informations de sortie */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Informations de Sortie
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date de Sortie"
                value={exit.exitDate || today}
                onChange={(e) => onChange({...exit, exitDate: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Type de Sortie</InputLabel>
                <Select
                  value={exit.type || ''}
                  label="Type de Sortie"
                  onChange={(e) => onChange({...exit, type: e.target.value})}
                  disabled={loading}
                >
                  {exitTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={type.label} 
                          color={type.color} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Numéro Facture"
                value={exit.invoiceNumber || ''}
                onChange={(e) => onChange({...exit, invoiceNumber: e.target.value})}
                margin="normal"
                placeholder="FAC-2024-001"
                disabled={loading}
                required={['vente', 'depot_vente'].includes(exit.type)}
              />
            </Grid>
          </Grid>
          <Box mb={3}>
            
            
            <TextField
              fullWidth
              label="Scanner Code-Barres"
              placeholder="Scannez un produit..."
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const code = e.target.value.trim();
                  if (!code) return;
                  const product = products.find(p => (p.code_barre || p.barcode) === code);
                  if (product) {
                    const newItems = [
                      ...(exit.items || []),
                      {
                        productId: product.id,
                        productCode: product.code_produit || product.code,
                        productName: product.nom_produit || product.name,
                        barcode: product.code_barre || product.barcode,
                        quantityKg: 0,
                        quantityCartons: 0,
                        expirationDate: '',
                        salePrice: 0,
                        remarks: ''
                      }
                    ];
                    onChange?.({ ...exit, items: newItems });
                    e.target.value = '';
                  } else alert('Produit non trouvé !');
                }
              }}
              sx={{ mt: 2 }}
            />
          </Box>

          {/* Tableau des articles */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">Articles</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} disabled={loading}>
                Ajouter un Article
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produit</TableCell>
                  <TableCell>Code-Barre</TableCell>
                  <TableCell>Quantité (kg)</TableCell>
                  <TableCell>Quantité (cartons)</TableCell>
                  <TableCell>Date Péremption</TableCell>
                  {userRole === 'responsable' && <TableCell>Prix de Vente</TableCell>}
                  <TableCell>Remarques</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(exit.items || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Autocomplete
                        options={products.filter(p => !(exit.items || []).some((it, i) => i !== index && it.productId === p.id))}
                        getOptionLabel={(option) => `${option.code_produit || option.code} - ${option.nom_produit || option.name}`}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(e, newValue) => handleProductSelect(index, newValue)}
                        renderInput={(params) => <TextField {...params} variant="outlined" size="small" />}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.barcode || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'barcode', e.target.value)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number" value={item.quantityKg || 0} size="small"
                        onChange={(e) => handleItemChange(index, 'quantityKg', parseFloat(e.target.value) || 0)}
                        inputProps={{ min:0, step:0.1 }} disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number" value={item.quantityCartons || 0} size="small"
                        onChange={(e) => handleItemChange(index, 'quantityCartons', parseInt(e.target.value) || 0)}
                        inputProps={{ min:0, step:1 }} disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date" value={item.expirationDate || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'expirationDate', e.target.value)}
                        InputLabelProps={{ shrink:true }} disabled={loading}
                      />
                    </TableCell>
                    {userRole === 'responsable' && (
                      <TableCell>
                        <TextField
                          type="number" value={item.salePrice || 0} size="small"
                          onChange={(e) => handleItemChange(index, 'salePrice', parseFloat(e.target.value) || 0)}
                          inputProps={{ min:0, step:0.01 }} disabled={loading}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <TextField
                        value={item.remarks || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Supprimer">
                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)} disabled={loading}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" color="warning" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer la Sortie'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ExitDialog;
