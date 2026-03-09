import React from 'react';
import { Clock, CheckCircle, CalendarCheck } from 'lucide-react';
import { AppointmentsTable } from '../common/AppointmentsTable';

const Dashboard = ({ appointments, updateStatus, fetchData }) => {
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
};

export default Dashboard;
