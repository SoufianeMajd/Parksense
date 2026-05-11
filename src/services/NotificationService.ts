import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Requis pour les dev builds plus tard
      })).data;
      console.log('Push token:', token);
    } catch (e) {
      console.warn('Note: Les notifications Push nécessitent un "Development Build" depuis Expo SDK 53. Elles ne fonctionneront pas dans Expo Go.');
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function schedulePushNotification(title: string, body: string, delayMs = 1000) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: { data: 'goes here' },
    },
    trigger: { seconds: delayMs / 1000 },
  });
}
