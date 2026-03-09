import React from 'react';
import { ArrowLeft, Users, Phone } from 'lucide-react';
import { GroupedAppointments } from '../common/AppointmentsTable';

const PatientDetails = ({ selectedPatient, setSelectedPatient, patientApps, groupAppointmentsByDate, updateStatus }) => {
  const groupedApps = groupAppointmentsByDate(patientApps);

  return (
    <div className="details-view animate-fade-in">
      <button className="back-btn" onClick={() => setSelectedPatient(null)}>
        <ArrowLeft size={18} /> Back to Patients
      </button>

      <div className="profile-header">
        <div className="profile-avatar patient">
          <Users size={32} />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{selectedPatient.name}</h2>
          <p className="profile-meta">
            <Phone size={14} /> {selectedPatient.phone}
            <span className="dot">•</span>
            {selectedPatient.age} Years, {selectedPatient.gender}
            <span className="dot">•</span>
            {selectedPatient.blood_group || 'N/A'}
          </p>
          <p className="profile-address">{selectedPatient.address}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Visits</h3>
          <p>{patientApps.length}</p>
        </div>
      </div>

      <div className="section-title">Appointment History</div>
      <GroupedAppointments
        groups={groupedApps}
        updateStatus={updateStatus}
        type="patient"
      />
    </div>
  );
};

export default PatientDetails;
