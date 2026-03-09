import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Patients from './components/pages/Patients';
import Doctors from './components/pages/Doctors';
import BloodDonations from './components/pages/BloodDonations';
import Prescriptions from './components/pages/Prescriptions';
import ComplianceLogs from './components/pages/ComplianceLogs';
import PatientDetails from './components/pages/PatientDetails';
import DoctorDetails from './components/pages/DoctorDetails';
import Sidebar from './components/layout/Sidebar';
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
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [prescriptionForm, setPrescriptionForm] = useState({ phone: '', name: '', dosage: '1-0-1', instructions: 'After Food', patient_id: null, patient_name: '' });

  // Drill-down states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPrescriptionPhone, setSelectedPrescriptionPhone] = useState(null);
  const [selectedPatientForMeds, setSelectedPatientForMeds] = useState(null);

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

      // Fetch Medicines
      const { data: medData, error: medError } = await supabase.from('medicines').select('*');
      if (medError) console.error("Med Error:", medError);

      // Fetch Medication Logs
      const { data: logData, error: logError } = await supabase.from('medication_logs').select('*');
      if (logError) console.error("Log Error:", logError);

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

      let fullPrescriptions = (medData || []).map(m => {
        const pat = (patData || []).find(p => p.id == m.patient_id);
        return { ...m, patients: pat || { name: 'Unknown', phone: 'N/A' } };
      });
      setPrescriptions(fullPrescriptions);

      let fullLogs = (logData || []).map(l => {
        const med = (medData || []).find(m => m.id == l.medicine_id);
        const pat = (patData || []).find(p => p.id == l.patient_id);
        return { ...l, medicines: med || { name: 'Unknown' }, patients: pat || { name: 'Unknown', phone: 'N/A' } };
      });
      fullLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMedicationLogs(fullLogs);

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

  async function searchPatientByPhone() {
    if (!prescriptionForm.phone) return alert("Enter phone number");
    const pat = patients.find(p => p.phone === prescriptionForm.phone);
    if (pat) {
      setPrescriptionForm({ ...prescriptionForm, patient_id: pat.id, patient_name: pat.name });
    } else {
      alert("Patient not found!");
      setPrescriptionForm({ ...prescriptionForm, patient_id: null, patient_name: '' });
    }
  }

  async function assignMedicine(e) {
    e.preventDefault();
    if (!prescriptionForm.patient_id || !prescriptionForm.name || !prescriptionForm.dosage) return alert("Missing fields");
    const { error } = await supabase.from('medicines').insert([{
      patient_id: prescriptionForm.patient_id,
      name: prescriptionForm.name,
      dosage: prescriptionForm.dosage,
      instructions: prescriptionForm.instructions
    }]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Medicine Assigned!");
      setPrescriptionForm({ ...prescriptionForm, name: '' });
      fetchData();
    }
  }

  async function cancelMedicine(id) {
    if (!window.confirm("Are you sure you want to cancel (remove) this medicine?")) return;
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchData(); // Refresh UI
    }
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
      <Login
        loginData={loginData}
        setLoginData={setLoginData}
        handleLogin={handleLogin}
      />
    );
  }

  const renderContent = () => {
    // 1. Patient Details View
    if (selectedPatient) {
      return (
        <PatientDetails
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          patientApps={getPatientAppointments(selectedPatient.id)}
          groupAppointmentsByDate={groupAppointmentsByDate}
          updateStatus={updateStatus}
        />
      );
    }

    // 2. Doctor Details View
    if (selectedDoctor) {
      return (
        <DoctorDetails
          selectedDoctor={selectedDoctor}
          setSelectedDoctor={setSelectedDoctor}
          doctorApps={getDoctorAppointments(selectedDoctor.id)}
          groupAppointmentsByDate={groupAppointmentsByDate}
          updateStatus={updateStatus}
        />
      );
    }

    // 3. Main Tabs
    switch (activeTab) {
      case 'appointments':
        return (
          <Dashboard
            appointments={appointments}
            updateStatus={updateStatus}
            fetchData={fetchData}
          />
        );
      case 'patients':
        return (
          <Patients
            patients={patients}
            setSelectedPatient={setSelectedPatient}
          />
        );
      case 'doctors':
        return (
          <Doctors
            doctors={doctors}
            setSelectedDoctor={setSelectedDoctor}
          />
        );
      case 'blood_donations':
        return (
          <BloodDonations
            bloodDonations={bloodDonations}
            updateBloodDonationStatus={updateBloodDonationStatus}
            fetchData={fetchData}
          />
        );
      case 'prescriptions':
        return (
          <Prescriptions
            fetchData={fetchData}
            prescriptionForm={prescriptionForm}
            setPrescriptionForm={setPrescriptionForm}
            searchPatientByPhone={searchPatientByPhone}
            assignMedicine={assignMedicine}
            patients={patients}
            prescriptions={prescriptions}
            selectedPatientForMeds={selectedPatientForMeds}
            setSelectedPatientForMeds={setSelectedPatientForMeds}
            cancelMedicine={cancelMedicine}
          />
        );
      case 'medication_logs':
        return (
          <ComplianceLogs
            medicationLogs={medicationLogs}
            fetchData={fetchData}
            patients={patients}
            setSelectedPatientForMeds={setSelectedPatientForMeds}
            setActiveTab={setActiveTab}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedPatient={setSelectedPatient}
        setSelectedDoctor={setSelectedDoctor}
        setSelectedPatientForMeds={setSelectedPatientForMeds}
        setIsAuthenticated={setIsAuthenticated}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
