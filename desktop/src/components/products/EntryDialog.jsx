import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Autocomplete,
} from '@mui/material';
import { Inventory as EntryIcon } from '@mui/icons-material';

function EntryDialog({ 
  open, 
  onClose, 
  onSubmit, 
  entry = {}, 
  onChange, 
  products = [],
  loading = false 
}) {

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const today = new Date().toISOString().split('T')[0];

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
          <EntryIcon color="success" />
          <Typography variant="h6" fontWeight="bold">
            Nouvelle Entrée de Stock
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Informations de réception */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Informations de Réception
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date de Réception"
                value={entry.receptionDate || today}
                onChange={(e) => onChange({...entry, receptionDate: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required
                fullWidth
                label="Numéro de Réception"
                value={entry.receptionNumber || ''}
                onChange={(e) => onChange({...entry, receptionNumber: e.target.value})}
                margin="normal"
                placeholder="REC-2024-001"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Numéro Carnet"
                value={entry.carnetNumber || ''}
                onChange={(e) => onChange({...entry, carnetNumber: e.target.value})}
                margin="normal"
                placeholder="CAR-001"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro Facture"
                value={entry.invoiceNumber || ''}
                onChange={(e) => onChange({...entry, invoiceNumber: e.target.value})}
                margin="normal"
                placeholder="FAC-2024-001"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro Packing Liste"
                value={entry.packingListNumber || ''}
                onChange={(e) => onChange({...entry, packingListNumber: e.target.value})}
                margin="normal"
                placeholder="PL-001"
                disabled={loading}
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
                value={entry.barcode || ''}
                onChange={(e) => onChange({...entry, barcode: e.target.value})}
                margin="normal"
                placeholder="Scannez ou saisissez le code-barre"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                value={products.find(p => p.id === entry.productId) || null}
                onChange={(e, newValue) => onChange({
                  ...entry, 
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
                disabled={loading}
              />
            </Grid>

            {/* Quantités */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Quantités
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required
                fullWidth
                type="number"
                label="Quantité (kg)"
                value={entry.quantityKg || ''}
                onChange={(e) => onChange({...entry, quantityKg: parseFloat(e.target.value) || 0})}
                margin="normal"
                inputProps={{ min: 0, step: 0.1 }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantité (cartons)"
                value={entry.quantityCartons || ''}
                onChange={(e) => onChange({...entry, quantityCartons: parseInt(e.target.value) || 0})}
                margin="normal"
                inputProps={{ min: 0, step: 1 }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Date de Péremption"
                value={entry.expirationDate || ''}
                onChange={(e) => onChange({...entry, expirationDate: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarques"
                multiline
                rows={3}
                value={entry.remarks || ''}
                onChange={(e) => onChange({...entry, remarks: e.target.value})}
                margin="normal"
                placeholder="Remarques supplémentaires..."
                disabled={loading}
              />
            </Grid>
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
            color="success"
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer l\'Entrée'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EntryDialog;
