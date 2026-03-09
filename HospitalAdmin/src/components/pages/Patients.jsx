import React from 'react';
import { ChevronRight } from 'lucide-react';

const Patients = ({ patients, setSelectedPatient }) => {
  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient records</p>
        </div>
      </div>
      <div className="grid">
        {patients.map(p => (
          <div key={p.id} className="card hover-card" onClick={() => setSelectedPatient(p)}>
            <div className="card-header">
              <div className="avatar-circle patient">{p.name.charAt(0)}</div>
              <div>
                <h3>{p.name}</h3>
                <p className="text-secondary">{p.phone}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Age/Sex:</span>
                <span className="value">{p.age} / {p.gender}</span>
              </div>
              <div className="info-row">
                <span className="label">Location:</span>
                <span className="value truncate">{p.address}</span>
              </div>
            </div>
            <div className="card-footer">
              <span>View History</span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Patients;
