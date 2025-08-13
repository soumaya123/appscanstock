import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Autocomplete,
  Chip,
  Alert,
} from '@mui/material';
import { ShoppingCart as ExitIcon, Warning as WarningIcon } from '@mui/icons-material';

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
  exit, 
  onChange, 
  products = [],
  loading = false,
  userRole = 'user' // 'user' ou 'responsable'
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const today = new Date().toISOString().split('T')[0];
  const selectedExitType = exitTypes.find(type => type.value === exit.type);
  const showPriceField = userRole === 'responsable' && ['vente', 'depot_vente'].includes(exit.type);
  const selectedProduct = products.find(p => p.id === exit.productId);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
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
                  value={exit.type}
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
                value={exit.invoiceNumber}
                onChange={(e) => onChange({...exit, invoiceNumber: e.target.value})}
                margin="normal"
                placeholder="FAC-2024-001"
                disabled={loading}
                required={['vente', 'depot_vente'].includes(exit.type)}
              />
            </Grid>

            {/* Informations produit */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Informations Produit
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code-Barre"
                value={exit.barcode}
                onChange={(e) => onChange({...exit, barcode: e.target.value})}
                margin="normal"
                placeholder="Scannez ou saisissez le code-barre"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                value={selectedProduct || null}
                onChange={(e, newValue) => onChange({
                  ...exit, 
                  productId: newValue?.id || '',
                  productCode: newValue?.code || '',
                  productName: newValue?.name || ''
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Produit"
                    margin="normal"
                    disabled={loading}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {option.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stock: {option.currentStock || 0} kg
                      </Typography>
                    </Box>
                  </Box>
                )}
                disabled={loading}
              />
            </Grid>

            {/* Alerte stock faible */}
            {selectedProduct && selectedProduct.currentStock < 50 && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2">
                    <strong>Attention :</strong> Le stock de ce produit est faible ({selectedProduct.currentStock} kg).
                    Veuillez vérifier avant de procéder à la sortie.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Quantités */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Quantités
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                required
                fullWidth
                type="number"
                label="Quantité (kg)"
                value={exit.quantityKg}
                onChange={(e) => onChange({...exit, quantityKg: e.target.value})}
                margin="normal"
                inputProps={{ min: 0, step: 0.1 }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Quantité (cartons)"
                value={exit.quantityCartons}
                onChange={(e) => onChange({...exit, quantityCartons: e.target.value})}
                margin="normal"
                inputProps={{ min: 0, step: 1 }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date de Péremption"
                value={exit.expirationDate}
                onChange={(e) => onChange({...exit, expirationDate: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>

            {/* Prix de vente (visible pour responsable uniquement) */}
            {showPriceField && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Prix de Vente (DT)"
                  value={exit.salePrice}
                  onChange={(e) => onChange({...exit, salePrice: e.target.value})}
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                  disabled={loading}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarques"
                multiline
                rows={3}
                value={exit.remarks}
                onChange={(e) => onChange({...exit, remarks: e.target.value})}
                margin="normal"
                placeholder="Remarques supplémentaires..."
                disabled={loading}
              />
            </Grid>

            {/* Information sur le type de sortie sélectionné */}
            {selectedExitType && (
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong>Type sélectionné :</strong> 
                    <Chip 
                      label={selectedExitType.label} 
                      color={selectedExitType.color} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {userRole !== 'responsable' && ['vente', 'depot_vente'].includes(exit.type) && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                      <WarningIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      Les prix de vente ne sont visibles que pour les responsables.
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="warning"
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la Sortie'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ExitDialog;
