import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { BrowserMultiFormatReader } from '@zxing/library';

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
  const zxingRef = useRef(null);

  useEffect(() => {
    const start = async () => {
      setError('');
      try {
        const constraints = { video: { facingMode: 'environment' } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          const BarcodeDetector = window.BarcodeDetector;
          const formats = preferredFormats && preferredFormats.length ? preferredFormats : undefined;
          detectorRef.current = new BarcodeDetector({ formats });
          loopBD();
        } else {
          setSupported(false);
          // fallback ZXing
          zxingRef.current = new BrowserMultiFormatReader();
          loopZX();
        }
      } catch (e) {
        setError('Impossible d\'accéder à la caméra');
        console.error(e);
      }
    };

    const loopBD = async () => {
      if (!detectorRef.current || !videoRef.current) return;
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length) {
          const code = barcodes[0].rawValue || (barcodes[0].rawValue + '');
          onDetected && onDetected(code, barcodes[0]);
          onClose && onClose();
          return;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(loopBD);
    };

    const loopZX = async () => {
      if (!zxingRef.current || !videoRef.current) return;
      try {
        const result = await zxingRef.current.decodeOnceFromVideoElement(videoRef.current);
        if (result && result.text != null) {
          onDetected && onDetected(result.text, result);
          onClose && onClose();
          return;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(loopZX);
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
      if (zxingRef.current) {
        try { zxingRef.current.reset && zxingRef.current.reset(); } catch {}
        zxingRef.current = null;
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {!supported && (
          <Typography color="warning.main" variant="body2" gutterBottom>
            BarcodeDetector non disponible. Fallback ZXing activé.
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
