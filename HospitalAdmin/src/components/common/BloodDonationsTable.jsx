import React from 'react';
import StatusBadge from './StatusBadge';

const BloodDonationsTable = ({ data, updateStatus }) => {
  return (
    <div className="table-responsive">
      <table cellSpacing="0">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Patient</th>
            <th>Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(app => (
            <tr key={app.id}>
              <td>
                <div className="cell-primary">{app.donor_name || 'Unknown'}</div>
                <div className="cell-secondary">{app.phone_number} • {app.blood_group || 'No BG'}</div>
              </td>
              <td>
                <div className="cell-primary">{app.last_donation_date}</div>
              </td>
              <td>
                <StatusBadge status={app.status} />
              </td>
              <td style={{ textAlign: 'right' }}>
                {app.status === 'pending' && (
                  <div className="actions-row">
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'confirmed', app.phone_number, app.last_donation_date); }} className="btn-action confirm" title="Confirm">
                      Confirm
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'cancelled', app.phone_number, app.last_donation_date); }} className="btn-action cancel" title="Cancel">
                      Cancel
                    </button>
                  </div>
                )}
                {app.status !== 'pending' && <span className="text-secondary">-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BloodDonationsTable;
