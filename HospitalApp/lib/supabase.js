import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// DOUBLE CHECK: Did you paste your keys here?
const supabaseUrl = 'https://hyuryheredecnknocpbc.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dXJ5aGVyZWRlY25rbm9jcGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTQxMTIsImV4cCI6MjA4Njk3MDExMn0.UInLpgLSAKV9xCXHHi2y2Pri3cPtjkYV9nH9AUKUloA';

// CRITICAL: The word 'export' must be here!
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});