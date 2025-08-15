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
import { stockExitService } from '../../services/api';
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

  const handleSubmit = async (data) => {
    const toIsoDate = (d) => {
      if (!d) return null;
      if (/T\d{2}:\d{2}/.test(d)) return d;
      return `${d}T00:00:00`;
    };

    try {
      const today = new Date().toISOString().slice(0,10);
      const base = {
        date_sortie: toIsoDate(data.exitDate || today),
        num_facture: data.invoiceNumber || null,
        type_sortie: data.type,
      };
      for (const item of data.items || []) {
        if (!item.productId) continue;
        const payload = {
          ...base,
          product_id: item.productId,
          qte_kg: Number(item.quantityKg || 0),
          qte_cartons: Number(item.quantityCartons || 0),
          date_peremption: toIsoDate(item.expirationDate),
          prix_vente: item.salePrice || null,
          remarque: item.remarks || null,
        };
        await stockExitService.create(payload);
      }
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

  return (
    <Grid xs={12} md={12} style={{ padding: "50px" }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal} // 👈 ouvre le modal
              sx={{ borderRadius: 2 }}
            >
              Nouveau Sortie stock
            </Button>
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
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
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
                        <IconButton size="small" onClick={() => {
                          const dateOnly = g.date_sortie ? new Date(g.date_sortie).toISOString().slice(0,10) : '';
                          const url = g.num_facture && g.num_facture !== '-' 
                            ? `${API_CONFIG.BASE_URL}/reports/pdf/stock-exit?num_facture=${encodeURIComponent(g.num_facture)}`
                            : `${API_CONFIG.BASE_URL}/reports/pdf/stock-exit?type_sortie=${encodeURIComponent(g.type_sortie || '')}&date_sortie=${encodeURIComponent(dateOnly)}`;
                          window.open(url, '_blank');
                        }}>
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
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code Produit</TableCell>
                <TableCell>Nom Produit</TableCell>
                <TableCell align="right">Quantité (kg)</TableCell>
                <TableCell align="right">Quantité (cartons)</TableCell>
                <TableCell>Prix de Vente</TableCell>
                <TableCell>Remarque</TableCell>
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
            onClick={() => {
              if (!currentGroup) return;
              const dateOnly = currentGroup.date_sortie ? new Date(currentGroup.date_sortie).toISOString().slice(0,10) : '';
              const url = currentGroup.num_facture && currentGroup.num_facture !== '-'
                ? `${API_CONFIG.BASE_URL}/reports/pdf/stock-exit?num_facture=${encodeURIComponent(currentGroup.num_facture)}`
                : `${API_CONFIG.BASE_URL}/reports/pdf/stock-exit?type_sortie=${encodeURIComponent(currentGroup.type_sortie || '')}&date_sortie=${encodeURIComponent(dateOnly)}`;
              window.open(url, '_blank');
            }}
          >
            Imprimer sortie
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default StockOutTable;
