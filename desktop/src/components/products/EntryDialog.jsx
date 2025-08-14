import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Autocomplete,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip
} from '@mui/material';
import { Inventory as EntryIcon, Add as AddIcon, Delete as DeleteIcon, PhotoCamera as CameraIcon } from '@mui/icons-material';
import CameraScannerDialog from '../common/CameraScannerDialog';

function EntryDialog({ 
  open, 
  onClose, 
  onSubmit, 
  entry = { items: [] }, 
  onChange = () => {}, 
  products = [],
  loading = false 
}) {
  const today = new Date().toISOString().split('T')[0];

  const [openScanner, setOpenScanner] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(entry); // envoie l'objet complet
  };

  // Ajouter une ligne produit
  const handleAddItem = () => {
    const newItems = [...(entry.items || []), {
      productId: '',
      productCode: '',
      productName: '',
      barcode: '',
      quantityKg: 0,
      quantityCartons: 0,
      expirationDate: '',
      remarks: ''
    }];
    console.log('okkkkkk')
    onChange?.({ ...entry, items: newItems });
  };

  // Supprimer une ligne produit
  const handleRemoveItem = (index) => {
    const newItems = (entry.items || []).filter((_, i) => i !== index);
    onChange?.({ ...entry, items: newItems });
  };

  // Modifier une cellule
  const handleItemChange = (index, field, value) => {
    const newItems = [...(entry.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange?.({ ...entry, items: newItems });
  };

  // Quand on sélectionne un produit dans l'Autocomplete
  const handleProductSelect = (index, product) => {
    const newItems = [...(entry.items || [])];
    newItems[index] = {
      ...newItems[index],
      productId: product?.id || '',
      productCode: product?.code || '',
      productName: product?.name || '',
      barcode: product?.barcode || '',
    };
    onChange?.({ ...entry, items: newItems });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EntryIcon color="success" />
          <Typography variant="h6" fontWeight="bold">
            Nouvelle Entrée de Stock
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Infos réception */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Informations de Réception
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required fullWidth type="date" label="Date de Réception"
                value={entry.receptionDate || today}
                onChange={(e) => onChange?.({ ...entry, receptionDate: e.target.value })}
                InputLabelProps={{ shrink: true }} disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required fullWidth label="Numéro de Réception"
                value={entry.receptionNumber || ''}
                onChange={(e) => onChange?.({ ...entry, receptionNumber: e.target.value })}
                placeholder="REC-2024-001" disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth label="Numéro Carnet"
                value={entry.carnetNumber || ''}
                onChange={(e) => onChange?.({ ...entry, carnetNumber: e.target.value })}
                placeholder="CAR-001" disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Numéro Facture"
                value={entry.invoiceNumber || ''}
                onChange={(e) => onChange?.({ ...entry, invoiceNumber: e.target.value })}
                placeholder="FAC-2024-001" disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Numéro Packing Liste"
                value={entry.packingListNumber || ''}
                onChange={(e) => onChange?.({ ...entry, packingListNumber: e.target.value })}
                placeholder="PL-001" disabled={loading}
              />
            </Grid>
            <Grid item xs={6} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  fullWidth
                  label="Scanner Code-Barres / QR"
                  placeholder="Scannez un produit ou un QR JSON..."
                  disabled={loading}
                  onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const raw = e.target.value.trim();
                    if (!raw) return;

                    const tryIso = (d) => d ? (/T\d{2}:/.test(d) ? d : `${d}T00:00:00`) : '';

                    let parsed = null;
                    try { parsed = JSON.parse(raw); } catch {}

                    if (parsed && typeof parsed === 'object') {
                      // QR JSON: peut contenir productId, code_produit, code_barre, qte_kg, qte_cartons, date_peremption, num_reception, receptionDate, remarque
                      let prod = null;
                      if (parsed.productId) prod = products.find(p => p.id === Number(parsed.productId));
                      if (!prod && parsed.code_produit) prod = products.find(p => (p.code_produit || p.code) === parsed.code_produit);
                      if (!prod && parsed.code_barre) prod = products.find(p => (p.code_barre || p.barcode) === parsed.code_barre);

                      if (parsed.receptionDate || parsed.num_reception) {
                        onChange?.({
                          ...entry,
                          receptionDate: parsed.receptionDate || entry.receptionDate,
                          receptionNumber: parsed.num_reception || entry.receptionNumber,
                        });
                      }

                      if (prod) {
                        const newItems = [
                          ...(entry.items || []),
                          {
                            productId: prod.id,
                            productCode: prod.code_produit || prod.code,
                            productName: prod.nom_produit || prod.name,
                            barcode: prod.code_barre || prod.barcode,
                            quantityKg: Number(parsed.qte_kg || 0),
                            quantityCartons: Number(parsed.qte_cartons || 0),
                            expirationDate: tryIso(parsed.date_peremption) || '',
                            remarks: parsed.remarque || ''
                          }
                        ];
                        onChange?.({ ...entry, items: newItems });
                      } else {
                        alert('Produit non trouvé dans le QR');
                      }
                      e.target.value = '';
                      return;
                    }

                    // Fallback: code-barres simple
                    const product = products.find(p => (p.code_barre || p.barcode) === raw || (p.code_produit || p.code) === raw);
                    if (product) {
                      const newItems = [
                        ...(entry.items || []),
                        {
                          productId: product.id,
                          productCode: product.code_produit || product.code,
                          productName: product.nom_produit || product.name,
                          barcode: product.code_barre || product.barcode,
                          quantityKg: 0,
                          quantityCartons: 0,
                          expirationDate: '',
                          remarks: ''
                        }
                      ];
                      onChange?.({ ...entry, items: newItems });
                      e.target.value = '';
                    } else {
                      alert('Produit non trouvé !');
                    }
                  }
                }}
                />
                <Tooltip title="Scanner via Caméra">
                  <IconButton onClick={() => setOpenScanner(true)} disabled={loading}>
                    <CameraIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <CameraScannerDialog
                open={openScanner}
                onClose={() => setOpenScanner(false)}
                onDetected={(code) => {
                  const e = { key: 'Enter', preventDefault: () => {}, target: { value: code } };
                  // réutiliser la logique existante
                  // onKeyDown handler n'est pas accessible ici facilement; dupliquer le comportement simplifié
                  const raw = code.trim();
                  if (!raw) return;
                  let parsed = null;
                  try { parsed = JSON.parse(raw); } catch {}
                  if (parsed && typeof parsed === 'object') {
                    let prod = null;
                    if (parsed.productId) prod = products.find(p => p.id === Number(parsed.productId));
                    if (!prod && parsed.code_produit) prod = products.find(p => (p.code_produit || p.code) === parsed.code_produit);
                    if (!prod && parsed.code_barre) prod = products.find(p => (p.code_barre || p.barcode) === parsed.code_barre);
                    if (parsed.receptionDate || parsed.num_reception) {
                      onChange?.({ ...entry, receptionDate: parsed.receptionDate || entry.receptionDate, receptionNumber: parsed.num_reception || entry.receptionNumber });
                    }
                    if (prod) {
                      const newItems = [ ...(entry.items || []), {
                        productId: prod.id,
                        productCode: prod.code_produit || prod.code,
                        productName: prod.nom_produit || prod.name,
                        barcode: prod.code_barre || prod.barcode,
                        quantityKg: Number(parsed.qte_kg || 0),
                        quantityCartons: Number(parsed.qte_cartons || 0),
                        expirationDate: parsed.date_peremption || '',
                        remarks: parsed.remarque || ''
                      }];
                      onChange?.({ ...entry, items: newItems });
                    }
                  } else {
                    const product = products.find(p => (p.code_barre || p.barcode) === raw || (p.code_produit || p.code) === raw);
                    if (product) {
                      const newItems = [ ...(entry.items || []), {
                        productId: product.id,
                        productCode: product.code_produit || product.code,
                        productName: product.nom_produit || product.name,
                        barcode: product.code_barre || product.barcode,
                        quantityKg: 0, quantityCartons: 0, expirationDate: '', remarks: ''
                      }];
                      onChange?.({ ...entry, items: newItems });
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
          
          {/* Tableau produits */}
          <Box mt={4}>
           
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              
              <Typography variant="h6" color="primary">Articles</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} disabled={loading}>
                Ajouter un Article
              </Button>
            </Box>
    
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produit</TableCell>
                  <TableCell>Code-Barre</TableCell>
                  <TableCell>Quantité (kg)</TableCell>
                  <TableCell>Quantité (cartons)</TableCell>
                  <TableCell>Date Péremption</TableCell>
                  <TableCell>Remarques</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(entry.items || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Autocomplete
                        options={products}
                        getOptionLabel={(option) => `${option.code_produit || option.code} - ${option.nom_produit || option.name}`}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(e, newValue) => handleProductSelect(index, newValue)}
                        renderInput={(params) => <TextField {...params} variant="outlined" size="small" />}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField value={item.barcode || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'barcode', e.target.value)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={item.quantityKg || 0} size="small"
                        onChange={(e) => handleItemChange(index, 'quantityKg', parseFloat(e.target.value) || 0)}
                        inputProps={{ min:0, step:0.1 }} disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={item.quantityCartons || 0} size="small"
                        onChange={(e) => handleItemChange(index, 'quantityCartons', parseInt(e.target.value) || 0)}
                        inputProps={{ min:0, step:1 }} disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField type="date" value={item.expirationDate || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'expirationDate', e.target.value)}
                        InputLabelProps={{ shrink:true }} disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField value={item.remarks || ''} size="small"
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Supprimer">
                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)} disabled={loading}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" color="success" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer l\'Entrée'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EntryDialog;
