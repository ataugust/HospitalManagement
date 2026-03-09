import React from 'react';
import { Clock, Search, ArrowLeft, ChevronRight } from 'lucide-react';

const Prescriptions = ({ 
  fetchData, 
  prescriptionForm, 
  setPrescriptionForm, 
  searchPatientByPhone, 
  assignMedicine, 
  patients, 
  prescriptions, 
  selectedPatientForMeds, 
  setSelectedPatientForMeds, 
  cancelMedicine 
}) => {
  return (
    <>
      <div className="header">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-subtitle">Assign medicines and track compliance</p>
        </div>
        <button className="btn-icon refresh" onClick={fetchData} title="Refresh Data">
          <Clock size={20} />
        </button>
      </div>

      <div className="prescription-layout" style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div className="form-card" style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3>Assign Medicine</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input type="text" placeholder="Patient Phone" value={prescriptionForm.phone} onChange={e => setPrescriptionForm({ ...prescriptionForm, phone: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <button onClick={searchPatientByPhone} style={{ padding: '10px 15px', backgroundColor: '#0f172a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}><Search size={16} /></button>
          </div>
          {prescriptionForm.patient_name && (
            <form onSubmit={assignMedicine}>
              <p style={{ color: 'green', marginBottom: '15px', fontWeight: 'bold' }}>Found: {prescriptionForm.patient_name}</p>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Medicine Name</label>
                <input type="text" value={prescriptionForm.name} onChange={e => setPrescriptionForm({ ...prescriptionForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Dosage (e.g. 1-0-1, 0-0-1)</label>
                <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} placeholder="1-0-1" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Instructions</label>
                <select value={prescriptionForm.instructions} onChange={e => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                  <option>Before Food</option>
                  <option>After Food</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Assign Medicine</button>
            </form>
          )}
        </div>

        <div className="table-card" style={{ flex: '2 1 500px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {selectedPatientForMeds ? (
            <>
              <button className="back-btn" onClick={() => setSelectedPatientForMeds(null)} style={{ marginBottom: '15px' }}>
                <ArrowLeft size={18} /> Back to Patients
              </button>
              <h3>Medicines for {selectedPatientForMeds.name}</h3>

              <div className="table-responsive">
                <table cellSpacing="0" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Medicine</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Dosage</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Assigned Date</th>
                      <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #eee' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.filter(p => String(p.patients?.id) === String(selectedPatientForMeds.id)).map(med => (
                      <tr key={med.id}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><div className="cell-primary">💊 {med.name}</div></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                          <div className="cell-primary">{med.dosage}</div>
                          <div className="cell-secondary">{med.instructions}</div>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{new Date(med.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                          <button
                            onClick={() => cancelMedicine(med.id)}
                            className="btn-action cancel"
                            title="Cancel Medicine"
                            style={{ padding: '6px 12px' }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                    {prescriptions.filter(p => String(p.patients?.id) === String(selectedPatientForMeds.id)).length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No medicines mapped to this patient.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <h3>Active Prescriptions</h3>
              <div className="table-responsive">
                <p style={{ color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>Select a patient below to view and manage their assigned medicines.</p>
                <table cellSpacing="0" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Patient Details</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' }}>Active Meds Count</th>
                      <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #eee' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => {
                      const medCount = prescriptions.filter(p => String(p.patients?.id) === String(patient.id)).length;
                      return (
                        <tr key={patient.id}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                            <div className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="avatar-circle patient" style={{ width: '30px', height: '30px', fontSize: '14px' }}>{patient.name.charAt(0)}</div>
                              <div>
                                {patient.name}
                                <div className="cell-secondary">{patient.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                            <div className="cell-primary">{medCount} Medicines</div>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                            <button
                              className="btn-action confirm"
                              onClick={() => setSelectedPatientForMeds(patient)}
                              style={{ padding: '6px 12px' }}
                            >
                              View Medicines <ChevronRight size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {patients.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No patients registered yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Prescriptions;
