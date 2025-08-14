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

import EntryDialog from '../products/EntryDialog'; // 👈 modal pour ajouter entrée stock

function StockTable({
  stocks = [],
  onEdit,
  onDelete,
  onView,
  onAdd,
  title = "Gestion du Stock",
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
  const handleSubmit = (data) => {
    console.log('Entrée soumise :', data);
    setOpen(false);
  };
  const testProducts = [
    { id: 'p1', code: 'PRD-001', name: 'Produit A', barcode: '123456789' },
    { id: 'p2', code: 'PRD-002', name: 'Produit B', barcode: '987654321' },
    { id: 'p3', code: 'PRD-003', name: 'Produit C', barcode: '456789123' },
  ];
  // Filtrage
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch =
      (stock.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.item_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'low-stock') {
      return matchesSearch && (stock.actual_qty <= (stock.reorder_level || 0));
    }
    if (filterStatus === 'out-of-stock') {
      return matchesSearch && (stock.actual_qty === 0);
    }
    return matchesSearch;
  });

  const displayStocks = maxRows
    ? filteredStocks.slice(0, maxRows)
    : filteredStocks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
              Nouveau Entrée stock
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Code Article</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nom Article</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Dépôt</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Qté Actuelle</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Niveau de Réappro</TableCell>
                  {showActions && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayStocks.map((stock) => (
                  <TableRow
                    key={`${stock.item_code}-${stock.warehouse}`}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {stock.item_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{stock.item_name}</TableCell>
                    <TableCell align="center">{stock.warehouse}</TableCell>
                    <TableCell align="center">{stock.actual_qty}</TableCell>
                    <TableCell align="center">{stock.reorder_level || '-'}</TableCell>
                    {showActions && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => onView(stock)}
                              sx={{ color: 'primary.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(stock)}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(stock)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!maxRows && (
            <TablePagination
              component="div"
              count={filteredStocks.length}
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
        products={testProducts}
        loading={false}
      />
    </Grid>
  );
}

export default StockTable;
