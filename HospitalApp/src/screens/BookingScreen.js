import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


import { supabase } from '../../lib/supabase'; // Access our database connection

export default function BookingScreen({ navigation }) {
  // --- STATE (The "Memory" of the screen) ---
  const [departments, setDepartments] = useState([]); // Holds categories (Cardio, General, etc.)
  const [doctors, setDoctors] = useState([]);         // Holds the list of doctors
  const [loading, setLoading] = useState(true);       // Shows the spinner while data loads
  const [selectedDept, setSelectedDept] = useState(null); // Which filter is active?

  // --- MODAL STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [upcomingDates, setUpcomingDates] = useState([]);

  // --- EFFECT (The "Trigger" when screen loads) ---
  useEffect(() => {
    fetchData();
  }, []); // Empty array [] means "Run this only once when screen mounts"

  // --- LOGIC (The "Worker" function) ---
  async function fetchData() {
    try {
      setLoading(true);

      // 1. Get Departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*');

      // 2. Get Doctors (We join the 'departments' table to get the department name too)
      // specific syntax: select('*, departments(*)') means "Get all doctor columns AND their linked department columns"
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('*, departments(*)');

      if (deptError || docError) throw new Error(deptError?.message || docError?.message);

      setDepartments(deptData);
      setDoctors(docData);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    } finally {
      setLoading(false); // Stop the spinner regardless of success/failure
    }
  }

  // --- FILTER LOGIC (Runs when you click a category) ---
  const filteredDoctors = selectedDept
    ? doctors.filter(doc => doc.department_id === selectedDept) // If filter selected, show only those
    : doctors; // If no filter, show all

  // --- HELPER: Generate Next 5 Days (Today, Tomorrow + 3) ---
  function generateDates() {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);

      // Format: YYYY-MM-DD for DB
      const dateString = nextDate.toISOString().split('T')[0];

      let label;
      if (i === 0) {
        label = "Today";
      } else if (i === 1) {
        label = "Tomorrow";
      } else {
        // Format: "Mon, 12 Oct"
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        label = nextDate.toLocaleDateString('en-GB', options);
      }

      dates.push({ dateString, label });
    }
    return dates;
  }

  // --- HELPER: Calculates time based on token number (20 mins per patient) ---
  function calculateTime(token) {
    const start = new Date();
    start.setHours(9, 0, 0); // Doctor starts at 9:00 AM
    const appointmentTime = new Date(start.getTime() + (token - 1) * 20 * 60000);
    return appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- STEP 1: OPEN MODAL ---
  function handleBookPress(doctor) {
    setSelectedDoctor(doctor);
    const dates = generateDates();
    setUpcomingDates(dates);
    setSelectedDate(dates[0].dateString); // Default to today
    setModalVisible(true);
  }

  // --- STEP 2: CONFIRM BOOKING ---
  async function confirmBooking() {
    if (!selectedDoctor || !selectedDate) return;

    try {
      setLoading(true);
      setModalVisible(false);

      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to book.");

      // 2. CALL DATABASE FUNCTION (RPC)
      // This handles: Duplicate Check, Token Generation, House Full Check, and Insert safely on the server.
      const { data, error } = await supabase.rpc('book_appointment', {
        p_patient_id: user.id,
        p_doctor_id: selectedDoctor.id,
        p_date: selectedDate
      });

      if (error) throw error;

      // 3. Handle RPC Logic Responses
      if (data.error) {
        throw new Error(data.error);
      }

      // 4. Success
      if (data.success) {
        const reportTime = calculateTime(data.token);
        const niceDate = new Date(selectedDate).toDateString();

        Alert.alert(
          "Booking Successful!",
          `Date: ${niceDate}\nToken: ${data.token}\nTime: ${reportTime}\n\nPlease arrive 10 mins early.`
        );
      }

    } catch (error) {
      Alert.alert("Booking Failed", error.message);
    } finally {
      setLoading(false);
      setModalVisible(false);
      setSelectedDoctor(null);
      setSelectedDate(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Find a Doctor</Text>
      </View>

      {/* Loading Spinner */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Horizontal Department List */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
            {/* "All" Button */}
            <TouchableOpacity
              style={[styles.deptCard, selectedDept === null && styles.deptCardActive]}
              onPress={() => setSelectedDept(null)}
            >
              <Text style={[styles.deptText, selectedDept === null && styles.deptTextActive]}>All</Text>
            </TouchableOpacity>

            {/* Dynamic Department Buttons */}
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[styles.deptCard, selectedDept === dept.id && styles.deptCardActive]}
                onPress={() => setSelectedDept(dept.id)}
              >
                <Text style={[styles.deptText, selectedDept === dept.id && styles.deptTextActive]}>
                  {dept.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Vertical Doctors List */}
          <Text style={styles.sectionTitle}>Top Doctors</Text>
          {filteredDoctors.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.doctorCard}
              onPress={() => handleBookPress(doc)} // Opens Modal
            >
              <Image source={{ uri: doc.image_url }} style={styles.docImage} />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                {/* Notice how we access the joined department name: doc.departments.name */}
                <Text style={styles.docSpecialty}>{doc.departments?.name || "Specialist"}</Text>
                <Text style={styles.docExp}>{doc.experience_years} Years Exp • ₹{doc.consultation_fee}</Text>
              </View>
              <View style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* --- DATE SELECTION MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <Text style={styles.modalSubtitle}>for Dr. {selectedDoctor?.name}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {upcomingDates.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, selectedDate === item.dateString && styles.dateCardActive]}
                  onPress={() => setSelectedDate(item.dateString)}
                >
                  <Text style={[styles.dateText, selectedDate === item.dateString && styles.dateTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking}>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { marginRight: 15 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  deptScroll: { marginBottom: 25 },
  deptCard: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'white', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  deptCardActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  deptText: { color: '#666', fontWeight: '600' },
  deptTextActive: { color: 'white' },

  doctorCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  docImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee' },
  docInfo: { flex: 1, marginLeft: 15 },
  docName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  docSpecialty: { fontSize: 14, color: '#007AFF', marginVertical: 2 },
  docExp: { fontSize: 12, color: '#888' },
  bookBtn: { backgroundColor: '#e3f2fd', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  bookBtnText: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  dateScroll: { maxHeight: 60, marginBottom: 20 },
  dateCard: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 10, marginRight: 10, justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateCardActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  dateText: { color: '#333', fontWeight: '600' },
  dateTextActive: { color: 'white' },
  confirmBtn: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: '#666', fontSize: 14 }
});