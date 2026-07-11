import { useMemo } from 'react';
import type { Card } from '../types';

export function AnalyticsView({ cards }: { cards: Card[] }) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const analytics = useMemo(() => {
    let giftTotal = 0;
    let giftCount = 0;
    let creditTotal = 0;
    let creditCount = 0;
    let loyaltyTotal = 0; // if loyalty balance represents points or cash value
    let loyaltyCount = 0;
    
    let expiredTotal = 0;
    let expiredCount = 0;
    let activeTotal = 0;
    let activeCount = 0;

    cards.forEach((c) => {
      const isExpired = c.expiryDate ? c.expiryDate < todayStr : false;
      if (isExpired) {
        expiredTotal += c.balance;
        expiredCount++;
      } else {
        activeTotal += c.balance;
        activeCount++;
        
        if (c.type === 'gift') {
          giftTotal += c.balance;
          giftCount++;
        } else if (c.type === 'credit') {
          creditTotal += c.balance;
          creditCount++;
        } else if (c.type === 'loyalty') {
          loyaltyTotal += c.balance;
          loyaltyCount++;
        }
      }
    });

    const grandTotal = activeTotal + expiredTotal;
    const recoveryRate = grandTotal > 0 ? (activeTotal / grandTotal) * 100 : 100;

    return {
      giftTotal, giftCount,
      creditTotal, creditCount,
      loyaltyTotal, loyaltyCount,
      expiredTotal, expiredCount,
      activeTotal, activeCount,
      grandTotal, recoveryRate
    };
  }, [cards, todayStr]);

  const expiredCards = useMemo(() => {
    return cards.filter((c) => c.expiryDate && c.expiryDate < todayStr);
  }, [cards, todayStr]);

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Vault Insights</h1>
          <p className="muted">Recovered Value & Metrics</p>
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="empty">
          <p>No metrics available.</p>
          <p className="muted">Add cards to view your portfolio insights.</p>
        </div>
      ) : (
        <>
          {/* Recovery Rate Block */}
          <div className="card stack-gap" style={{textAlign: 'center', padding: '1.25rem'}}>
            <h2>Vault Utilization Rate</h2>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.03em'}}>
              {analytics.recoveryRate.toFixed(1)}%
            </div>
            <p className="muted small">
              You have secured ${analytics.activeTotal.toLocaleString()} out of ${analytics.grandTotal.toLocaleString()} total logged.
            </p>
            {analytics.expiredTotal > 0 && (
              <p className="error small">
                Warning: You lost ${analytics.expiredTotal.toLocaleString()} ({analytics.expiredCount} cards) to expiration.
              </p>
            )}
          </div>

          {/* Allocation */}
          <div className="stat-block" style={{marginTop: '1.25rem'}}>
            <h2>Active Portfolio Distribution</h2>
            <ul className="stat-list">
              <li>
                <div className="stat-list-meta">
                  <strong>Gift Cards</strong>
                  <span className="muted">{analytics.giftCount} cards active</span>
                </div>
                <span className="stat-badge">${analytics.giftTotal.toLocaleString()}</span>
              </li>
              <li>
                <div className="stat-list-meta">
                  <strong>Store Credit</strong>
                  <span className="muted">{analytics.creditCount} credits active</span>
                </div>
                <span className="stat-badge">${analytics.creditTotal.toLocaleString()}</span>
              </li>
              <li>
                <div className="stat-list-meta">
                  <strong>Loyalty Cash Value</strong>
                  <span className="muted">{analytics.loyaltyCount} programs active</span>
                </div>
                <span className="stat-badge">${analytics.loyaltyTotal.toLocaleString()}</span>
              </li>
            </ul>
          </div>

          {/* Expired List */}
          {expiredCards.length > 0 && (
            <div className="stat-block" style={{marginTop: '1.25rem'}}>
              <h2 style={{color: 'var(--danger)'}}>Expired Cards (Lost Money)</h2>
              <ul className="stat-list">
                {expiredCards.map((c) => (
                  <li key={c.id} style={{borderColor: 'var(--danger)'}}>
                    <div className="stat-list-meta">
                      <strong>{c.store}</strong>
                      <span className="muted">Expired on {c.expiryDate}</span>
                    </div>
                    <span className="stat-badge warn" style={{color: 'var(--danger)'}}>${c.balance.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
