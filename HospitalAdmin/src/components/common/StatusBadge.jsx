import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
    confirmed: { bg: '#f0fdf4', color: '#15803d', label: 'Confirmed' },
    cancelled: { bg: '#fef2f2', color: '#b91c1c', label: 'Cancelled' }
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
    }}>
      {s.label}
    </span>
  );
};

export default StatusBadge;
