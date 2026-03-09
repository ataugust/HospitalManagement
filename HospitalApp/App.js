import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyAppointmentsScreen from './src/screens/MyAppointmentsScreen';
import BloodDonationScreen from './src/screens/BloodDonationScreen';
import MyMedicinesScreen from './src/screens/MyMedicinesScreen';
import { configurePushNotifications, registerNotificationResponseListener } from './src/services/NotificationService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Set up Local Notifications (Actionable Categories)
    configurePushNotifications();
    const sub = registerNotificationResponseListener();

    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      {/* Only ONE Stack.Navigator is needed */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // AUTHENTICATED AREA
          <>
            {/* The first screen in the group is the default "landing" screen */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
            <Stack.Screen name="BloodDonation" component={BloodDonationScreen} />
            <Stack.Screen name="MyMedicines" component={MyMedicinesScreen} />
          </>
        ) : (
          // GUEST AREA
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}