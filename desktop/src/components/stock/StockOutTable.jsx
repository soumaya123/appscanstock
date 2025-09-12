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
  Tooltip,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import ExitDialog from '../products/ExitDialog'; // 👈 modal pour ajouter entrée stock
import apiClient, { stockExitService } from '../../services/api';
import { API_CONFIG } from '../../config';

function StockOutTable({
  exits = [],
  products = [],
  onEdit,
  onDelete,
  onView,
  onAdd,
  title = "Sorties de Stock",
  showActions = true,
  maxRows = null
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openModal, setOpenModal] = useState(false); // 👈 état pour le modal
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState({ items: [] });
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [selected, setSelected] = useState([]);

  const handleSubmit = async (data) => {
    const toIsoDate = (d) => {
      if (!d) return null;
      if (/T\d{2}:\d{2}/.test(d)) return d;
      return `${d}T00:00:00`;
    };

    try {
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        date_sortie: toIsoDate(data.exitDate || today),
        num_facture: data.invoiceNumber || null,
        type_sortie: data.type,
        remarque: data.remarks || null,
        prix_vente: data.salePrice || null,
        items: (data.items || []).map((item) => ({
          product_id: item.productId,
          qte_kg: Number(item.quantityKg || 0),
          qte_cartons: Number(item.quantityCartons || 0),
          date_peremption: toIsoDate(item.expirationDate),
          remarque: item.remarks || null,
        })),
      };

      await stockExitService.create(payload);
      setOpenModal(false);
      setEntry({ items: [] });
      if (typeof onAdd === 'function') onAdd();
    } catch (err) {
      console.error('Erreur création sortie stock:', err?.response?.data || err);
    }
  };

  // Regroupement des sorties: par numéro de facture si dispo, sinon par type + date (YYYY-MM-DD)
  const groupsMap = (exits || []).reduce((acc, x) => {
    const dateOnly = x.date_sortie ? new Date(x.date_sortie).toISOString().slice(0,10) : '';
    const key = x.num_facture ? `F:${x.num_facture}` : `T:${x.type_sortie}|D:${dateOnly}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        num_facture: x.num_facture || '-',
        type_sortie: x.type_sortie || '-',
        date_sortie: x.date_sortie,
        remarque: x.remarque || '',
        items: [],
        total_kg: 0,
        total_cartons: 0,
      };
    }
    const g = acc[key];
    if (x.date_sortie && new Date(x.date_sortie) < new Date(g.date_sortie)) {
      g.date_sortie = x.date_sortie;
    }
    g.items.push(x);
    g.total_kg += (x.qte_kg || 0);
    g.total_cartons += (x.qte_cartons || 0);
    return acc;
  }, {});

  const groups = Object.values(groupsMap);

  // Filtrage
  const filtered = groups.filter((g) => {
    const txt = `${g.num_facture || ''} ${g.type_sortie || ''}`.toLowerCase();
    return txt.includes(searchTerm.toLowerCase());
  });
  const display = maxRows ? filtered.slice(0, maxRows) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Gestion modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleToggle = (key) => {
    setSelected((prev) => prev.includes(key) ? prev.filter(x => x !== key) : prev.concat(key));
  };

  // Impression d'un seul groupe via HTML (évite endpoint PDF manquant)
  const printGroupHtml = (g) => {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 16px; }
        h2 { margin: 0 0 8px; }
        .meta { margin: 8px 0 12px; font-size: 12px; }
        .meta > div { margin: 2px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
        tfoot th, tfoot td { font-weight: bold; }
      </style>`;
    const section = generateExitSectionHTML(g);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Bon de Sortie</title>${styles}</head><body>${section}<script>window.onload=function(){window.print();}<\/script></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (doc) { doc.open(); doc.write(html); doc.close(); try { iframe.contentWindow.focus(); } catch {} }
    else {
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); try { w.focus(); } catch {} }
    }
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 15000);
  };

  // Impression HTML multi-groupes (compatible .exe)
  const fmtDateTime = (d) => { try { return new Date(d).toLocaleString(); } catch { return d || '-'; } };
  const fmtKg = (n) => Number(n || 0).toFixed(3);
  const fmtInt = (n) => parseInt(n || 0, 10);

  const generateExitSectionHTML = (g) => {
    const rows = (g.items || []).map((it) => `
      <tr>
        <td>${it.product?.code_produit || '-'}</td>
        <td>${it.product?.nom_produit || '-'}</td>
        <td style="text-align:right">${fmtKg(it.qte_kg)}</td>
        <td style="text-align:right">${fmtInt(it.qte_cartons)}</td>
        <td>${it.prix_vente != null ? it.prix_vente : '-'}</td>
      </tr>
    `).join('');
    return `
      <section class="page">
        <h2>Bon de Sortie</h2>
        <div class="meta">
          <div><strong>Date Sortie:</strong> ${fmtDateTime(g.date_sortie)}</div>
          <div><strong>Type:</strong> ${g.type_sortie || '-'}</div>
          <div><strong>Numéro Facture:</strong> ${g.num_facture || '-'}</div>
          <div><strong>Articles:</strong> ${(g.items || []).length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Code Produit</th>
              <th>Nom Produit</th>
              <th style="text-align:right">Quantité (kg)</th>
              <th style="text-align:right">Quantité (cartons)</th>
              <th>Prix Vente</th>
              
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <th colspan="2" style="text-align:right">Totaux</th>
              <th style="text-align:right">${fmtKg(g.total_kg)}</th>
              <th style="text-align:right">${fmtInt(g.total_cartons)}</th>
              <th colspan="2"></th>
            </tr>
          </tfoot>
        </table>
      </section>`;
  };

  const handlePrintSelected = () => {
    if (!selected.length) return;
    const selectedGroups = groups.filter(g => selected.includes(g.key));
    if (!selectedGroups.length) return;

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 16px; }
        h2 { margin: 0 0 8px; }
        .meta { margin: 8px 0 12px; font-size: 12px; }
        .meta > div { margin: 2px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
        tfoot th, tfoot td { font-weight: bold; }
        .page { page-break-after: always; }
        @media print { .page { break-after: page; } }
      </style>`;
    const sections = selectedGroups.map(generateExitSectionHTML).join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Impression Sorties</title>${styles}</head><body>${sections}<script>window.onload=function(){window.print();}<\/script></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      try { iframe.contentWindow.focus(); } catch {}
    } else {
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); try { w.focus(); } catch {} }
      else {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = 'sorties_print.html';
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      }
    }
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 15000);
  };

  return (
    <Grid xs={12} md={12} style={{ padding: "50px" }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintSelected}
                disabled={selected.length === 0}
                sx={{ borderRadius: 2 }}
              >
                Imprimer sorties
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
                sx={{ borderRadius: 2 }}
              >
                Nouveau Sortie stock
              </Button>
            </Box>
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
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="low-stock">Stock faible</MenuItem>
                  <MenuItem value="out-of-stock">Rupture</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date Sortie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Num. Facture</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Total (kg)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Total (cartons)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {display.map((g) => (
                <TableRow
                key={g.key}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <input type="checkbox" checked={selected.includes(g.key)} onChange={() => handleToggle(g.key)} />
                    </TableCell>
                    <TableCell>{g.date_sortie ? new Date(g.date_sortie).toLocaleString() : '-'}</TableCell>
                    <TableCell>{g.type_sortie}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {g.num_facture || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{g.total_kg}</TableCell>
                    <TableCell align="right">{g.total_cartons}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Détails">
                        <IconButton size="small" onClick={() => { setCurrentGroup(g); setDetailOpen(true); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimer sortie">
                        <IconButton size="small" onClick={() => printGroupHtml(g)}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!maxRows && (
            <TablePagination
              component="div"
              count={filtered.length}
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

      {/* Modal d'entrée stock */}
      <ExitDialog
        open={openModal}
        onClose={() => setOpenModal(false)} 
        onSubmit={handleSubmit}
        exit={entry}
        onChange={setEntry}
        products={products}
        loading={false}
      />

      {/* Détails d'une sortie groupée */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Détails Sortie {currentGroup?.num_facture || currentGroup?.type_sortie}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography>Date Sortie: {currentGroup?.date_sortie ? new Date(currentGroup.date_sortie).toLocaleString() : '-'}</Typography>
            <Typography>Type: {currentGroup?.type_sortie || '-'}</Typography>
            <Typography>Numéro Facture: {currentGroup?.num_facture || '-'}</Typography>
            <Typography>Total: {currentGroup?.total_kg || 0} kg / {currentGroup?.total_cartons || 0} cartons</Typography>
            <Typography>Nombre d'articles: {currentGroup?.items?.length || 0}</Typography>
            <Typography>Remarque: {currentGroup?.remarque || '-'}</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code Produit</TableCell>
                <TableCell>Nom Produit</TableCell>
                <TableCell align="right">Quantité (kg)</TableCell>
                <TableCell align="right">Quantité (cartons)</TableCell>
                <TableCell>Prix de Vente</TableCell>
                {/* <TableCell>Remarque</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {(currentGroup?.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.product?.code_produit || '-'}</TableCell>
                  <TableCell>{it.product?.nom_produit || '-'}</TableCell>
                  <TableCell align="right">{it.qte_kg}</TableCell>
                  <TableCell align="right">{it.qte_cartons}</TableCell>
                  <TableCell>{it.prix_vente != null ? it.prix_vente : '-'}</TableCell>
                  {/* <TableCell>{it.remarque || ''}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
          <Button
            variant="outlined"
            onClick={() => currentGroup && printGroupHtml(currentGroup)}
          >
            Imprimer sortie
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default StockOutTable;
