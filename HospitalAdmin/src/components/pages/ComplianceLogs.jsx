import React from 'react';
import { Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const ComplianceLogs = ({ medicationLogs, fetchData, patients, setSelectedPatientForMeds, setActiveTab }) => {
  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Compliance Logs</h1>
          <p className="page-subtitle">Track patient medication adherence</p>
        </div>
        <button className="btn-icon refresh" onClick={fetchData} title="Refresh Data">
          <Clock size={20} />
        </button>
      </div>

      <div className="table-card" style={{ marginTop: '2rem', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div className="table-responsive">
          <table cellSpacing="0" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Date / Time</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Patient</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Medicine</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicationLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div className="cell-primary">{log.date_logged}</div>
                    <div className="cell-secondary" style={{ fontSize: '11px' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div className="cell-primary">{log.patients?.name}</div>
                    <div
                      className="cell-secondary"
                      style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                      onClick={() => {
                        const patient = patients.find(p => p.phone === log.patients?.phone);
                        setSelectedPatientForMeds(patient || null);
                        setActiveTab('prescriptions');
                      }}
                      title="Click to view assigned medicines for this patient"
                    >
                      {log.patients?.phone}
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div className="cell-primary">{log.medicines?.name}</div>
                    <div className="cell-secondary">{log.medicines?.dosage} ({log.medicines?.instructions})</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><StatusBadge status={log.status === 'Taken' ? 'confirmed' : 'cancelled'} /></td>
                </tr>
              ))}
              {medicationLogs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No logs yet. Mobile app actions will appear here.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ComplianceLogs;
