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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

function ProductDialog({ 
  open, 
  onClose, 
  onSubmit, 
  product = { code: "", name: "", description: "", unit: "", alertThreshold: 10 }, 
  onChange, 
  loading = false 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Nouveau Produit
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Code Produit"
                value={product.code}
                onChange={(e) => onChange({...product, code: e.target.value})}
                margin="normal"
                placeholder="Ex: PRD001"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nom du Produit"
                value={product.name}
                onChange={(e) => onChange({...product, name: e.target.value})}
                margin="normal"
                placeholder="Ex: Produit ABC"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={product.description}
                onChange={(e) => onChange({...product, description: e.target.value})}
                margin="normal"
                placeholder="Description détaillée du produit..."
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Unité de mesure</InputLabel>
                <Select
                  value={product.unit}
                  label="Unité de mesure"
                  onChange={(e) => onChange({...product, unit: e.target.value})}
                  disabled={loading}
                >
                  <MenuItem value="kg">Kilogrammes uniquement</MenuItem>
                  <MenuItem value="cartons">Cartons uniquement</MenuItem>
                  <MenuItem value="both">Kilogrammes et Cartons</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Seuil d'alerte"
                value={product.alertThreshold || 10}
                onChange={(e) => onChange({...product, alertThreshold: e.target.value})}
                margin="normal"
                placeholder="10"
                helperText="Quantité minimale avant alerte"
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
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Création...' : 'Créer le Produit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ProductDialog;
