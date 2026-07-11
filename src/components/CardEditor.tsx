import { useState } from 'react';
import type { Card, CardType } from '../types';
import { compressImage } from '../storage';

export function CardEditor({
  card,
  onSave,
  onCancel,
}: {
  card: Card | null;
  onSave: (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [store, setStore] = useState(card?.store ?? '');
  const [balance, setBalance] = useState(card?.balance ?? 0);
  const [type, setType] = useState<CardType>(card?.type ?? 'gift');
  const [expiryDate, setExpiryDate] = useState(card?.expiryDate ?? '');
  const [serialNumber, setSerialNumber] = useState(card?.serialNumber ?? '');
  const [pin, setPin] = useState(card?.pin ?? '');
  const [notes, setNotes] = useState(card?.notes ?? '');
  const [photo, setPhoto] = useState<string | null>(card?.photoId ?? null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | null) {
    if (!file) return;
    setCompressing(true);
    setError('');
    try {
      const base64 = await compressImage(file);
      setPhoto(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image compression failed');
    } finally {
      setCompressing(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!store.trim()) {
      setError('Store/Card name is required');
      return;
    }
    if (balance < 0) {
      setError('Balance cannot be negative');
      return;
    }
    
    onSave({
      store: store.trim(),
      balance: Number(balance),
      type,
      expiryDate: expiryDate || undefined,
      serialNumber: serialNumber.trim() || undefined,
      pin: pin.trim() || undefined,
      notes: notes.trim() || undefined,
      photoId: photo,
    });
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>{card ? 'Edit Card' : 'Add Card'}</h1>
          <p className="muted">{card ? `Updating details for ${card.store}` : 'Keep your balances secure'}</p>
        </div>
      </header>

      <form className="form" onSubmit={submit}>
        <label className="photo-drop" style={{minHeight: '160px'}}>
          {photo ? (
            <img src={photo} alt="Uploaded Card/Barcode" style={{width: '100%', height: '160px', objectFit: 'contain', backgroundColor: '#fff'}} />
          ) : (
            <span>{compressing ? 'Compressing…' : 'Tap to upload Card / Barcode Photo'}</span>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={compressing}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Store / Brand Name *
          <input
            className="input"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="e.g. Starbucks, Target, Amazon"
            autoFocus
          />
        </label>

        <div className="form-row">
          <label>
            Current Balance ($) *
            <input
              type="number"
              step="0.01"
              className="input"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
            />
          </label>
          <label>
            Card Type
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as CardType)}
            >
              <option value="gift">Gift Card</option>
              <option value="credit">Store Credit</option>
              <option value="loyalty">Loyalty / Points</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Expiry Date
            <input
              type="date"
              className="input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </label>
          <label>
            Card / Serial Number
            <input
              className="input"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Barcode string / Card #"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            PIN
            <input
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN / Security Code"
            />
          </label>
          <label>
            Notes
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received from work anniversary"
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={compressing}>
            {card ? 'Update Details' : 'Add to Vault'}
          </button>
        </div>
      </form>
    </section>
  );
}
