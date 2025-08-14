import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Typography, Box
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

function ProductDialog({ 
  open, 
  onClose, 
  onSubmit, 
  product = { code: "", name: "", description: "", unit: "", alertThreshold: 10, barcode: "" }, 
  onChange, 
  loading = false 
}) {
  const [scanValue, setScanValue] = useState("");

  const safeOnChange = (updatedProduct) => {
    if (typeof onChange === "function") {
      onChange(updatedProduct);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(e);
  };

  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const scannedCode = scanValue.trim();

      safeOnChange({
        ...product,
        code: scannedCode,
        barcode: scannedCode
      });

      onSubmit && onSubmit({ ...product, code: scannedCode, barcode: scannedCode });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scanner Code-Barres / QR Code"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={handleScan}
                margin="normal"
                placeholder="Scannez ou saisissez le code..."
                disabled={loading}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Code Produit"
                value={product.code}
                onChange={(e) => safeOnChange({ ...product, code: e.target.value })}
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
                onChange={(e) => safeOnChange({ ...product, name: e.target.value })}
                margin="normal"
                placeholder="Ex: Produit ABC"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Unité de mesure</InputLabel>
                <Select
                  value={product.unit}
                  label="Unité de mesure"
                  onChange={(e) => safeOnChange({ ...product, unit: e.target.value })}
                  disabled={loading}
                >
                  <MenuItem value="kg">Kg </MenuItem>
                  <MenuItem value="cartons">Cartons</MenuItem>
                  <MenuItem value="both">Kg et Cartons</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Seuil d'alerte"
                value={product.alertThreshold || 10}
                onChange={(e) => safeOnChange({ ...product, alertThreshold: e.target.value })}
                margin="normal"
                placeholder="10"
                helperText="Quantité minimale avant alerte"
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
                onChange={(e) => safeOnChange({ ...product, description: e.target.value })}
                margin="normal"
                placeholder="Description détaillée du produit..."
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? 'Création...' : 'Créer le Produit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ProductDialog;
