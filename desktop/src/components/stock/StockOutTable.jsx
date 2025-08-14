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
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

import ExitDialog from '../products/ExitDialog'; // 👈 modal pour ajouter entrée stock
import { stockExitService } from '../../services/api';

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
  // Filtrage
  const filtered = exits.filter((x) => {
    const txt = `${x.num_facture || ''} ${(x.product?.nom_produit || '')}`.toLowerCase();
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Produit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Quantité (kg)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Quantité (cartons)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {display.map((x) => (
                <TableRow
                key={x.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>{new Date(x.date_sortie).toLocaleString()}</TableCell>
                    <TableCell>{x.type_sortie}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {x.num_facture || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{x.product?.nom_produit || '-'}</TableCell>
                    <TableCell align="center">{x.qte_kg}</TableCell>
                    <TableCell align="center">{x.qte_cartons}</TableCell>
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
    </Grid>
  );
}

export default StockOutTable;
