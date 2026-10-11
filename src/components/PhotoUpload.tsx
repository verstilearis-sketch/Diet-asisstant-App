'use client';

/* ── Profile photo upload ────────────────────────────────────────────────
   JPEG/PNG only — validated by file magic bytes (not just the extension),
   so a renamed malicious file can't slip through. The image is compressed
   client-side (max 512px, JPEG 0.75) and stored as a data URL with the plan.
------------------------------------------------------------------------ */

import { useRef, useState } from 'react';

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

async function detectImageType(file: File): Promise<'jpeg' | 'png' | null> {
  const buf = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (JPEG_MAGIC.every((b, i) => buf[i] === b)) return 'jpeg';
  if (PNG_MAGIC.every((b, i) => buf[i] === b)) return 'png';
  return null;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

export function PhotoUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('That file is over 10 MB — please pick a smaller photo.');
      return;
    }
    setBusy(true);
    try {
      const kind = await detectImageType(file);
      if (!kind) {
        setError('Only JPEG or PNG photos can be uploaded.');
        return;
      }
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      setError('Could not process that photo — try another one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div
          style={{
            width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-surface)',
            border: '2px dashed var(--color-border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'pointer',
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="Upload your photo"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Your photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.6rem', color: 'var(--color-faint)' }}>+</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
            {value ? 'Photo added' : 'Add your photo'}
            <span style={{ color: 'var(--color-faint)', fontWeight: 500, fontSize: '0.8rem' }}> (optional)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="option-card"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? 'Processing…' : value ? 'Change photo' : 'Upload photo'}
            </button>
            {value && (
              <button
                type="button"
                className="option-card"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 600 }}
                onClick={() => onChange(undefined)}
              >
                Remove
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-faint)', marginTop: '0.35rem' }}>
            JPEG or PNG only · stored securely with your plan
          </div>
        </div>
      </div>
      {error && (
        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>{error}</div>
      )}
    </div>
  );
}
