import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function MyAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  async function fetchMyAppointments() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Appointments (Raw)
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true });

      if (appError) throw appError;

      // 2. Fetch Doctors (Raw)
      // We fetch all doctors to map them. (Pagination could be added later if needed)
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('*');

      if (docError) console.log("Doctor fetch error (non-fatal):", docError);

      // 3. Client-Side Join
      const joinedData = appData.map(app => {
        // Loose equality (==) to handle string vs int ID mismatch
        const doc = (docData || []).find(d => d.id == app.doctor_id);

        return {
          ...app,
          doctors: doc ? {
            name: doc.name,
            image_url: doc.image_url,
            // Adapt to UI expectation: UI expects item.doctors.departments.name 
            // OR item.doctors.departments check. 
            // Admin App says 'department' is a column. User App expects 'departments' relation.
            // We'll normalize it here.
            departments: { name: doc.department || 'General' },
            department: doc.department // Fallback
          } : {
            name: 'Unknown Doctor',
            departments: { name: 'Unknown' }
          }
        };
      });

      setAppointments(joinedData);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }

  // --- CANCEL LOGIC ---
  function handleCancel(id) {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: 'destructive',
          onPress: async () => {
            try {
              // We update the status instead of deleting, so the user can see history.
              // If you prefer deleting: .delete().eq('id', id)
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

              if (error) throw error;

              // Refresh local state
              setAppointments(prev =>
                prev.map(app => app.id === id ? { ...app, status: 'cancelled' } : app)
              );

            } catch (err) {
              Alert.alert("Error", "Could not cancel appointment.");
            }
          }
        }
      ]
    );
  }

  const getReportingTime = (token) => {
    const start = new Date();
    start.setHours(9, 0, 0);
    const time = new Date(start.getTime() + (token - 1) * 20 * 60000);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isCancelled = item.status === 'cancelled';

    // Status Badge Color
    let badgeColor = '#FFF9C4'; // Default (Pending) - Yellow
    let textColor = '#FBC02D';

    if (item.status === 'confirmed') {
      badgeColor = '#C8E6C9'; // Green
      textColor = '#388E3C';
    } else if (isCancelled) {
      badgeColor = '#FFCDD2'; // Red
      textColor = '#D32F2f';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.doctors?.image_url }} style={styles.img} />
          <View style={styles.info}>
            <Text style={styles.docName}>{item.doctors?.name || "Unknown Doctor"}</Text>
            <Text style={styles.dept}>{item.doctors?.departments?.name || "Specialist"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.statusText, { color: textColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>DATE</Text>
            <Text style={styles.detailValue}>{new Date(item.appointment_date).toDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>TIME</Text>
            <Text style={styles.detailValue}>{getReportingTime(item.token_number)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>TOKEN</Text>
            <Text style={styles.detailValue}>#{item.token_number}</Text>
          </View>
        </View>

        {isPending && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Sort appointments: Confirmed > Pending > Cancelled
  const sortedAppointments = [...appointments].sort((a, b) => {
    const statusOrder = { confirmed: 1, pending: 2, cancelled: 3 };
    const priorityA = statusOrder[a.status] || 99;
    const priorityB = statusOrder[b.status] || 99;

    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(a.appointment_date) - new Date(b.appointment_date);
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={sortedAppointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No appointments found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  img: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 15 },
  docName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dept: { color: '#666', fontSize: 13 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { fontSize: 10, color: '#888', marginBottom: 4, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  cancelBtn: { marginTop: 5, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEE', borderRadius: 8, backgroundColor: '#FFEBEE' },
  cancelBtnText: { color: '#D32F2F', fontWeight: '600', fontSize: 12 },

  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 }
});