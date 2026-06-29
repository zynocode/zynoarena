import React from 'react';

interface DrawOfferDialogProps {
  offeredBy: 'w' | 'b';
  onAccept: () => void;
  onDecline: () => void;
}

export const DrawOfferDialog: React.FC<DrawOfferDialogProps> = ({ offeredBy, onAccept, onDecline }) => {
  const offerSide = offeredBy === 'w' ? 'White' : 'Black';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.96)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px',
        padding: '28px 32px',
        maxWidth: '340px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: '42px', marginBottom: '12px' }}>🤝</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
          Draw Offered
        </h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#94a3b8' }}>
          {offerSide} is offering a draw. Do you accept?
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            ✓ Accept
          </button>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          >
            ✗ Decline
          </button>
        </div>
      </div>
    </div>
  );
};
