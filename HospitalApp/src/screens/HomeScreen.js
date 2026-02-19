import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [name, setName] = useState("Patient");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('patients')
          .select('name')
          .eq('id', user.id)
          .single();

        if (data?.name) {
          setName(data.name.split(' ')[0]);
        }
      }
    } catch (e) {
      console.log("Error fetching profile:", e);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {name} 👋</Text>
        <Text style={styles.subtitle}>Welcome to Marsleeva Hospital</Text>
      </View>

      {/* Main Features Grid */}
      <View style={styles.grid}>

        {/* Feature 1: Appointments */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Booking')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.icon}>📅</Text>
          </View>
          <Text style={styles.cardTitle}>Book Appointment</Text>
          <Text style={styles.cardSub}>Find a doctor</Text>
        </TouchableOpacity>

        {/* Feature 2: Medicines */}
        <TouchableOpacity style={styles.card} onPress={() => alert("Medicine Screen coming soon!")}>
          <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.icon}>💊</Text>
          </View>
          <Text style={styles.cardTitle}>My Medicines</Text>
          <Text style={styles.cardSub}>Reminders & Logs</Text>
        </TouchableOpacity>

        {/* Feature 3: Blood Donation */}
        <TouchableOpacity style={styles.card} onPress={() => alert("Blood Donation Screen coming soon!")}>
          <View style={[styles.iconBg, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.icon}>🩸</Text>
          </View>
          <Text style={styles.cardTitle}>Donate Blood</Text>
          <Text style={styles.cardSub}>Save a life today</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MyAppointments')}>
          <View style={[styles.iconBg, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.icon}>📝</Text>
          </View>
          <Text style={styles.cardTitle}>My Appointments</Text>
          <Text style={styles.cardSub}>View my Bookings </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => alert("Lab Results coming soon!")}>
          <View style={[styles.iconBg, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.icon}>🔬</Text>
          </View>
          <Text style={styles.cardTitle}>Lab Results</Text>
          <Text style={styles.cardSub}>View your reports</Text>
        </TouchableOpacity>

      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  header: { marginTop: 40, marginBottom: 30 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  iconBg: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 24 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 4 },
  logoutButton: { marginTop: 20, padding: 15, backgroundColor: '#ffebee', borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#d32f2f', fontWeight: 'bold' }
});