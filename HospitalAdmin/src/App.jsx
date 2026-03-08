import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  LayoutDashboard, Users, Stethoscope, CalendarCheck,
  CheckCircle, XCircle, Phone, ArrowLeft,
  Clock, Calendar, ChevronRight, Lock, Droplet
} from 'lucide-react';
import './App.css';

export default function App() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [bloodDonations, setBloodDonations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Drill-down states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [activeTab, isAuthenticated]);

  async function fetchData() {
    try {
      // STRATEGY: Fetch tables INDEPENDENTLY and join in JS.
      // This is a "failsafe" to ensure data appears even if Foreign Keys are missing in DB.

      // 1. Fetch Appointments
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*') // No joins here, just raw IDs
        .order('appointment_date', { ascending: true })
        .order('token_number', { ascending: true });

      if (appError) console.error("App Error:", appError);

      // 2. Fetch Doctors
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('*');

      if (docError) console.error("Doc Error:", docError);

      // 3. Fetch Patients
      const { data: patData, error: patError } = await supabase
        .from('patients')
        .select('*');

      if (patError) console.error("Pat Error:", patError);

      // Fetch Blood Donations
      const { data: bloodData, error: bloodError } = await supabase
        .from('blood_donations')
        .select('*');

      if (bloodError) console.error("Blood Error:", bloodError);

      // 4. Client-Side Join
      let fullAppointments = (appData || []).map(app => {
        const doc = (docData || []).find(d => d.id == app.doctor_id);
        const pat = (patData || []).find(p => p.id == app.patient_id);

        return {
          ...app,
          doctors: doc || { name: 'Unknown Doctor', department: 'N/A' },
          patients: pat || { name: 'Unknown Patient', phone: 'N/A' }
        };
      });

      // SORT: Pending first, then Date, then Token
      fullAppointments.sort((a, b) => {
        // 1. Status: Pending comes first
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        // 2. Date: Ascending
        if (a.appointment_date < b.appointment_date) return -1;
        if (a.appointment_date > b.appointment_date) return 1;

        // 3. Token: Ascending
        return a.token_number - b.token_number;
      });

      setAppointments(fullAppointments);
      setDoctors(docData || []);
      setPatients(patData || []);

      let fullBloodDonations = bloodData || [];
      fullBloodDonations.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        if (a.last_donation_date < b.last_donation_date) return -1;
        if (a.last_donation_date > b.last_donation_date) return 1;
        return 0;
      });
      setBloodDonations(fullBloodDonations);

    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }

  // --- 2. ACTIONS ---
  async function updateStatus(id, newStatus) {
    // REMOVED CONFIRMATION DIALOG as requested
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    fetchData(); // Refresh UI
  }

  async function updateBloodDonationStatus(id, newStatus, phoneNumber, donationDate) {
    if (newStatus === 'confirmed') {
      // We look up the patient by phone_number to update their record
      await supabase.from('patients')
        .update({ last_donation_date: donationDate })
        .eq('phone', phoneNumber);
    }
    await supabase.from('blood_donations').update({ status: newStatus }).eq('id', id);
    fetchData();
  }

  // --- 3. LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === 'admin1' && loginData.password === 'admin1@123') {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials!");
    }
  };

  // --- HELPERS ---
  const getPatientAppointments = (patientId) => appointments.filter(a => a.patient_id == patientId);
  const getDoctorAppointments = (doctorId) => appointments.filter(a => a.doctor_id == doctorId);

  // Helper to Group Appointments by Date
  const groupAppointmentsByDate = (apps) => {
    const groups = {};
    apps.forEach(app => {
      const date = app.appointment_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(app);
    });
    return groups;
  };

  // --- RENDER CONTENT ---

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon-lg">
              <LayoutDashboard size={32} color="white" />
            </div>
            <h1>MediCare Admin</h1>
            <p>Secure Hospital Management System</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="btn-login">
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Patient Details View
    if (selectedPatient) {
      const patientApps = getPatientAppointments(selectedPatient.id);
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
            type="patient" // Hides Patient col, shows Doctor col
          />
        </div>
      );
    }

    // 2. Doctor Details View
    if (selectedDoctor) {
      const doctorApps = getDoctorAppointments(selectedDoctor.id);
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
            type="doctor" // Hides Doctor col, shows Patient col
          />
        </div>
      );
    }

    // 3. Main Tabs
    switch (activeTab) {
      case 'appointments':
        return (
          <>
            <div className="header">
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Overview of hospital activity</p>
              </div>
              <button className="btn-icon refresh" onClick={fetchData} title="Refresh Data">
                <Clock size={20} />
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon yellow"><Clock size={24} /></div>
                <div>
                  <h3>Pending</h3>
                  <p>{appointments.filter(a => a.status === 'pending').length}</p>
                </div>
              </div>
              <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div>
                <div><h3>Confirmed</h3><p>{appointments.filter(a => a.status === 'confirmed').length}</p></div>
              </div>
              <div className="stat-card blue"><div className="stat-icon blue"><CalendarCheck size={24} /></div>
                <div><h3>Total</h3><p>{appointments.length}</p></div>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: '2rem' }}>Recent Appointments</div>
            <div className="table-container">
              <AppointmentsTable
                data={appointments}
                updateStatus={updateStatus}
                showDoctor={true}
                showPatient={true}
              />
            </div>
          </>
        );

      case 'patients':
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

      case 'doctors':
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

      case 'blood_donations':
        return (
          <>
            <div className="header">
              <div>
                <h1 className="page-title">Blood Donations</h1>
                <p className="page-subtitle">Manage blood donation requests</p>
              </div>
              <button className="btn-icon refresh" onClick={fetchData} title="Refresh Data">
                <Clock size={20} />
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon yellow"><Clock size={24} /></div>
                <div>
                  <h3>Pending</h3>
                  <p>{bloodDonations.filter(a => a.status === 'pending').length}</p>
                </div>
              </div>
              <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div>
                <div><h3>Confirmed</h3><p>{bloodDonations.filter(a => a.status === 'confirmed').length}</p></div>
              </div>
              <div className="stat-card blue"><div className="stat-icon blue"><CalendarCheck size={24} /></div>
                <div><h3>Total Requests</h3><p>{bloodDonations.length}</p></div>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: '2rem' }}>Donation Requests</div>
            <div className="table-container">
              <BloodDonationsTable
                data={bloodDonations}
                updateStatus={updateBloodDonationStatus}
              />
            </div>
          </>
        );

      default: return null;
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
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
            active={activeTab === 'appointments' && !selectedPatient && !selectedDoctor}
            onClick={() => { setActiveTab('appointments'); setSelectedPatient(null); setSelectedDoctor(null); }}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Patients"
            active={activeTab === 'patients' || selectedPatient}
            onClick={() => { setActiveTab('patients'); setSelectedPatient(null); setSelectedDoctor(null); }}
          />
          <SidebarItem
            icon={<Stethoscope size={20} />}
            label="Doctors"
            active={activeTab === 'doctors' || selectedDoctor}
            onClick={() => { setActiveTab('doctors'); setSelectedPatient(null); setSelectedDoctor(null); }}
          />
          <SidebarItem
            icon={<Droplet size={20} />}
            label="Blood Donations"
            active={activeTab === 'blood_donations'}
            onClick={() => { setActiveTab('blood_donations'); setSelectedPatient(null); setSelectedDoctor(null); }}
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

      {/* MAIN CONTENT */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`nav-item ${active ? 'active' : ''}`}>
    {icon} <span>{label}</span>
  </button>
);

// Component to render Date-Grouped lists
const GroupedAppointments = ({ groups, updateStatus, type }) => {
  const dates = Object.keys(groups).sort(); // Sort dates string wise works for YYYY-MM-DD

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
            hideDate={true} // Don't show Data col inside the group
          />
        </div>
      ))}
    </div>
  );
};

const AppointmentsTable = ({ data, updateStatus, showDoctor, showPatient, hideDate }) => {
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
                  <div className="cell-primary">Dr. {app.doctors?.name || 'Unknown'}</div>
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