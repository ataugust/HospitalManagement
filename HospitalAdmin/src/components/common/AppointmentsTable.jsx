import React from 'react';
import { Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const AppointmentsTable = ({ data, updateStatus, showDoctor, showPatient, hideDate }) => {
  return (
    <div className="table-responsive">
      <table cellSpacing="0">
        <thead>
          <tr>
            {showPatient && <th style={{ width: '25%' }}>Patient</th>}
            {showDoctor && <th style={{ width: '25%' }}>Doctor</th>}
            {!hideDate && <th>Date & Time</th>}
            <th>Token</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(app => (
            <tr key={app.id}>
              {showPatient && (
                <td>
                  <div className="cell-primary">{app.patients?.name || 'Unknown'}</div>
                  <div className="cell-secondary">{app.patients?.phone}</div>
                </td>
              )}
              {showDoctor && (
                <td>
                  <div className="cell-primary"> {app.doctors?.name || 'Unknown'}</div>
                  <div className="cell-secondary">{app.doctors?.department}</div>
                </td>
              )}
              {!hideDate && (
                <td>
                  <div className="cell-primary">{app.appointment_date}</div>
                </td>
              )}
              <td>
                <span className="token-badge">#{app.token_number}</span>
              </td>
              <td>
                <StatusBadge status={app.status} />
              </td>
              <td style={{ textAlign: 'right' }}>
                {app.status === 'pending' && (
                  <div className="actions-row">
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'confirmed'); }} className="btn-action confirm" title="Confirm">
                      Confirm
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'cancelled'); }} className="btn-action cancel" title="Cancel">
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

export const GroupedAppointments = ({ groups, updateStatus, type }) => {
  const dates = Object.keys(groups).sort();

  if (dates.length === 0) return <div className="empty-state">No appointments found.</div>;

  return (
    <div className="timeline">
      {dates.map(date => (
        <div key={date} className="timeline-group">
          <div className="timeline-date">
            <Calendar size={16} />
            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <AppointmentsTable
            data={groups[date]}
            updateStatus={updateStatus}
            showDoctor={type !== 'doctor'}
            showPatient={type !== 'patient'}
            hideDate={true}
          />
        </div>
      ))}
    </div>
  );
};
