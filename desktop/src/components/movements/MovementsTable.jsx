import React, { useEffect, useState } from 'react';
import {
  Paper, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, InputAdornment, Grid, Chip, TablePagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, MenuItem
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon, Print as PrintIcon, GetApp as ExportIcon, Close as CloseIcon } from '@mui/icons-material';
import { movementService, stockEntryService, stockExitService } from '../../services/api';

// Affiche les mouvements et le solde d'un produit
function MovementsTable({ product, products = [] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(product || null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);

  useEffect(() => {
    // Laisser l'utilisateur choisir le produit (aucune auto-sélection)
  }, [products]);

  useEffect(() => {
    let ignore = false;
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const data = selectedProduct?.id
          ? await movementService.getByProduct(selectedProduct.id)
          : await movementService.getAll();
        if (!ignore) setMovements(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setMovements([]);
        console.error('Erreur chargement mouvements:', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchMovements();
    return () => { ignore = true; };
  }, [selectedProduct?.id]);

  const filtered = movements.filter(m => {
    const ref = `${m.reference_type || ''}-${m.reference_id || ''}`.toLowerCase();
    return ref.includes(search.toLowerCase());
  });

  const display = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const chipColor = (type) => type === 'ENTREE' ? 'success' : 'error';

  return (
    <Grid xs={12} md={12} style={{ padding: '50px' }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              {selectedProduct ? `Mouvements - ${selectedProduct.nom_produit || selectedProduct.name}` : 'Sélectionnez un produit'}
            </Typography>
            {selectedProduct && (
              <Typography variant="body2" color="text.secondary">
                Solde: {selectedProduct.stock_actuel_kg || 0} kg · {selectedProduct.stock_actuel_cartons || 0} cartons
              </Typography>
            )}
          </Box>

          <Box mb={2} display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Rechercher par référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            {/* Sélecteur de produit */}
            <TextField
              select
              size="small"
              label="Produit"
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find(pr => String(pr.id) === String(e.target.value));
                setSelectedProduct(p || null);
              }}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">
                Sélectionner produit
              </MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.code_produit || p.code)} - {(p.nom_produit || p.name)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" size="small" startIcon={<ExportIcon />} onClick={async () => {
              // Export XLSX des mouvements filtrés
              const loadXLSX = async () => {
                if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
                const mod = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
                return (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : (mod.XLSX || mod.default || mod);
              };
              try {
                const XLSX = await loadXLSX();
                const rows = filtered.map(m => ({
                  id: m.id,
                  date: new Date(m.created_at).toISOString(),
                  type: m.type_mouvement,
                  kg_avant: m.qte_kg_avant,
                  kg_mouvement: m.qte_kg_mouvement,
                  kg_apres: m.qte_kg_apres,
                  cartons_avant: m.qte_cartons_avant,
                  cartons_mouvement: m.qte_cartons_mouvement,
                  cartons_apres: m.qte_cartons_apres,
                  produit: selectedProduct ? (selectedProduct.code_produit || selectedProduct.name) : (m.product?.code_produit || m.product?.name || m.product_id),
                  reference: `${m.reference_type || ''} #${m.reference_id || ''}`
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Mouvements');
                const name = `mouvements_${selectedProduct?.code_produit || selectedProduct?.name || 'tous'}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
                XLSX.writeFile(wb, name);
              } catch (err) {
                console.error('Export XLSX échoué:', err);
                alert('Export XLSX échoué');
              }
            }}>Exporter</Button>
            </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {!selectedProduct && <TableCell>Produit</TableCell>}
                <TableCell>Type</TableCell>
                <TableCell align="right">Avant (kg)</TableCell>
                <TableCell align="right">Mouv. (kg)</TableCell>
                <TableCell align="right">Après (kg)</TableCell>
                <TableCell align="right">Avant (cartons)</TableCell>
                <TableCell align="right">Mouv. (cartons)</TableCell>
                <TableCell align="right">Après (cartons)</TableCell>
                <TableCell>Référence</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9}>Chargement...</TableCell></TableRow>
              ) : display.length === 0 ? (
                <TableRow><TableCell colSpan={9}>{selectedProduct ? 'Aucun mouvement' : 'Sélectionnez un produit'}</TableCell></TableRow>
              ) : (
                display.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                    {!selectedProduct && (
                      <TableCell>{m.product?.code_produit || m.product?.name || m.product_id}</TableCell>
                    )}
                    <TableCell>
                      <Chip label={m.type_mouvement} color={chipColor(m.type_mouvement)} size="small" />
                    </TableCell>
                    <TableCell align="right">{m.qte_kg_avant}</TableCell>
                    <TableCell align="right">{m.qte_kg_mouvement}</TableCell>
                    <TableCell align="right">{m.qte_kg_apres}</TableCell>
                    <TableCell align="right">{m.qte_cartons_avant}</TableCell>
                    <TableCell align="right">{m.qte_cartons_mouvement}</TableCell>
                    <TableCell align="right">{m.qte_cartons_apres}</TableCell>
                    <TableCell>{m.reference_type || ''} #{m.reference_id || ''}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => { setSelectedMovement(m); setOpenDialog(true); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Lignes par page:"
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Paper>

      {/* Modal détails mouvement */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Détails du Mouvement
          <IconButton aria-label="close" onClick={() => setOpenDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMovement ? (
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Typography><strong>Date:</strong> {new Date(selectedMovement.created_at).toLocaleString()}</Typography>
              <Typography><strong>Type:</strong> {selectedMovement.type_mouvement}</Typography>
              <Typography><strong>Avant (kg):</strong> {selectedMovement.qte_kg_avant}</Typography>
              <Typography><strong>Mouv. (kg):</strong> {selectedMovement.qte_kg_mouvement}</Typography>
              <Typography><strong>Après (kg):</strong> {selectedMovement.qte_kg_apres}</Typography>
              <Typography><strong>Avant (cartons):</strong> {selectedMovement.qte_cartons_avant}</Typography>
              <Typography><strong>Mouv. (cartons):</strong> {selectedMovement.qte_cartons_mouvement}</Typography>
              <Typography><strong>Après (cartons):</strong> {selectedMovement.qte_cartons_apres}</Typography>
              <Typography sx={{ gridColumn: 'span 2' }}><strong>Référence:</strong> {(selectedMovement.reference_type || '')} #{selectedMovement.reference_id || ''}</Typography>
            </Box>
          ) : (
            <Typography>Aucune donnée</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => {
            const w = window.open('', '_blank');
            if (!w || !selectedMovement) return;
            const m = selectedMovement;
            w.document.write(`
              <html><head><title>Mouvement</title></head><body>
              <h3>Mouvement #${m.id}</h3>
              <p>Date: ${new Date(m.created_at).toLocaleString()}</p>
              <p>Type: ${m.type_mouvement}</p>
              <p>Avant (kg): ${m.qte_kg_avant} · Mouv (kg): ${m.qte_kg_mouvement} · Après (kg): ${m.qte_kg_apres}</p>
              <p>Avant (cartons): ${m.qte_cartons_avant} · Mouv (cartons): ${m.qte_cartons_mouvement} · Après (cartons): ${m.qte_cartons_apres}</p>
              <p>Référence: ${(m.reference_type || '')} #${m.reference_id || ''}</p>
              <script>window.print();</script>
              </body></html>
            `);
            w.document.close();
          }}>Imprimer</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default MovementsTable;
