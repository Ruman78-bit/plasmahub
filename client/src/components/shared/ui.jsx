import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  fulfilled: 'Fulfilled',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
};
// 
const URGENCY_ICONS = {
  routine: '🟢',
  urgent: '🟡',
  critical: '🔴'
};

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

export function UrgencyBadge({ urgency }) {
  return (
    <span className={`badge badge-${urgency}`}>
      <span style={{ marginRight: 6 }}>{URGENCY_ICONS[urgency] || '⚠️'}</span>
      {urgency}
    </span>
  );
}

export function BloodTag({ group }) {
  return <span className="blood-tag">{group}</span>;
}

export function EmptyState({ icon = '📭', message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

export function Spinner({ size = 36 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid #fee2e2',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          animation: 'spin .8s linear infinite'
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const iconMap = {
    error: '⚠️',
    success: '✅',
    info: 'ℹ️',
    warn: '⚠️'
  };

  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{iconMap[type] || 'ℹ️'}</span>
      <div>{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export function ProgressRow({ label, value, total, badge }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex justify-between" style={{ gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        {badge ? <span className="badge badge-info">{badge}</span> : <span style={{ fontSize: 13, color: '#6b7280' }}>{value} ({percent}%)</span>}
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((message, type = 'success') => {
    // Clear existing timeout before showing new toast
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setToast({ msg: message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useMemo(() => ({ toast, show, dismiss }), [toast, show, dismiss]);
}


import React from 'react';
