import React from 'react';
import { ArrowLeft, Stethoscope, Phone } from 'lucide-react';
import { GroupedAppointments } from '../common/AppointmentsTable';

const DoctorDetails = ({ selectedDoctor, setSelectedDoctor, doctorApps, groupAppointmentsByDate, updateStatus }) => {
  const groupedApps = groupAppointmentsByDate(doctorApps);

  return (
    <div className="details-view animate-fade-in">
      <button className="back-btn" onClick={() => setSelectedDoctor(null)}>
        <ArrowLeft size={18} /> Back to Doctors
      </button>

      <div className="profile-header">
        <div className="profile-avatar doctor">
          <Stethoscope size={32} />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">Dr. {selectedDoctor.name}</h2>
          <p className="profile-meta">
            {selectedDoctor.department} Specialist
            <span className="dot">•</span>
            {selectedDoctor.experience_years} Years Exp.
          </p>
          <p className="profile-meta">
            <Phone size={14} /> {selectedDoctor.phone}
          </p>
        </div>
        <div className="kpi-card">
          <h3>Appointments</h3>
          <p>{doctorApps.length}</p>
        </div>
      </div>

      <div className="section-title">Schedule & Appointments</div>
      <GroupedAppointments
        groups={groupedApps}
        updateStatus={updateStatus}
        type="doctor"
      />
    </div>
  );
};

export default DoctorDetails;
