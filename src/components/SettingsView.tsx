import { useState } from 'react';
import { saveVault, wipeVault } from '../storage';
import type { Card } from '../types';

export function SettingsView({
  cards,
  password,
  onLock,
  onWipe,
  onUpdatePIN,
}: {
  cards: Card[];
  password: string;
  onLock: () => void;
  onWipe: () => void;
  onUpdatePIN: (newPIN: string) => void;
}) {
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function updatePIN(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!newPIN.trim()) {
      setError('PIN cannot be empty');
      return;
    }
    if (newPIN !== confirmPIN) {
      setError('PINs do not match');
      return;
    }

    try {
      // Re-save existing cards with the new password
      await saveVault(cards, newPIN);
      onUpdatePIN(newPIN);
      setMsg('PIN successfully updated!');
      setNewPIN('');
      setConfirmPIN('');
    } catch {
      setError('Failed to update PIN');
    }
  }

  function handleWipe() {
    if (confirm('CRITICAL WARNING: This will permanently wipe your vault and erase all card data from this device. Proceed?')) {
      wipeVault();
      onWipe();
    }
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Settings</h1>
          <p className="muted">Vault Security & PIN Controls</p>
        </div>
      </header>

      <div className="card stack-gap">
        <h2>Change Master PIN</h2>
        <p className="muted">Update the PIN used to encrypt and decrypt your vault data.</p>
        <form className="form" onSubmit={updatePIN}>
          <label>
            New PIN / Password
            <input
              type="password"
              className="input"
              value={newPIN}
              onChange={(e) => setNewPIN(e.target.value)}
              placeholder="e.g. 1234 or a strong password"
            />
          </label>
          <label>
            Confirm New PIN
            <input
              type="password"
              className="input"
              value={confirmPIN}
              onChange={(e) => setConfirmPIN(e.target.value)}
              placeholder="Confirm PIN"
            />
          </label>
          
          {error && <p className="error">{error}</p>}
          {msg && <p className="toast" style={{color: 'var(--primary)', textAlign: 'left'}}>{msg}</p>}

          <div className="form-actions left">
            <button type="submit" className="btn primary">
              Update PIN
            </button>
          </div>
        </form>
      </div>

      <div className="card stack-gap" style={{marginTop: '1.25rem'}}>
        <h2>Security Commands</h2>
        <p className="muted">Temporarily close the session or permanently clear stored details.</p>
        <div className="form-actions left" style={{gap: '0.75rem'}}>
          <button type="button" className="btn ghost" onClick={onLock}>
            Lock Vault (Close Session)
          </button>
          <button type="button" className="btn ghost danger" onClick={handleWipe}>
            Permanently Wipe Vault
          </button>
        </div>
      </div>

      <div className="card stack-gap" style={{marginTop: '1.25rem'}}>
        <h2>Data Statistics</h2>
        <p className="muted">
          Currently managing {cards.length} cards locally. All data is AES-256 encrypted inside your browser storage (IndexedDB/LocalStorage).
        </p>
      </div>
    </section>
  );
}
