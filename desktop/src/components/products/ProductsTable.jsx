import React, { useState, useRef } from 'react';
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
  Chip,
  Tooltip,
  Button,
  Grid,
} from '@mui/material';
import ProductDialog from './ProductDialog'; // 👈 import modal
import ProductDetailsDialog from './ProductDetailsDialog';

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  GetApp as ExportIcon,
  UploadFile as ImportIcon,
  Padding,
} from '@mui/icons-material';
import { productService } from '../../services/api';

function ProductsTable({ 
  products = [],
  onEdit, 
  onDelete, 
  onView, 
  onAdd,
  title = "Gestion des Produits",
  showActions = true,
  maxRows = null 
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    id: null,
    code: "",
    name: "",
    description: "",
    unit: "",
    alertThreshold: 10,
    barcode: "",
    pricePurchase: 0,
    priceSale: 0
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.nom_produit || product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.code_produit || product.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'low-stock') {
      return matchesSearch && (product.stock_actuel_kg <= (product.seuil_alerte || 0) || product.stock_actuel_cartons <= (product.seuil_alerte || 0));
    }
    if (filterStatus === 'out-of-stock') {
      return matchesSearch && (product.stock_actuel_kg === 0 && product.stock_actuel_cartons === 0);
    }
    if (filterStatus === 'in-stock') {
      const totalStock = (product.stock_actuel_kg || 0) + (product.stock_actuel_cartons || 0);
      const threshold = product.seuil_alerte || 0;
      return matchesSearch && totalStock > threshold;
    }
    return matchesSearch;
  });

  const displayProducts = maxRows ? filteredProducts.slice(0, maxRows) : filteredProducts;
  const paginatedProducts = maxRows ? displayProducts : filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStockStatus = (product) => {
    const totalStock = (product.stock_actuel_kg || 0) + (product.stock_actuel_cartons || 0);
    const threshold = product.seuil_alerte || 0;
    
    if (totalStock === 0) return { status: 'Rupture', color: 'error' };
    if (totalStock <= threshold) return { status: 'Stock Faible', color: 'warning' };
    return { status: 'En Stock', color: 'success' };
  };

  const handleOpenModal = () => {
    setProduct({ id: null, code: "", name: "", description: "", unit: "", alertThreshold: 10, barcode: "", pricePurchase: 0, priceSale: 0 });
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  const resetProduct = () => setProduct({
    id: null,
    code: "",
    name: "",
    description: "",
    unit: "",
    alertThreshold: 10,
    barcode: "",
    pricePurchase: 0,
    priceSale: 0
  });

  const safeNumber = (v, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === 'number') return Number.isFinite(v) ? v : d;
    if (typeof v === 'string') {
      const s = v.trim().replace(/\s/g, '').replace(',', '.');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : d;
    }
    return d;
  };

  const mapToBackendPayload = (p) => {
    const unite = p.unit || 'both';
    const code = (p.code || '').toString().trim();
    const name = (p.name || '').toString().trim();
    const barcodeRaw = (p.barcode ?? '').toString().trim();
    return {
      code_produit: code,
      code_barre: barcodeRaw.length ? barcodeRaw : null,
      nom_produit: name,
      description: p.description ? String(p.description) : null,
      unite_kg: unite === 'kg' || unite === 'both',
      unite_cartons: unite === 'cartons' || unite === 'both',
      prix_achat: safeNumber(p.pricePurchase, 0),
      prix_vente: safeNumber(p.priceSale, 0),
      seuil_alerte: safeNumber(p.alertThreshold, 0),
    };
  };

  const handleCreateProduct = async () => {
    setSaving(true);
    try {
      const payload = mapToBackendPayload(product);
      await productService.create(payload);
      handleCloseModal();
      resetProduct();
      // Optionnel: notifier le parent pour rafraîchir
      if (typeof onAdd === 'function') onAdd();
    } catch (err) {
      console.error('Erreur lors de la création du produit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setProduct({
      id: row.id,
      code: row.code_produit || '',
      name: row.nom_produit || '',
      description: row.description || '',
      unit: (row.unite_kg && row.unite_cartons) ? 'both' : (row.unite_kg ? 'kg' : (row.unite_cartons ? 'cartons' : '')),
      alertThreshold: row.seuil_alerte ?? 0,
      barcode: row.code_barre || '',
      pricePurchase: row.prix_achat ?? 0,
      priceSale: row.prix_vente ?? 0,
    });
    setOpenModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!product.id) return;
    setSaving(true);
    try {
      const payload = mapToBackendPayload(product);
      await productService.update(product.id, payload);
      handleCloseModal();
      resetProduct();
      if (typeof onEdit === 'function') onEdit();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du produit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await productService.delete(row.id);
      if (typeof onDelete === 'function') onDelete();
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err);
    }
  };

  const loadXLSX = async () => {
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    const mod = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    return (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : (mod.XLSX || mod.default || mod);
  };

  const handleExportProducts = async () => {
    try {
      const XLSX = await loadXLSX();
      const data = filteredProducts.map(p => ({
        code_produit: p.code_produit || '',
        nom_produit: p.nom_produit || '',
        code_barre: p.code_barre || '',
        description: p.description || '',
        unite_kg: !!p.unite_kg,
        unite_cartons: !!p.unite_cartons,
        seuil_alerte: p.seuil_alerte ?? 0,
        prix_achat: p.prix_achat ?? 0,
        prix_vente: p.prix_vente ?? 0,
        stock_actuel_kg: p.stock_actuel_kg ?? 0,
        stock_actuel_cartons: p.stock_actuel_cartons ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Produits');
      XLSX.writeFile(wb, `produits_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`);
    } catch (err) {
      console.error('Export XLSX échoué:', err);
      alert('Export XLSX échoué');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const splitCSVLine = (line, delimiter) => {
    let res = [], cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === delimiter && !inQ) {
        res.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res.map(s => s.trim());
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (!lines.length) return [];
    const first = lines[0];
    const delimiter = (first.split(';').length > first.split(',').length) ? ';' : ',';
    const headers = splitCSVLine(first, delimiter).map(h => h.replace(/^"|"$/g, '').toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = splitCSVLine(lines[i], delimiter).map(v => v.replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
      rows.push(row);
    }
    return rows;
  };

  const truthy = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return ['true','1','yes','oui','vrai'].includes(v.trim().toLowerCase());
    return false;
  };

  const normaliseRowToProduct = (row) => {
    const code = row.code_produit || row.code || '';
    const name = row.nom_produit || row.nom || row.name || '';
    const barcode = row.code_barre || row.barcode || '';
    const description = row.description || '';
    const unitRaw = row.unite || row.unit || '';
    const uniteKg = row.unite_kg;
    const uniteCartons = row.unite_cartons;

    let unit = 'both';
    if (uniteKg !== undefined || uniteCartons !== undefined) {
      const kg = truthy(uniteKg);
      const ct = truthy(uniteCartons);
      unit = (kg && ct) ? 'both' : (kg ? 'kg' : (ct ? 'cartons' : 'both'));
    } else if (unitRaw) {
      const u = String(unitRaw).toLowerCase();
      if (u.includes('kg') && u.includes('cart')) unit = 'both';
      else if (u.includes('kg')) unit = 'kg';
      else if (u.includes('cart')) unit = 'cartons';
    }

    const alertThreshold = parseFloat(row.seuil_alerte ?? row.alertthreshold ?? row.alert_threshold ?? 0) || 0;
    const pricePurchase = parseFloat(row.prix_achat ?? row.pricepurchase ?? 0) || 0;
    const priceSale = parseFloat(row.prix_vente ?? row.pricesale ?? 0) || 0;

    return {
      id: null,
      code,
      name,
      description,
      unit,
      alertThreshold,
      barcode,
      pricePurchase,
      priceSale,
    };
  };

  const normaliseAny = (obj) => {
    const row = {};
    Object.keys(obj || {}).forEach(k => { row[k.toLowerCase()] = obj[k]; });
    return normaliseRowToProduct(row);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const name = file.name.toLowerCase();
      const ext = name.substring(name.lastIndexOf('.'));
      let items = [];
      if (ext === '.json') {
        const text = await file.text();
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        items = arr.map(normaliseAny).filter(p => p.code && p.name);
      } else if (['.xlsx', '.xlsm', '.xlsb', '.xls', '.csv'].includes(ext)) {
        try {
          const XLSX = await loadXLSX();
          const data = await file.arrayBuffer();
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          items = rows.map(normaliseAny).filter(p => p.code && p.name);
        } catch (e2) {
          if (ext === '.csv') {
            const text = await file.text();
            const rows = parseCSV(text);
            items = rows.map(normaliseRowToProduct).filter(p => p.code && p.name);
          } else {
            throw e2;
          }
        }
      } else {
        alert('Format non supporté. Utilisez un fichier CSV, XLSX/XLS ou JSON.');
        return;
      }

      let created = 0, failed = 0;
      for (const p of items) {
        try {
          const payload = mapToBackendPayload(p);
          await productService.create(payload);
          created++;
        } catch (err) {
          failed++;
          console.error('Échec import produit', p.code, err);
        }
      }

      if (typeof onAdd === 'function') onAdd();
      alert(`Import terminé: ${created} créé(s), ${failed} erreur(s)`);
    } catch (err) {
      console.error('Erreur import:', err);
      alert('Erreur lors de l\'import. Vérifiez le format du fichier.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Grid  xs={12} md={12} style={{ padding: "50px" }}>
    <Paper sx={{ borderRadius: 2 }} >
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportProducts}
              disabled={importing}
              sx={{ borderRadius: 2 }}
            >
              Exporter
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={handleImportClick}
              disabled={importing}
              sx={{ borderRadius: 2 }}
            >
              Importer
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              sx={{ borderRadius: 2 }}
              disabled={importing}
            >
              Nouveau Produit
            </Button>
          </Box>
        </Box>

        <input type="file" ref={fileInputRef} accept=".csv,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={handleFileChange} style={{ display: 'none' }} />

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
                <MenuItem value="in-stock">En stock</MenuItem>
                <MenuItem value="out-of-stock">Rupture de stock</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nom du Produit</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock KG</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock Cartons</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Statut</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Prix Vente</TableCell>
                {showActions && <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow 
                    key={product.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover' 
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {product.code_produit || product.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.nom_produit || product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock_actuel_kg || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock_actuel_cartons || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stockStatus.status}
                        color={stockStatus.color}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {product.prix_vente || 0} DT
                      </Typography>
                    </TableCell>
                    {showActions && (
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Voir détails">
                            <IconButton 
                              size="small" 
                              onClick={() => { setDetailsProduct(product); setOpenDetails(true); }}
                              sx={{ color: 'primary.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEdit(product)}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(product)} 
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!maxRows && (
          <TablePagination
            component="div"
            count={filteredProducts.length}
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
    <ProductDialog
      open={openModal}
      onClose={() => { handleCloseModal(); }}
      product={product}
      onChange={(updatedProduct) => setProduct(updatedProduct)}
      onSubmit={product.id ? handleUpdateProduct : handleCreateProduct}
      loading={saving}
    />
    <ProductDetailsDialog
      open={openDetails}
      onClose={() => setOpenDetails(false)}
      product={detailsProduct}
    />
    </Grid>
  );
}

export default ProductsTable;
