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
  Checkbox,
Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import EntryDialog from '../products/EntryDialog'; // 👈 modal pour ajouter entrée stock
import apiClient, { stockEntryService } from '../../services/api';
import { API_CONFIG } from '../../config';

function StockInTable({
  entries = [],
  products = [],
  onEdit,
  onDelete,
  onView,
  onAdd,
  title = "Entrées de Stock",
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
  const [selected, setSelected] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentReception, setCurrentReception] = useState(null);

  const handleSubmit = async (data) => {
    // data contient: receptionDate, receptionNumber, carnetNumber, invoiceNumber, packingListNumber, items[]
    const toIsoDate = (d) => {
      if (!d) return null;
      // si déjà avec heure, retourner tel quel
      if (/T\d{2}:\d{2}/.test(d)) return d;
      return `${d}T00:00:00`;
    };

    try {
      const today = new Date().toISOString().slice(0,10);
      const base = {
        date_reception: toIsoDate(data.receptionDate || today),
        num_reception: data.receptionNumber,
        num_reception_carnet: data.carnetNumber || null,
        num_facture: data.invoiceNumber || null,
        num_packing_liste: data.packingListNumber || null,
      };

      const items = (data.items || [])
        .filter((item) => item.productId)
        .map((item) => ({
          product_id: item.productId,
          qte_kg: Number(item.quantityKg || 0),
          qte_cartons: Number(item.quantityCartons || 0),
          date_peremption: toIsoDate(item.expirationDate),
          remarque: item.remarks || null,
        }));

      if (items.length === 0) return;

      // Essayer en batch si plusieurs items
      if (items.length > 1) {
        try {
          await stockEntryService.createBatch({ ...base, items });
        } catch (batchErr) {
          // fallback: créer individuellement
          for (const payload of items.map((it) => ({ ...base, ...it }))) {
            await stockEntryService.create(payload);
          }
        }
      } else {
        // un seul item
        await stockEntryService.create({ ...base, ...items[0] });
      }

      setOpenModal(false);
      setEntry({ items: [] });
      if (typeof onAdd === 'function') onAdd();
    } catch (err) {
      console.error('Erreur création entrée stock:', err?.response?.data || err);
    }
  };

  const handleToggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : prev.concat(id));
  };

  const handleToggleAll = (filteredList) => {
    if (selected.length === filteredList.length) setSelected([]);
    else setSelected(filteredList.map(e => e.num_reception));
  };

  const printReception = async (numReception) => {
    try {
      const response = await apiClient.get('/reports/pdf/stock-reception', {
        params: { num_reception: numReception },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `reception_${numReception}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Erreur impression réception:', err?.response?.data || err);
      alert('Impossible de générer le PDF. Vérifiez votre connexion et réessayez.');
    }
  };

  // Impression multi-bons en HTML (compatible navigateur et build .exe)
  const fmtDateTime = (d) => {
    try { return new Date(d).toLocaleString(); } catch { return d || '-'; }
  };
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(); } catch { return d || '-'; }
  };
  const fmtKg = (n) => Number(n || 0).toFixed(3);
  const fmtInt = (n) => parseInt(n || 0, 10);

  const generateReceptionSectionHTML = (r) => {
    const rows = (r.items || []).map((it) => `
      <tr>
        <td>${(it.product?.code_produit || '-')}</td>
        <td>${(it.product?.nom_produit || '-')}</td>
        <td style="text-align:right">${fmtKg(it.qte_kg)}</td>
        <td style="text-align:right">${fmtInt(it.qte_cartons)}</td>
        <td>${it.date_peremption ? fmtDate(it.date_peremption) : '-'}</td>
        <td>${it.remarque ? String(it.remarque).replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</td>
      </tr>
    `).join('');
    return `
      <section class="page">
        <h2>Bon de Réception</h2>
        <div class="meta">
          <div><strong>Date Réception:</strong> ${fmtDateTime(r.date_reception)}</div>
          <div><strong>Numéro Réception:</strong> ${r.num_reception}</div>
          <div><strong>Numéro Facture:</strong> ${r.num_facture || '-'}</div>
          <div><strong>Numéro Packing Liste:</strong> ${r.num_packing_liste || '-'}</div>
          <div><strong>Numéro Carnet:</strong> ${r.num_reception_carnet || '-'}</div>
          <div><strong>Articles:</strong> ${(r.items || []).length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Code Produit</th>
              <th>Nom Produit</th>
              <th style="text-align:right">Quantité (kg)</th>
              <th style="text-align:right">Quantité (cartons)</th>
              <th>Date Péremption</th>
              <th>Remarque</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <th colspan="2" style="text-align:right">Totaux</th>
              <th style="text-align:right">${fmtKg(r.total_kg)}</th>
              <th style="text-align:right">${fmtInt(r.total_cartons)}</th>
              <th colspan="2"></th>
            </tr>
          </tfoot>
        </table>
      </section>`;
  };

  const printReceptionHtml = (r) => {
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
    const section = generateReceptionSectionHTML(r);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Bon de Réception</title>${styles}</head><body>${section}<script>window.onload=function(){window.print();}<\/script></body></html>`;

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

  const handlePrintSelected = () => {
    if (!selected.length) return;
    const selectedReceptions = receptions.filter(r => selected.includes(r.num_reception));
    if (!selectedReceptions.length) return;

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
        @media print {
          .page { break-after: page; }
        }
      </style>`;
    const sections = selectedReceptions.map(generateReceptionSectionHTML).join('\n');
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<title>Impression Réceptions</title>
${styles}
</head>
<body>
${sections}
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;

    // Impression via iframe caché (compatible .exe)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      // focus + print si nécessaire
      try { iframe.contentWindow.focus(); } catch {}
    } else {
      // Fallback fenêtre
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        try { w.focus(); } catch {}
      } else {
        // Fallback téléchargement
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'receptions_print.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }

    // Nettoyage iframe après un délai
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 15000);
  };
  // Regrouper par numéro de réception
  const receptionsMap = (entries || []).reduce((acc, e) => {
    const key = e.num_reception || '—';
    if (!acc[key]) {
      acc[key] = {
        num_reception: key,
        date_reception: e.date_reception,
        num_facture: e.num_facture,
        num_packing_liste: e.num_packing_liste,
        num_reception_carnet: e.num_reception_carnet,
        items: [],
        total_kg: 0,
        total_cartons: 0,
      };
    }
    const grp = acc[key];
    if (e.date_reception && new Date(e.date_reception) < new Date(grp.date_reception)) {
      grp.date_reception = e.date_reception;
    }
    grp.items.push(e);
    grp.total_kg += (e.qte_kg || 0);
    grp.total_cartons += (e.qte_cartons || 0);
    return acc;
  }, {});

  const receptions = Object.values(receptionsMap);

  // Filtrage
  const filtered = receptions.filter((r) => {
    const txt = `${r.num_reception || ''} ${r.num_facture || ''} ${r.num_packing_liste || ''}`.toLowerCase();
    return txt.includes(searchTerm.toLowerCase());
  });

  const display = maxRows
    ? filtered.slice(0, maxRows)
    : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Gestion modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

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
              Imprimer entries
            </Button>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
                sx={{ borderRadius: 2 }}
              >
                Nouveau Entrée stock
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
              <TableCell padding="checkbox">
              <Checkbox
              indeterminate={selected.length > 0 && selected.length < filtered.length}
              checked={filtered.length > 0 && selected.length === filtered.length}
              onChange={() => handleToggleAll(filtered)}
              inputProps={{ 'aria-label': 'select all entries' }}
              />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Réception</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Num. Réception</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Num. Facture</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Num. Packing Liste</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total (kg)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total (cartons)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
              </TableHead>
              <TableBody>
                {display.map((r) => (
                <TableRow
                key={r.num_reception}
                hover
                sx={{
                '&:hover': {
                bgcolor: 'action.hover'
                }
                }}
                >
                <TableCell padding="checkbox">
                <Checkbox
                checked={selected.includes(r.num_reception)}
                onChange={() => handleToggle(r.num_reception)}
                inputProps={{ 'aria-label': `select entry ${r.num_reception}` }}
                />
                </TableCell>
                <TableCell>{new Date(r.date_reception).toLocaleString()}</TableCell>
                <TableCell>
                <Typography variant="body2" fontWeight="medium" color="primary.main">
                {r.num_reception}
                </Typography>
                </TableCell>
                <TableCell>{r.num_facture || '-'}</TableCell>
                <TableCell align="center">{r.num_packing_liste || '-'}</TableCell>
                <TableCell align="right">{r.total_kg}</TableCell>
                <TableCell align="right">{r.total_cartons}</TableCell>
                <TableCell align="center">
                <Tooltip title="Détails">
                <IconButton size="small" onClick={() => { setCurrentReception(r); setDetailOpen(true); }}>
                <ViewIcon fontSize="small" />
                </IconButton>
                </Tooltip>
                <Tooltip title="Imprimer réception">
                <IconButton size="small" onClick={() => printReceptionHtml(r)}>
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
      <EntryDialog
        open={openModal}
        onClose={() => setOpenModal(false)} 
        onSubmit={handleSubmit}
        entry={entry}
        onChange={setEntry}
        products={products}
        loading={false}
      />

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Détails Réception {currentReception?.num_reception}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography>Date Réception: {currentReception ? new Date(currentReception.date_reception).toLocaleString() : '-'}</Typography>
            <Typography>Numéro Facture: {currentReception?.num_facture || '-'}</Typography>
            <Typography>Numéro Packing Liste: {currentReception?.num_packing_liste || '-'}</Typography>
            <Typography>Numéro Carnet: {currentReception?.num_reception_carnet || '-'}</Typography>
            <Typography>Nombre d'articles: {currentReception?.items?.length || 0}</Typography>
            <Typography>Total: {currentReception?.total_kg || 0} kg / {currentReception?.total_cartons || 0} cartons</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code Produit</TableCell>
                <TableCell>Nom Produit</TableCell>
                <TableCell align="right">Quantité (kg)</TableCell>
                <TableCell align="right">Quantité (cartons)</TableCell>
                <TableCell>Date Péremption</TableCell>
                <TableCell>Remarque</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(currentReception?.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.product?.code_produit || '-'}</TableCell>
                  <TableCell>{it.product?.nom_produit || '-'}</TableCell>
                  <TableCell align="right">{it.qte_kg}</TableCell>
                  <TableCell align="right">{it.qte_cartons}</TableCell>
                  <TableCell>{it.date_peremption ? new Date(it.date_peremption).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{it.remarque || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => currentReception && printReceptionHtml(currentReception)}
            disabled={!currentReception}
          >
            Imprimer réception
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default StockInTable;
