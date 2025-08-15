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
  MenuItem
} from '@mui/material';
import { Tune as AdjustIcon } from '@mui/icons-material';

function AdjustmentDialog({
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  products = [],
  loading = false,
  currentStock = { kg: 0, cartons: 0 },
  previewStock = { kg: 0, cartons: 0 },
  canSubmit = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit?.(e);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AdjustIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Nouvel Ajustement</Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="Date"
                value={form.date || today}
                onChange={(e) => onChange?.({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Autocomplete
                options={products}
                getOptionLabel={(o) => `${o.code_produit || o.code} - ${o.nom_produit || o.name}`}
                value={form.product}
                onChange={(e, v) => onChange?.({ ...form, product: v })}
                renderInput={(params) => <TextField {...params} label="Produit" fullWidth />}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Type"
                value={form.type || 'increase'}
                onChange={(e) => onChange?.({ ...form, type: e.target.value })}
                fullWidth
                disabled={loading}
              >
                <MenuItem value="increase">Augmentation</MenuItem>
                <MenuItem value="decrease">Diminution</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="Quantité (kg)"
                value={form.qte_kg}
                onChange={(e) => onChange?.({ ...form, qte_kg: parseFloat(e.target.value || '0') })}
                inputProps={{ min: 0, step: 0.1 }}
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="Quantité (cartons)"
                value={form.qte_cartons}
                onChange={(e) => onChange?.({ ...form, qte_cartons: parseInt(e.target.value || '0', 10) })}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                label="Raison"
                value={form.raison}
                onChange={(e) => onChange?.({ ...form, raison: e.target.value })}
                required
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Référence document"
                value={form.reference}
                onChange={(e) => onChange?.({ ...form, reference: e.target.value })}
                fullWidth
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={3}>
                <Typography variant="body2" color="text.secondary">
                  Stock actuel: {currentStock.kg} kg · {currentStock.cartons} cartons
                </Typography>
                <Typography variant="body2" color={(previewStock.kg < 0 || previewStock.cartons < 0) ? 'error' : 'success.main'}>
                  Après ajustement: {previewStock.kg} kg · {previewStock.cartons} cartons
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={!canSubmit || loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AdjustmentDialog;
