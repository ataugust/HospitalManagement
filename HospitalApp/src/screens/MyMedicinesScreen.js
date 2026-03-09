import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { scheduleMedicineReminders, sendTestNotification } from '../services/NotificationService';

export default function MyMedicinesScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
  }, []);

  async function fetchMedicines() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedicines(data || []);
      
      // Schedule local notifications based on dosage
      scheduleMedicineReminders(data || []);
    } catch (e) {
      console.error("Error fetching medicines:", e);
    } finally {
      setLoading(false);
    }
  }

  const getDosageColor = () => {
    return '#fef3c7'; // amber-100 default for dosage
  };

  const getDosageTextColor = () => {
    return '#d97706'; // amber-600 default for dosage
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Prescriptions</Text>
        <Text style={styles.subtitle}>Your assigned daily medicines</Text>
      </View>

      <TouchableOpacity 
        style={{ backgroundColor: '#10b981', padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center' }} 
        onPress={async () => {
          if (medicines.length === 0) {
            alert("Assign a medicine to this patient first to test!");
            return;
          }
          await sendTestNotification(medicines[0]);
          alert("Test Notification scheduled! Please close or minimize the app to see it in 5 seconds.");
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Test Actionable Notification (5s)</Text>
      </TouchableOpacity>

      {medicines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>You have no assigned medicines yet.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {medicines.map((med, idx) => (
            <View key={med.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.medicineName}>💊 {med.name}</Text>
                <View style={[styles.badge, { backgroundColor: getDosageColor() }]}>
                  <Text style={[styles.badgeText, { color: getDosageTextColor() }]}>
                    {med.dosage}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionLabel}>Instructions:</Text>
                  <Text style={styles.instructionValue}>{med.instructions}</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionLabel}>Prescribed on:</Text>
                  <Text style={styles.instructionValue}>
                    {new Date(med.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 40, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  
  emptyState: { 
    backgroundColor: 'white', 
    padding: 30, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
  },
  emptyStateText: { fontSize: 16, color: '#888' },

  listContainer: { paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  medicineName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  cardBody: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 8 },
  instructionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  instructionLabel: { color: '#6b7280', fontSize: 14 },
  instructionValue: { color: '#111827', fontSize: 14, fontWeight: '600' },

  backButton: { 
    marginTop: 10, 
    marginBottom: 40,
    padding: 15, 
    backgroundColor: '#cbd5e1', 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  backButtonText: { color: '#334155', fontWeight: 'bold', fontSize: 16 }
});
