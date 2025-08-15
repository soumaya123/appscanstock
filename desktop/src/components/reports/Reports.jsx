import React, { useEffect, useState, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  MenuItem,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon, GetApp as ExportIcon } from '@mui/icons-material';
import apiClient, { productService } from '../../services/api';

function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/reports/stock-summary');
      const list = Array.isArray(res.data) ? res.data : [];
      setData(list);
    } catch (e) {
      console.error('Erreur chargement rapports:', e);
      setError('Erreur lors du chargement du rapport');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await productService.getAll();
        if (!ignore) setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ignore) setProducts([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return data.filter((item) => {
      const p = item.product || {};
      const txt = `${p.code_produit || ''} ${p.nom_produit || ''}`.toLowerCase();
      const matchSearch = txt.includes(q);
      const matchProduct = selectedProductId ? String(p.id) === String(selectedProductId) : true;
      return matchSearch && matchProduct;
    });
  }, [data, search, selectedProductId]);

  const display = useMemo(() => {
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleExportCSV = () => {
    const headers = ['Code Produit','Nom Produit','Entrées KG','Entrées Cartons','Sorties KG','Sorties Cartons','Stock KG','Stock Cartons'];
    const rows = filtered.map(item => [
      item.product?.code_produit || '',
      item.product?.nom_produit || '',
      item.total_entrees_kg ?? 0,
      item.total_entrees_cartons ?? 0,
      item.total_sorties_kg ?? 0,
      item.total_sorties_cartons ?? 0,
      item.stock_actuel_kg ?? 0,
      item.stock_actuel_cartons ?? 0,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_stock_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const rows = filtered;
    const w = window.open('', '_blank');
    if (!w) return;
    const selProd = products.find(p => String(p.id) === String(selectedProductId));
    const titleSuffix = selProd ? ` - ${(selProd.code_produit || selProd.code)} ${(selProd.nom_produit || selProd.name)}` : ' - Tous les produits';
    const html = `
      <html><head><title>Rapport Stock</title>
      <style>table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:right}th{text-align:left}</style>
      </head><body>
      <h3>Rapport Stock${titleSuffix}</h3>
      <table>
        <thead><tr>
          <th>Code Produit</th><th>Nom Produit</th>
          <th>Entrées KG</th><th>Entrées Cartons</th>
          <th>Sorties KG</th><th>Sorties Cartons</th>
          <th>Stock KG</th><th>Stock Cartons</th>
        </tr></thead>
        <tbody>
          ${rows.map(item => `
            <tr>
              <td style="text-align:left">${item.product?.code_produit || ''}</td>
              <td style="text-align:left">${item.product?.nom_produit || ''}</td>
              <td>${item.total_entrees_kg ?? 0}</td>
              <td>${item.total_entrees_cartons ?? 0}</td>
              <td>${item.total_sorties_kg ?? 0}</td>
              <td>${item.total_sorties_cartons ?? 0}</td>
              <td>${item.stock_actuel_kg ?? 0}</td>
              <td>${item.stock_actuel_cartons ?? 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>window.print();</script>
      </body></html>
    `;
    w.document.write(html);
    w.document.close();
  };

  return (
    <Grid xs={12} md={12} style={{ padding: '50px' }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Rapport par Produit</Typography>
            <Box display="flex" gap={1}>
              <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV} disabled={loading}>Exporter CSV</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={loading}>Imprimer</Button>
            </Box>
          </Box>

          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              select
              size="small"
              label="Produit"
              value={selectedProductId}
              onChange={(e) => { setSelectedProductId(e.target.value); setPage(0); }}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Tous les produits</MenuItem>
              {products.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.code_produit || p.code)} - {(p.nom_produit || p.name)}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => { setPage(0); fetchSummary(); }} disabled={loading}>
              Actualiser
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              size="small"
              placeholder="Rechercher produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ minWidth: 260 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code Produit</TableCell>
                  <TableCell>Nom Produit</TableCell>
                  <TableCell align="right">Entrées (kg)</TableCell>
                  <TableCell align="right">Entrées (cartons)</TableCell>
                  <TableCell align="right">Sorties (kg)</TableCell>
                  <TableCell align="right">Sorties (cartons)</TableCell>
                  <TableCell align="right">Stock Actuel (kg)</TableCell>
                  <TableCell align="right">Stock Actuel (cartons)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {display.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.product?.code_produit || ''}</TableCell>
                    <TableCell>{item.product?.nom_produit || ''}</TableCell>
                    <TableCell align="right">{item.total_entrees_kg ?? 0}</TableCell>
                    <TableCell align="right">{item.total_entrees_cartons ?? 0}</TableCell>
                    <TableCell align="right">{item.total_sorties_kg ?? 0}</TableCell>
                    <TableCell align="right">{item.total_sorties_cartons ?? 0}</TableCell>
                    <TableCell align="right">{item.stock_actuel_kg ?? 0}</TableCell>
                    <TableCell align="right">{item.stock_actuel_cartons ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
    </Grid>
  );
}

export default Reports;
