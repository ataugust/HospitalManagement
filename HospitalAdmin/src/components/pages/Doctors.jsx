import React from 'react';
import { ChevronRight } from 'lucide-react';

const Doctors = ({ doctors, setSelectedDoctor }) => {
  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Medical Staff</h1>
          <p className="page-subtitle">Doctors and assignments</p>
        </div>
      </div>
      <div className="grid">
        {doctors.map(d => (
          <div key={d.id} className="card hover-card" onClick={() => setSelectedDoctor(d)}>
            <div className="card-header">
              <div className="avatar-circle doctor">{d.name.charAt(0)}</div>
              <div>
                <h3>Dr. {d.name}</h3>
                <p className="text-primary">{d.department}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Experience:</span>
                <span className="value">{d.experience_years} Years</span>
              </div>
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{d.phone}</span>
              </div>
            </div>
            <div className="card-footer">
              <span>View Schedule</span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Doctors;
