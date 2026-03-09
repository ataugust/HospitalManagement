import React from 'react';
import { LayoutDashboard, Users, Stethoscope, Droplet, Pill, CheckCircle, Lock, CalendarCheck } from 'lucide-react';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`nav-item ${active ? 'active' : ''}`}>
    {icon} <span>{label}</span>
  </button>
);

const Sidebar = ({ activeTab, setActiveTab, setSelectedPatient, setSelectedDoctor, setSelectedPatientForMeds, setIsAuthenticated }) => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">
          <LayoutDashboard size={24} color="white" />
        </div>
        <span className="logo-text">MediCare<span style={{ fontWeight: 300 }}>Admin</span></span>
      </div>

      <nav className="nav-links">
        <SidebarItem
          icon={<CalendarCheck size={20} />}
          label="Dashboard"
          active={activeTab === 'appointments'}
          onClick={() => { setActiveTab('appointments'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <SidebarItem
          icon={<Users size={20} />}
          label="Patients"
          active={activeTab === 'patients'}
          onClick={() => { setActiveTab('patients'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <SidebarItem
          icon={<Stethoscope size={20} />}
          label="Doctors"
          active={activeTab === 'doctors'}
          onClick={() => { setActiveTab('doctors'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <SidebarItem
          icon={<Droplet size={20} />}
          label="Blood Donations"
          active={activeTab === 'blood_donations'}
          onClick={() => { setActiveTab('blood_donations'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <SidebarItem
          icon={<Pill size={20} />}
          label="Prescriptions"
          active={activeTab === 'prescriptions'}
          onClick={() => { setActiveTab('prescriptions'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <SidebarItem
          icon={<CheckCircle size={20} />}
          label="Compliance Logs"
          active={activeTab === 'medication_logs'}
          onClick={() => { setActiveTab('medication_logs'); setSelectedPatient(null); setSelectedDoctor(null); setSelectedPatientForMeds(null); }}
        />
        <div style={{ marginTop: 'auto' }}>
          <button className="nav-item" onClick={() => setIsAuthenticated(false)}>
            <Lock size={20} /> <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <p>© 2026 Hospital OS</p>
      </div>
    </aside>
  );
};

export default Sidebar;
