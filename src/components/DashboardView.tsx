import { useMemo, useState } from 'react';
import type { Card, CardType } from '../types';

export function DashboardView({
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  cards: Card[];
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'soon' | 'expired'>('all');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const parsedCards = useMemo(() => {
    return cards.map((c) => {
      const isExpired = c.expiryDate ? c.expiryDate < todayStr : false;
      let isSoon = false;
      if (c.expiryDate && !isExpired) {
        const diffTime = new Date(c.expiryDate).getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isSoon = diffDays <= 30; // Expiring in next 30 days
      }
      return { ...c, isExpired, isSoon };
    });
  }, [cards, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    let activeTotal = 0;
    let expiredTotal = 0;
    let expiringSoonCount = 0;
    let activeCount = 0;
    
    parsedCards.forEach((c) => {
      if (c.isExpired) {
        expiredTotal += c.balance;
      } else {
        activeTotal += c.balance;
        activeCount++;
        if (c.isSoon) {
          expiringSoonCount++;
        }
      }
    });

    return { activeTotal, expiredTotal, expiringSoonCount, activeCount };
  }, [parsedCards]);

  const filteredCards = useMemo(() => {
    return parsedCards.filter((c) => {
      const matchSearch = c.store.toLowerCase().includes(search.toLowerCase()) || 
                          (c.serialNumber && c.serialNumber.includes(search)) ||
                          c.balance.toString().includes(search);
      const matchType = typeFilter === 'all' ? true : c.type === typeFilter;
      const matchExpiry = expiryFilter === 'all' ? true :
                          expiryFilter === 'soon' ? c.isSoon : c.isExpired;
      return matchSearch && matchType && matchExpiry;
    });
  }, [parsedCards, search, typeFilter, expiryFilter]);

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>ValueVault</h1>
          <p className="muted">Unified Balance Tracker</p>
        </div>
        <button type="button" className="btn primary" onClick={onAddCard}>
          + Add Card
        </button>
      </header>

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-num">${stats.activeTotal.toLocaleString()}</span>
          <span className="stat-label">Active Value</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.activeCount}</span>
          <span className="stat-label">Active Cards</span>
        </div>
        {stats.expiringSoonCount > 0 && (
          <div className="stat-card" style={{borderColor: 'var(--warn)'}}>
            <span className="stat-num" style={{color: 'var(--warn)'}}>{stats.expiringSoonCount}</span>
            <span className="stat-label">Expiring in 30d</span>
          </div>
        )}
        {stats.expiredTotal > 0 && (
          <div className="stat-card" style={{borderColor: 'var(--danger)'}}>
            <span className="stat-num" style={{color: 'var(--danger)'}}>${stats.expiredTotal.toLocaleString()}</span>
            <span className="stat-label">Lost (Expired)</span>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="filters">
        <input
          className="input"
          placeholder="Search by store or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CardType | 'all')}
        >
          <option value="all">All Types</option>
          <option value="gift">Gift Cards</option>
          <option value="loyalty">Loyalty Cards</option>
          <option value="credit">Store Credits</option>
        </select>
        <select
          className="input"
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value as 'all' | 'soon' | 'expired')}
        >
          <option value="all">Any Status</option>
          <option value="soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Cards List */}
      {filteredCards.length === 0 ? (
        <div className="empty">
          <p>No cards found.</p>
          <p className="muted">Enter your gift cards to secure your "found money".</p>
          <button type="button" className="btn primary" onClick={onAddCard}>
            Add First Card
          </button>
        </div>
      ) : (
        <ul className="item-list">
          {filteredCards.map((c) => {
            const isSelected = selectedCardId === c.id;
            return (
              <li 
                key={c.id} 
                className="item-row" 
                style={{
                  flexDirection: 'column', 
                  alignItems: 'stretch',
                  borderColor: isSelected ? 'var(--primary)' : c.isExpired ? 'var(--danger)' : c.isSoon ? 'var(--warn)' : 'var(--border)'
                }}
              >
                {/* Header Info */}
                <div 
                  style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'}}
                  onClick={() => setSelectedCardId(isSelected ? null : c.id)}
                >
                  <div className="item-meta">
                    <strong>{c.store}</strong>
                    <span className="tags">
                      <span className="tag">{c.type === 'gift' ? 'Gift Card' : c.type === 'credit' ? 'Store Credit' : 'Loyalty'}</span>
                      {c.expiryDate && (
                        <span className={`tag ${c.isExpired ? 'danger' : c.isSoon ? 'warn' : ''}`}>
                          {c.isExpired ? 'Expired: ' : 'Expires: '}{c.expiryDate}
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{textAlign: 'right', marginRight: '0.5rem'}}>
                    <span className={`stat-badge ${c.isExpired ? 'muted-badge' : ''}`} style={{fontSize: '1.2rem'}}>
                      ${c.balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Details Section (Accordion) */}
                {isSelected && (
                  <div style={{marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'grid', gap: '0.65rem'}}>
                    {c.serialNumber && (
                      <div>
                        <span className="muted small">Card Number / Serial:</span>
                        <div style={{fontFamily: 'monospace', fontSize: '1rem', background: 'var(--bg-soft)', padding: '0.35rem 0.5rem', borderRadius: '6px', marginTop: '0.2rem'}}>
                          {c.serialNumber}
                        </div>
                      </div>
                    )}
                    
                    {c.pin && (
                      <div>
                        <span className="muted small">PIN:</span>
                        <div style={{fontFamily: 'monospace', fontSize: '1rem', background: 'var(--bg-soft)', padding: '0.35rem 0.5rem', borderRadius: '6px', marginTop: '0.2rem'}}>
                          {c.pin}
                        </div>
                      </div>
                    )}

                    {c.notes && (
                      <div>
                        <span className="muted small">Notes:</span>
                        <p className="small" style={{marginTop: '0.2rem'}}>{c.notes}</p>
                      </div>
                    )}

                    {c.photoId && (
                      <div>
                        <span className="muted small">Barcode / Photo:</span>
                        <img 
                          src={c.photoId} 
                          alt="Card Barcode/Upload" 
                          style={{
                            maxWidth: '100%', 
                            maxHeight: '160px', 
                            objectFit: 'contain', 
                            borderRadius: '8px', 
                            marginTop: '0.35rem', 
                            border: '1px solid var(--border)',
                            backgroundColor: '#fff'
                          }} 
                        />
                      </div>
                    )}

                    <div className="form-actions" style={{marginTop: '0.5rem'}}>
                      <button 
                        type="button" 
                        className="btn ghost" 
                        onClick={() => onEditCard(c)}
                      >
                        Edit / Update Balance
                      </button>
                      <button 
                        type="button" 
                        className="btn ghost danger" 
                        onClick={() => {
                          if (confirm(`Delete card details for "${c.store}"?`)) {
                            onDeleteCard(c.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
