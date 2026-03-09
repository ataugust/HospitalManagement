import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';

// 1. Configure the notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Step 2: Configure Notification Categories (Foreground/Startup)
export async function configurePushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicine-reminders', {
      name: 'Medicine Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  await Notifications.setNotificationCategoryAsync('MEDICINE_REMINDER', [
    {
      identifier: 'MARK_TAKEN',
      buttonTitle: 'Taken',
      options: { opensAppToForeground: true }, // Wake app/foreground
    },
    {
      identifier: 'MARK_MISSED',
      buttonTitle: 'Missed',
      options: { opensAppToForeground: true }, // Wake app/foreground
    },
  ]);

  // Also request permissions just in case
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

// 3. Step 4: Handle the Button Clicks in Background
// This must be registered as early as possible (e.g., in App.js outside component or inside useEffect)
export function registerNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionIdentifier = response.actionIdentifier;

    // Check if it's one of our custom actions
    if (actionIdentifier === 'MARK_TAKEN' || actionIdentifier === 'MARK_MISSED') {
      const { medicineId, patientId } = response.notification.request.content.data;
      const status = actionIdentifier === 'MARK_TAKEN' ? 'Taken' : 'Missed';

      // 1. Immediately dismiss the notification so it leaves the tray
      try {
        await Notifications.dismissNotificationAsync(response.notification.request.identifier);
      } catch (e) {
        console.error("Error dismissing notification:", e);
      }

      // 2. Only log to Supabase if the user explicitly clicked "Missed"
      if (status === 'Missed') {
        const dateLogged = new Date().toISOString().split('T')[0];

        try {
          console.log(`Logging medicine ${medicineId} as Missed...`);
          const { error } = await supabase.from('medication_logs').insert([
            {
              medicine_id: medicineId,
              patient_id: patientId,
              status: status,
              date_logged: dateLogged,
            }
          ]);

          if (error) {
            console.error("Error logging medication:", error);
          } else {
            console.log(`Successfully logged medicine ${medicineId} as Missed`);
          }
        } catch (e) {
          console.error("Exception during background notification handle:", e);
        }
      } else {
        console.log(`User took medicine ${medicineId}. Notification dismissed without database log.`);
      }
    }
  });
}

// 4. Step 3: Schedule the Alarms
export async function scheduleMedicineReminders(medicineList) {
  // Clear all existing to prevent duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const med of medicineList) {
    if (!med.dosage) continue;

    // Dosage comes as "1-0-1" (Morning-Noon-Night)
    const dosageParts = med.dosage.split('-');
    if (dosageParts.length !== 3) continue;

    const [morning, noon, night] = dosageParts;

    if (morning !== "0") {
      await scheduleDailyNotification(8, 0, med, 'Morning'); // 8:00 AM
    }
    if (noon !== "0") {
      await scheduleDailyNotification(12, 30, med, 'Noon');  // 12:30 PM
    }
    if (night !== "0") {
      await scheduleDailyNotification(19, 0, med, 'Night');  // 7:00 PM
    }
  }
}

async function scheduleDailyNotification(hour, minute, med, timeLabel) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Medicine Reminder 💊",
      body: `It's time for your ${timeLabel} medicine: ${med.name} (${med.instructions})`,
      categoryIdentifier: 'MEDICINE_REMINDER',
      data: { medicineId: med.id, patientId: med.patient_id },
      sound: true,
      // VERY IMPORTANT FOR ANDROID:
      ...(Platform.OS === 'android' ? { channelId: 'medicine-reminders' } : {}),
    },
    trigger: {
      type: 'daily',
      hour: hour,
      minute: minute,
      repeats: true, // Daily repeating
      ...(Platform.OS === 'android' ? { channelId: 'medicine-reminders' } : {}),
    },
  });
}

// 5. Test Function
export async function sendTestNotification(med) {
  if (!med) {
    alert("No active medicine found to test with!");
    return;
  }
  
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Reminder 💊",
        body: `Did you take your ${med.name}? (Test)`,
        categoryIdentifier: 'MEDICINE_REMINDER',
        data: { medicineId: med.id, patientId: med.patient_id },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'medicine-reminders' } : {}),
      },
      trigger: {
        type: 'timeInterval',
        seconds: 5,
        ...(Platform.OS === 'android' ? { channelId: 'medicine-reminders' } : {}),
      },
    });
  } catch (error) {
    console.error("Failed to schedule test notification:", error);
    alert("Error scheduling notification: " + error.message);
  }
}
