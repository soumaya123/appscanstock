import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

function InfoRow({ label, value }) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}

const formatDateTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
};

function ProductDetailsDialog({ open, onClose, product }) {
  const p = product || {};
  const code = p.code_produit || p.code || '—';
  const name = p.nom_produit || p.name || '—';
  const barcode = p.code_barre || p.barcode || '—';
  const description = p.description || '—';
  const uniteKg = p.unite_kg ?? (p.unit ? (p.unit === 'kg' || p.unit === 'both') : undefined);
  const uniteCartons = p.unite_cartons ?? (p.unit ? (p.unit === 'cartons' || p.unit === 'both') : undefined);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ViewIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Détails du Produit</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {code} — {name}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoRow label="Code Produit" value={code} />
            <InfoRow label="Nom du Produit" value={name} />
            <InfoRow label="Code-barres" value={barcode} />
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>Unités</Typography>
              <Box display="flex" gap={1}>
                <Chip size="small" label="KG" color={uniteKg ? 'success' : 'default'} variant={uniteKg ? 'filled' : 'outlined'} />
                <Chip size="small" label="Cartons" color={uniteCartons ? 'success' : 'default'} variant={uniteCartons ? 'filled' : 'outlined'} />
              </Box>
            </Box>
            <InfoRow label="Seuil d'alerte" value={(p.seuil_alerte ?? p.alertThreshold ?? 0).toString()} />
            <InfoRow label="Prix d'achat" value={`${p.prix_achat ?? p.pricePurchase ?? 0}`} />
            <InfoRow label="Prix de vente" value={`${p.prix_vente ?? p.priceSale ?? 0}`} />
          </Grid>

          <Grid item xs={12} md={6}>
            <InfoRow label="Stock actuel (kg)" value={(p.stock_actuel_kg ?? 0).toString()} />
            <InfoRow label="Stock actuel (cartons)" value={(p.stock_actuel_cartons ?? 0).toString()} />
            <InfoRow label="Créé le" value={formatDateTime(p.created_at)} />
            <InfoRow label="Mis à jour le" value={formatDateTime(p.updated_at)} />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography variant="body2">{description}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductDetailsDialog;
