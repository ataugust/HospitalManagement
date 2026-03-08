import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function BloodDonationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [ineligibilityReason, setIneligibilityReason] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setPatient(data);
      checkEligibility(data);
      fetchDonationHistory(data.phone);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDonationHistory(phone) {
    try {
      const { data, error } = await supabase
        .from('blood_donations')
        .select('*')
        .eq('phone_number', phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonationHistory(data || []);
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  }

  function checkEligibility(data) {
    if (!data.weight || data.weight < 50) {
      setIsEligible(false);
      setIneligibilityReason("Your weight is below the required 50kg for blood donation.");
      return;
    }

    if (data.last_donation_date) {
      const lastDonation = new Date(data.last_donation_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (lastDonation > threeMonthsAgo) {
        setIsEligible(false);
        setIneligibilityReason("You have donated blood within the last 3 months. Please wait until 3 months have passed.");
        return;
      }
    }

    setIsEligible(true);
    setIneligibilityReason("");
  }

  function generateDates() {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);

      const dateString = nextDate.toISOString().split('T')[0];

      let label;
      if (i === 0) label = "Today";
      else if (i === 1) label = "Tomorrow";
      else {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        label = nextDate.toLocaleDateString('en-GB', options);
      }
      dates.push({ dateString, label });
    }
    return dates;
  }

  function handleBookPress() {
    if (!isEligible) {
      Alert.alert("Not Eligible", ineligibilityReason);
      return;
    }
    const dates = generateDates();
    setUpcomingDates(dates);
    setSelectedDate(dates[0].dateString);
    setModalVisible(true);
  }

  async function confirmBooking() {
    if (!selectedDate || !patient) return;
    try {
      setLoading(true);
      setModalVisible(false);

      const { error } = await supabase.from('blood_donations').insert([{
        donor_name: patient.name,
        phone_number: patient.phone,
        blood_group: patient.blood_group,
        last_donation_date: selectedDate,
        status: 'pending'
      }]);

      if (error) throw error;

      Alert.alert("Success", "Blood donation appointment requested! Admin will review your request.");
      fetchDonationHistory(patient.phone); // Refresh history
      navigation.goBack();
    } catch (e) {
      Alert.alert("Booking Failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Blood Donation</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#d32f2f" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ padding: 20 }}>
          <View style={styles.infoCard}>
            <Ionicons name="water" size={40} color="#d32f2f" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.title}>Donate Blood, Save Lives</Text>
            <Text style={styles.subtitle}>Your details:</Text>
            <Text style={styles.detailText}>Blood Group: {patient?.blood_group || 'N/A'}</Text>
            <Text style={styles.detailText}>Weight: {patient?.weight ? patient.weight + ' kg' : 'Not specified'}</Text>
            <Text style={styles.detailText}>Last Donation: {patient?.last_donation_date ? new Date(patient.last_donation_date).toDateString() : 'Never'}</Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Eligibility Status</Text>
            {isEligible ? (
              <View style={styles.eligibleBox}>
                <Ionicons name="checkmark-circle" size={24} color="green" />
                <Text style={styles.eligibleText}>You are eligible to donate blood!</Text>
              </View>
            ) : (
              <View style={styles.notEligibleBox}>
                <Ionicons name="close-circle" size={24} color="#d32f2f" style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.notEligibleText}>{ineligibilityReason}</Text>
                {(!patient?.weight) && (
                  <Text style={{ color: '#d32f2f', marginTop: 10, fontSize: 12, textAlign: 'center' }}>Please update your profile with weight to be considered. Registration is required to capture weight if you are a new user.</Text>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, !isEligible && { backgroundColor: '#ccc' }]}
            onPress={handleBookPress}
            disabled={!isEligible}
          >
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          </TouchableOpacity>

          {donationHistory.length > 0 && (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Donation History</Text>
              {donationHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyDate}>{new Date(item.last_donation_date).toDateString()}</Text>
                    <Text style={styles.historyReqDate}>Requested on: {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={[styles.statusText, styles[`statusText_${item.status}`]]}>
                      {item.status ? item.status.toUpperCase() : 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <Text style={styles.modalSubtitle}>for Blood Donation</Text>

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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40, paddingHorizontal: 20, marginBottom: 10 },
  backBtn: { marginRight: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  infoCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#d32f2f', marginBottom: 15 },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  detailText: { fontSize: 14, color: '#555', marginBottom: 5 },
  statusCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  eligibleBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 15, borderRadius: 8 },
  eligibleText: { color: 'green', marginLeft: 10, fontSize: 16, fontWeight: '600', flex: 1 },
  notEligibleBox: { backgroundColor: '#ffebee', padding: 15, borderRadius: 8, alignItems: 'center' },
  notEligibleText: { color: '#d32f2f', fontSize: 14, fontWeight: '600', marginTop: 5, textAlign: 'center' },
  bookBtn: { backgroundColor: '#d32f2f', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  bookBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  historyCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 40, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  historyDate: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  historyReqDate: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  status_pending: { backgroundColor: '#fff7ed' },
  statusText_pending: { color: '#c2410c', fontSize: 12, fontWeight: 'bold' },
  status_confirmed: { backgroundColor: '#f0fdf4' },
  statusText_confirmed: { color: '#15803d', fontSize: 12, fontWeight: 'bold' },
  status_cancelled: { backgroundColor: '#fef2f2' },
  statusText_cancelled: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  dateScroll: { maxHeight: 60, marginBottom: 20 },
  dateCard: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 10, marginRight: 10, justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateCardActive: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  dateText: { color: '#333', fontWeight: '600' },
  dateTextActive: { color: 'white' },
  confirmBtn: { backgroundColor: '#d32f2f', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: '#666', fontSize: 14 }
});
