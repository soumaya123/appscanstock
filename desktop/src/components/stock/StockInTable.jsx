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
import { stockEntryService } from '../../services/api';
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
      // Créer une entrée par item
      for (const item of data.items || []) {
        if (!item.productId) continue;
        const payload = {
          ...base,
          product_id: item.productId,
          qte_kg: Number(item.quantityKg || 0),
          qte_cartons: Number(item.quantityCartons || 0),
          date_peremption: toIsoDate(item.expirationDate),
          remarque: item.remarks || null,
        };
        await stockEntryService.create(payload);
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
    else setSelected(filteredList.map(e => e.id));
  };

  const handlePrintSelected = () => {
    if (!selected.length) return;
    selected.forEach((id) => {
      const url = `${API_CONFIG.BASE_URL}/reports/pdf/stock-entry/${id}`;
      window.open(url, '_blank');
    });
  };
  // Filtrage
  const filtered = entries.filter((e) => {
    const txt = `${e.num_reception || ''} ${(e.product?.nom_produit || '')}`.toLowerCase();
    return txt.includes(searchTerm.toLowerCase());
  });
  const display = maxRows ? filtered.slice(0, maxRows) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
              Imprimer bons
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
              <TableCell sx={{ fontWeight: 'bold' }}>Produit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Quantité (kg)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Quantité (cartons)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
              </TableHead>
              <TableBody>
                {display.map((e) => (
                <TableRow
                key={e.id}
                hover
                sx={{
                '&:hover': {
                bgcolor: 'action.hover'
                }
                }}
                >
                <TableCell padding="checkbox">
                <Checkbox
                checked={selected.includes(e.id)}
                onChange={() => handleToggle(e.id)}
                inputProps={{ 'aria-label': `select entry ${e.id}` }}
                />
                </TableCell>
                <TableCell>{new Date(e.date_reception).toLocaleString()}</TableCell>
                <TableCell>
                <Typography variant="body2" fontWeight="medium" color="primary.main">
                {e.num_reception}
                </Typography>
                </TableCell>
                <TableCell>{e.product?.nom_produit || '-'}</TableCell>
                <TableCell align="center">{e.qte_kg}</TableCell>
                <TableCell align="center">{e.qte_cartons}</TableCell>
                <TableCell align="center">
                <Tooltip title="Imprimer bon">
                <IconButton size="small" onClick={() => window.open(`${API_CONFIG.BASE_URL}/reports/pdf/stock-entry/${e.id}`, '_blank')}>
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
    </Grid>
  );
}

export default StockInTable;
