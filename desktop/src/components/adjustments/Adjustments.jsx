import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, GetApp as ExportIcon, Search as SearchIcon } from '@mui/icons-material';
import { productService, adjustmentService } from '../../services/api';
import AdjustmentDialog from './AdjustmentDialog';

function Adjustments() {
  const today = new Date().toISOString().split('T')[0];

  // Form state
  const [form, setForm] = useState({
    date: today,
    product: null,
    type: 'increase',
    qte_kg: 0,
    qte_cartons: 0,
    raison: '',
    reference: ''
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // List state
  const [adjustments, setAdjustments] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [filterProduct, setFilterProduct] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const productFilterOptions = useMemo(() => [
    { id: '__all__', __all: true, code_produit: 'Tous', nom_produit: 'les produits' },
    ...(products || [])
  ], [products]);

  const fetchProducts = async () => {
    try {
      const list = await productService.getAll();
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      setProducts([]);
    }
  };

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterProduct && !filterProduct.__all && filterProduct.id) params.product_id = filterProduct.id;
      if (filterType) params.type_ajustement = filterType;
      const list = await adjustmentService.getAll(params);
      setAdjustments(Array.isArray(list) ? list : []);
    } catch {
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [filterProduct?.id, filterType]);

  const currentStock = useMemo(() => {
    if (!form.product) return { kg: 0, cartons: 0 };
    return {
      kg: Number(form.product.stock_actuel_kg || 0),
      cartons: Number(form.product.stock_actuel_cartons || 0)
    };
  }, [form.product]);

  const previewStock = useMemo(() => {
    const sign = form.type === 'increase' ? 1 : -1;
    return {
      kg: currentStock.kg + sign * Number(form.qte_kg || 0),
      cartons: currentStock.cartons + sign * Number(form.qte_cartons || 0)
    };
  }, [form.type, form.qte_kg, form.qte_cartons, currentStock]);

  const canSubmit = useMemo(() => {
    if (!form.product) return false;
    if (!form.raison || !form.raison.trim()) return false;
    const sign = form.type === 'increase' ? 1 : -1;
    const newKg = currentStock.kg + sign * Number(form.qte_kg || 0);
    const newC = currentStock.cartons + sign * Number(form.qte_cartons || 0);
    if (newKg < 0 || newC < 0) return false;
    return true;
  }, [form, currentStock]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      const payload = {
        date_ajustement: form.date ? `${form.date}T00:00:00` : new Date().toISOString(),
        product_id: form.product.id,
        type_ajustement: form.type,
        qte_kg: Number(form.qte_kg || 0),
        qte_cartons: Number(form.qte_cartons || 0),
        raison: form.raison,
        reference_document: form.reference || null
      };
      await adjustmentService.create(payload);
      // reset partiel
      setForm(prev => ({ ...prev, qte_kg: 0, qte_cartons: 0, raison: '', reference: '' }));
      await fetchProducts(); // mettre à jour stock affiché
      await fetchAdjustments();
      setOpenDialog(false);
    } catch (err) {
      console.error('Erreur création ajustement:', err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = (filterText || '').toLowerCase();
    return adjustments.filter(a => {
      const p = a.product || {};
      const txt = `${p.code_produit || ''} ${p.nom_produit || ''}`.toLowerCase();
      return txt.includes(q);
    });
  }, [adjustments, filterText]);

  const display = useMemo(() => (
    filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  ), [filtered, page, rowsPerPage]);

  const loadXLSX = async () => {
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    const mod = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    return (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : (mod.XLSX || mod.default || mod);
  };

  const handleExportXLSX = async () => {
    try {
      const XLSX = await loadXLSX();
      const data = adjustments.map(a => ({
        date_ajustement: new Date(a.date_ajustement).toLocaleString(),
        code_produit: a.product?.code_produit || '',
        nom_produit: a.product?.nom_produit || '',
        type_ajustement: a.type_ajustement,
        delta_kg: a.type_ajustement === 'increase' ? (a.qte_kg || 0) : -(a.qte_kg || 0),
        delta_cartons: a.type_ajustement === 'increase' ? (a.qte_cartons || 0) : -(a.qte_cartons || 0),
        raison: a.raison || '',
        reference_document: a.reference_document || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ajustements');
      XLSX.writeFile(wb, `ajustements_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`);
    } catch (err) {
      console.error('Export XLSX échoué:', err);
      alert('Export XLSX échoué');
    }
  };

  return (
    <Grid xs={12} md={12} style={{ padding: '50px' }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Typography variant="h6" fontWeight="bold" color="primary.main" mb={2}>
            Ajustements de Stock
          </Typography>

          {/* Actions */}
          <Box display="flex" gap={1} mb={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportXLSX} disabled={loading}>
              Exporter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setForm({ date: today, product: null, type: 'increase', qte_kg: 0, qte_cartons: 0, raison: '', reference: '' });
                setOpenDialog(true);
              }}
              disabled={loading}
            >
              Nouveau ajustement
            </Button>
          </Box>

          {/* Filtres liste */}
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <Autocomplete
              options={productFilterOptions}
              getOptionLabel={(o) => o?.__all ? 'Tous les produits' : `${o.code_produit || o.code} - ${o.nom_produit || o.name}`}
              isOptionEqualToValue={(o, v) => {
                if (!o || !v) return o === v;
                if (o.__all || v.__all) return !!o.__all === !!v.__all;
                return String(o.id) === String(v.id);
              }}
              value={filterProduct}
              onChange={(e, v) => { setFilterProduct(v); setPage(0); }}
              renderInput={(params) => <TextField {...params} label="Filtrer par produit" size="small" />}
              sx={{ minWidth: 260 }}
            />
            <TextField
              select
              size="small"
              label="Type"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="increase">Augmentation</MenuItem>
              <MenuItem value="decrease">Diminution</MenuItem>
            </TextField>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 260 }}
            />
          </Box>

          {/* Liste des ajustements */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Produit</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Δ (kg)</TableCell>
                  <TableCell align="right">Δ (cartons)</TableCell>
                  <TableCell>Raison</TableCell>
                  <TableCell>Référence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {display.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.date_ajustement).toLocaleString()}</TableCell>
                    <TableCell>{(a.product?.code_produit || '') + ' - ' + (a.product?.nom_produit || '')}</TableCell>
                    <TableCell>{a.type_ajustement}</TableCell>
                    <TableCell align="right">{a.type_ajustement === 'increase' ? (a.qte_kg || 0) : -(a.qte_kg || 0)}</TableCell>
                    <TableCell align="right">{a.type_ajustement === 'increase' ? (a.qte_cartons || 0) : -(a.qte_cartons || 0)}</TableCell>
                    <TableCell>{a.raison || ''}</TableCell>
                    <TableCell>{a.reference_document || ''}</TableCell>
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
        <AdjustmentDialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            onSubmit={handleSubmit}
            form={form}
            onChange={setForm}
            products={products}
            loading={loading}
            currentStock={currentStock}
            previewStock={previewStock}
            canSubmit={canSubmit}
          />
        </Box>
      </Paper>
    </Grid>
  );
}

export default Adjustments;
