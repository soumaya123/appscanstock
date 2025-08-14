import React, { useEffect, useState } from 'react';
import {
  Paper, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, InputAdornment, Grid, Chip, TablePagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, MenuItem
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon, Print as PrintIcon, GetApp as ExportIcon, Publish as ImportIcon, Close as CloseIcon } from '@mui/icons-material';
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
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    // Initialiser la sélection si non définie
    if (!selectedProduct && products && products.length > 0) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    let ignore = false;
    const fetchMovements = async () => {
      if (!selectedProduct?.id) { setMovements([]); return; }
      setLoading(true);
      try {
        const data = await movementService.getByProduct(selectedProduct.id);
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
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.code_produit || p.code)} - {(p.nom_produit || p.name)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" size="small" startIcon={<ExportIcon />} onClick={() => {
              // Export CSV des mouvements filtrés
              const rows = filtered;
              const headers = ['id','date','type','kg_avant','kg_mouvement','kg_apres','cartons_avant','cartons_mouvement','cartons_apres','reference_type','reference_id'];
              const csv = [headers.join(',')].concat(
                rows.map(m => [
                  m.id,
                  new Date(m.created_at).toISOString(),
                  m.type_mouvement,
                  m.qte_kg_avant,
                  m.qte_kg_mouvement,
                  m.qte_kg_apres,
                  m.qte_cartons_avant,
                  m.qte_cartons_mouvement,
                  m.qte_cartons_apres,
                  m.reference_type || '',
                  m.reference_id || ''
                ].join(','))
              ).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `mouvements_${selectedProduct?.code_produit || selectedProduct?.name || 'produit'}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}>Exporter CSV</Button>
            <Button variant="outlined" size="small" startIcon={<ImportIcon />} onClick={() => fileInputRef.current?.click()}>Importer CSV</Button>
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const lines = text.split(/\r?\n/).filter(Boolean);
              if (lines.length < 2) return;
              const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
              const idx = (name) => headers.indexOf(name);
              // Colonnes attendues: type,product_id,qte_kg,qte_cartons,date,doc,remarque
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (!cols.length) continue;
                const rawType = (cols[idx('type')] || '').trim().toLowerCase();
                const productId = Number(cols[idx('product_id')] || 0);
                const qteKg = Number(cols[idx('qte_kg')] || 0);
                const qteCartons = Number(cols[idx('qte_cartons')] || 0);
                const dateStr = (cols[idx('date')] || '').trim();
                const doc = (cols[idx('doc')] || '').trim();
                const remarque = (cols[idx('remarque')] || '').trim() || null;
                if (!productId) continue;
                const toIso = (d) => d ? (/T\d{2}:\d{2}/.test(d) ? d : `${d}T00:00:00`) : null;
                try {
                  if (rawType.startsWith('entree')) {
                    await stockEntryService.create({
                      date_reception: toIso(dateStr) || new Date().toISOString(),
                      num_reception: doc || `IMP-${Date.now()}`,
                      product_id: productId,
                      qte_kg: qteKg,
                      qte_cartons: qteCartons,
                      remarque,
                    });
                  } else if (rawType.startsWith('sortie')) {
                    const subtype = rawType.includes(':') ? rawType.split(':')[1] : 'vente';
                    await stockExitService.create({
                      date_sortie: toIso(dateStr) || new Date().toISOString(),
                      num_facture: doc || null,
                      type_sortie: subtype,
                      product_id: productId,
                      qte_kg: qteKg,
                      qte_cartons: qteCartons,
                      remarque,
                    });
                  }
                } catch (err) {
                  console.error('Erreur import ligne', i, err?.response?.data || err);
                }
              }
              // Recharger les mouvements après import
              if (selectedProduct?.id) {
                try {
                  const data = await movementService.getByProduct(selectedProduct.id);
                  setMovements(Array.isArray(data) ? data : []);
                } catch {}
              }
              e.target.value = '';
            }} />
            <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => {
              // Impression
              const w = window.open('', '_blank');
              if (!w) return;
              const rows = filtered;
              const html = `
                <html><head><title>Impression Mouvements</title>
                <style>table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:right}th{text-align:left}</style>
                </head><body>
                <h3>Mouvements - ${(selectedProduct?.nom_produit || selectedProduct?.name || '')}</h3>
                <table>
                <thead><tr>
                  <th>Date</th><th>Type</th><th>Avant (kg)</th><th>Mouv. (kg)</th><th>Après (kg)</th>
                  <th>Avant (cartons)</th><th>Mouv. (cartons)</th><th>Après (cartons)</th><th>Référence</th>
                </tr></thead>
                <tbody>
                ${rows.map(m => `
                  <tr>
                    <td style="text-align:left">${new Date(m.created_at).toLocaleString()}</td>
                    <td style="text-align:left">${m.type_mouvement}</td>
                    <td>${m.qte_kg_avant}</td>
                    <td>${m.qte_kg_mouvement}</td>
                    <td>${m.qte_kg_apres}</td>
                    <td>${m.qte_cartons_avant}</td>
                    <td>${m.qte_cartons_mouvement}</td>
                    <td>${m.qte_cartons_apres}</td>
                    <td style="text-align:left">${m.reference_type || ''} #${m.reference_id || ''}</td>
                  </tr>`).join('')}
                </tbody></table>
                <script>window.print();</script>
                </body></html>`;
              w.document.write(html);
              w.document.close();
            }}>Imprimer</Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
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
