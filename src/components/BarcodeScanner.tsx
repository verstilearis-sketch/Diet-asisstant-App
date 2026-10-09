'use client';

import { useEffect, useRef, useState } from 'react';

// ── Barcode scanner ───────────────────────────────────────────
// Opens the rear camera and scans EAN/UPC barcodes using html5-qrcode
// (loaded on demand so it never weighs down the main bundle).
// Calls onScan once with the decoded text, then shuts the camera down.

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    doneRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !mountRef.current) return;
        const id = 'zaiq-barcode-reader';
        const scanner = new Html5Qrcode(id, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText: string) => {
            if (doneRef.current) return;
            doneRef.current = true;
            onScan(decodedText);
          },
          () => { /* frame with no barcode — ignore */ },
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error && /permission/i.test(e.message)
              ? 'Camera permission was denied. Allow camera access and try again.'
              : 'Could not start the camera. Please try again.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      doneRef.current = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch { /* noop */ } });
    };
    // onScan/onClose are stable callbacks from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Scan a barcode"
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(10, 20, 14, 0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: 420, padding: '1.25rem', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>Scan a barcode</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: '0 0 1rem' }}>
          Point your camera at the barcode on the pack.
        </p>
        {error ? (
          <div className="error-box" style={{ textAlign: 'left', marginBottom: '1rem' }}>{error}</div>
        ) : (
          <div
            id="zaiq-barcode-reader"
            ref={mountRef}
            style={{ width: '100%', borderRadius: '0.75rem', overflow: 'hidden', background: '#000', minHeight: 220 }}
          />
        )}
        <button type="button" className="btn-ghost" onClick={onClose} style={{ marginTop: '1rem', width: '100%', padding: '0.7rem' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
