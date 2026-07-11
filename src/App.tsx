import { useState, useEffect } from 'react';
import type { Card } from './types';
import { hasVault, setupVault, unlockVault, saveVault, uid } from './storage';
import { DashboardView } from './components/DashboardView';
import { CardEditor } from './components/CardEditor';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import './App.css';

type View = 'dashboard' | 'add' | 'analytics' | 'settings';

export default function App() {
  // Vault state
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [vaultExists, setVaultExists] = useState(() => hasVault());

  // Navigation
  const [view, setView] = useState<View>('dashboard');
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Form states for unlock/setup
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setVaultExists(hasVault());
  }, [unlocked]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pinInput.trim()) {
      setError('PIN cannot be empty');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setError('PINs do not match');
      return;
    }

    try {
      await setupVault(pinInput);
      setPassword(pinInput);
      setCards([]);
      setUnlocked(true);
    } catch {
      setError('Failed to setup vault');
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pinInput.trim()) {
      setError('Please enter your PIN');
      return;
    }

    try {
      const decryptedCards = await unlockVault(pinInput);
      setPassword(pinInput);
      setCards(decryptedCards);
      setUnlocked(true);
      setPinInput('');
    } catch {
      setError('Incorrect Password/PIN');
    }
  }

  function handleLock() {
    setUnlocked(false);
    setPassword('');
    setCards([]);
    setPinInput('');
    setConfirmPinInput('');
    setError('');
    setView('dashboard');
  }

  function handleWipe() {
    handleLock();
    setVaultExists(false);
  }

  async function handleAddOrUpdate(data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) {
    let updatedCards: Card[];
    const nowStr = new Date().toISOString();
    
    if (editingCard) {
      updatedCards = cards.map((c) =>
        c.id === editingCard.id
          ? { ...c, ...data, updatedAt: nowStr }
          : c
      );
      setEditingCard(null);
    } else {
      const newCard: Card = {
        ...data,
        id: uid('crd_'),
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      updatedCards = [...cards, newCard];
    }

    try {
      await saveVault(updatedCards, password);
      setCards(updatedCards);
      setView('dashboard');
    } catch {
      alert('Failed to save card data');
    }
  }

  async function handleDelete(id: string) {
    const updated = cards.filter((c) => c.id !== id);
    try {
      await saveVault(updated, password);
      setCards(updated);
    } catch {
      alert('Failed to delete card');
    }
  }

  if (!unlocked) {
    return (
      <div className="app" style={{justifyContent: 'center', minHeight: '100dvh', padding: '1rem'}}>
        <header style={{textAlign: 'center', marginBottom: '2.5rem'}}>
          <div className="brand" style={{justifyContent: 'center', gap: '0.85rem'}}>
            <span className="brand-mark" style={{width: '44px', height: '44px', fontSize: '1.1rem'}}>VV</span>
            <div style={{textAlign: 'left'}}>
              <strong style={{fontSize: '1.4rem'}}>ValueVault</strong>
              <span className="brand-sub" style={{fontSize: '0.85rem'}}>secured loyalty & gift tracking</span>
            </div>
          </div>
        </header>

        {vaultExists ? (
          <form className="form card stack-gap" onSubmit={handleUnlock}>
            <h2>Unlock Your Vault</h2>
            <p className="muted small">Enter your Master PIN/Password to access your gift cards.</p>
            <label>
              Master PIN / Password
              <input
                type="password"
                className="input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn primary wide">Unlock Vault</button>
          </form>
        ) : (
          <form className="form card stack-gap" onSubmit={handleSetup}>
            <h2>Create Secure Vault</h2>
            <p className="muted small">
              Set a local Master PIN. All data is encrypted locally using AES-256. If you forget this PIN, your data cannot be recovered.
            </p>
            <label>
              Choose Master PIN / Password
              <input
                type="password"
                className="input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="e.g. 1234 or strong passphrase"
                autoFocus
              />
            </label>
            <label>
              Confirm PIN
              <input
                type="password"
                className="input"
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Confirm PIN"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn primary wide">Initialize Vault</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => { setEditingCard(null); setView('dashboard'); }} style={{cursor: 'pointer'}}>
          <span className="brand-mark">VV</span>
          <div>
            <strong>ValueVault</strong>
            <span className="brand-sub">secure balances tracker</span>
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'dashboard' && (
          <DashboardView
            cards={cards}
            onAddCard={() => {
              setEditingCard(null);
              setView('add');
            }}
            onEditCard={(c) => {
              setEditingCard(c);
              setView('add');
            }}
            onDeleteCard={handleDelete}
          />
        )}

        {view === 'add' && (
          <CardEditor
            card={editingCard}
            onSave={handleAddOrUpdate}
            onCancel={() => {
              setEditingCard(null);
              setView('dashboard');
            }}
          />
        )}

        {view === 'analytics' && (
          <AnalyticsView cards={cards} />
        )}

        {view === 'settings' && (
          <SettingsView
            cards={cards}
            password={password}
            onLock={handleLock}
            onWipe={handleWipe}
            onUpdatePIN={(newPIN) => setPassword(newPIN)}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
        <button
          type="button"
          className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setEditingCard(null); setView('dashboard'); }}
        >
          <span className="nav-short">Cards</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${view === 'add' ? 'active' : ''}`}
          onClick={() => { setEditingCard(null); setView('add'); }}
        >
          <span className="nav-short">Add</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${view === 'analytics' ? 'active' : ''}`}
          onClick={() => { setEditingCard(null); setView('analytics'); }}
        >
          <span className="nav-short">Stats</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => { setEditingCard(null); setView('settings'); }}
        >
          <span className="nav-short">Settings</span>
        </button>
      </nav>
    </div>
  );
}
