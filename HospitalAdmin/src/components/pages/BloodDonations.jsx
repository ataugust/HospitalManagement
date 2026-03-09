import React from 'react';
import { Clock, CheckCircle, CalendarCheck } from 'lucide-react';
import BloodDonationsTable from '../common/BloodDonationsTable';

const BloodDonations = ({ bloodDonations, updateBloodDonationStatus, fetchData }) => {
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
};

export default BloodDonations;
