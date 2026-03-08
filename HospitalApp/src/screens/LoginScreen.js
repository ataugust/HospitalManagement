import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login' or 'register'

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '', // We will use a text input for simplicity or a simple picker logic if needed, keeping text for now
    address: '',
    blood_group: '',
    height: '',
    weight: ''
  });

  // --- 1. CHECK PHONE NUMBER (LOGIN) ---
  async function checkUser() {
    if (!phoneNumber) return Alert.alert("Error", "Please enter a valid phone number");
    setLoading(true);

    try {
      // 1. Check if user exists in 'patients' table
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // USER EXISTS -> LOGIN MOCK
        // Since we are bypassing OTP, we just assume checking existence is enough for this demo.
        // Ideally, here we would sign them in with a password or OTP. 
        // For the mock, we will try to use the "Test Account" trick with a known password if possible, 
        // OR just simulate a session.
        // Let's try to sign in with a standard "demo pass" or just force a state update if app supports it.
        // However, standard Supabase Auth needs a real user in `auth.users`.
        // We will try to sign in with email = phone@hospital.com and password = hospital123 (our convention).

        const email = `${phoneNumber}@hospital.com`;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'hospital123'
        });

        if (signInError) {
          // If password fails, maybe they are an old user without this password convention.
          Alert.alert("Login Failed", "User exists but credential mismatch. (Demo: Ensure created via new flow)");
        }
        // Success handled by Supabase auth state listener in App.js
      } else {
        // USER NOT FOUND -> GO TO REGISTER
        Alert.alert("User Not Found", "Please register your details.");
        setFormData({ ...formData, phone: phoneNumber });
        setStep('register');
      }

    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- 2. REGISTER NEW USER ---
  async function handleRegister() {
    if (!formData.name || !formData.age || !formData.gender) {
      return Alert.alert("Error", "Please fill all required fields (Name, Age, Gender)");
    }
    setLoading(true);

    const email = `${formData.phone}@hospital.com`;
    const password = 'hospital123';

    try {
      let userId = null;

      // 1. Try to Create Auth User
      const { data: authData, error: authError } = await supabase.rpc('create_user', {
        email: email,
        password: password
      });

      if (!authError && authData) {
        userId = authData;
      } else {
        // If RPC failed (likely "User already exists"), try standard SignUp
        // IF that also fails, it means the EMAIL is taken.
        // In that case, we try to LOGIN (maybe they are a user but just missing from Patients table)

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered") || signUpError.message.includes("User already exists")) {
            console.log("User exists in Auth, trying to claim...");
            // User exists in Auth. Try to LOGIN to get the ID.
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email, password
            });

            if (signInError) {
              throw new Error("Account exists but password mismatch. Cannot claim.");
            }
            userId = signInData.user.id;
          } else {
            throw signUpError;
          }
        } else {
          if (signUpData.user) userId = signUpData.user.id;
        }
      }

      if (!userId) throw new Error("Failed to retrieve User ID.");

      // 2. Insert into 'patients' table
      const { error: dbError } = await supabase.from('patients').upsert([{
        id: userId,
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender,
        address: formData.address,
        blood_group: formData.blood_group,
        height: parseFloat(formData.height) || null,
        weight: parseFloat(formData.weight) || null
      }]);

      if (dbError) throw dbError;

      // 3. Ensure Session is Active (if we didn't just login)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      Alert.alert("Success", "Account created successfully!");

    } catch (err) {
      Alert.alert("Registration Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hospital Login</Text>

      {step === 'login' ? (
        <View style={styles.card}>
          <Text style={styles.label}>Enter Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity style={styles.buttonMain} onPress={checkUser} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Checking..." : "Continue"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ width: '100%' }}>
          <View style={styles.card}>
            <Text style={styles.subHeader}>Patient Registration</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />

            <Text style={styles.label}>Phone (Read-only)</Text>
            <TextInput style={[styles.input, { backgroundColor: '#f0f0f0' }]} value={formData.phone} editable={false} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={formData.age}
                  onChangeText={t => setFormData({ ...formData, age: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Gender *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="M/F/Other"
                  value={formData.gender}
                  onChangeText={t => setFormData({ ...formData, gender: t })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Blood Group</Text>
                <TextInput
                  style={styles.input}
                  placeholder="O+, A-, etc."
                  value={formData.blood_group}
                  onChangeText={t => setFormData({ ...formData, blood_group: t })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 175"
                  keyboardType="number-pad"
                  value={formData.height}
                  onChangeText={t => setFormData({ ...formData, height: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 65"
                  keyboardType="number-pad"
                  value={formData.weight}
                  onChangeText={t => setFormData({ ...formData, weight: t })}
                />
              </View>
            </View>

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={formData.address}
              onChangeText={t => setFormData({ ...formData, address: t })}
            />

            <TouchableOpacity style={styles.buttonMain} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Registering..." : "Create Account"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={() => setStep('login')}>
              <Text style={{ color: '#007AFF', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1f2937' },
  subHeader: { fontSize: 20, fontWeight: '600', marginBottom: 20, color: '#374151' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '500', color: '#4b5563' },
  input: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonMain: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { padding: 15, marginTop: 10 },
});