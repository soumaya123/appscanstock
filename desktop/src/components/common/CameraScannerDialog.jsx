import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';

/**
 * CameraScannerDialog
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onDetected: (code: string, raw: any) => void
 * - preferredFormats?: string[] (e.g., ['qr_code','ean_13','code_128'])
 * - title?: string
 */
function CameraScannerDialog({ open, onClose, onDetected, preferredFormats = ['qr_code','ean_13','code_128','code_39','upc_a','upc_e'], title = 'Scanner (Caméra)' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);
  const rafRef = useRef(0);
  const detectorRef = useRef(null);

  useEffect(() => {
    const start = async () => {
      setError('');
      try {
        if (!('BarcodeDetector' in window)) {
          setSupported(false);
          setError('BarcodeDetector non supporté par ce runtime.');
          return;
        }
        const BarcodeDetector = window.BarcodeDetector;
        const formats = preferredFormats && preferredFormats.length ? preferredFormats : undefined;
        detectorRef.current = new BarcodeDetector({ formats });
        const constraints = { video: { facingMode: 'environment' } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          loop();
        }
      } catch (e) {
        setError('Impossible d\'accéder à la caméra');
        console.error(e);
      }
    };

    const loop = async () => {
      if (!detectorRef.current || !videoRef.current) return;
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length) {
          // Prendre le premier code détecté
          const code = barcodes[0].rawValue || barcodes[0].rawValue === '' ? barcodes[0].rawValue : (barcodes[0].rawValue + '');
          if (onDetected) onDetected(code, barcodes[0]);
          // On ferme après une détection
          onClose && onClose();
          return;
        }
      } catch (e) {
        // ignorer pour le prochain frame
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    if (open) start();
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      detectorRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {!supported && (
          <Typography color="error" variant="body2" gutterBottom>
            Votre environnement ne supporte pas l\'API BarcodeDetector. Utilisez le scan manuel.
          </Typography>
        )}
        {error && (
          <Typography color="error" variant="body2" gutterBottom>
            {error}
          </Typography>
        )}
        <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <Box sx={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', border: '2px solid rgba(255,255,255,0.7)', borderRadius: 1 }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CameraScannerDialog;
