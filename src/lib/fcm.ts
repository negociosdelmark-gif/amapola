import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Default VAPID key (Voluntary Application Server Identification) for FCM Web Push
// In real production, this would be retrieved from your Firebase Console.
const VAPID_KEY = 'BDE6Z_L96GzS92yZfJt81v66G-7C1b-zD8o97v0_b9f_G_R4n6b9GZ7n8zD9e7_r8x2t-D';

export interface FCMRegistrationResult {
  success: boolean;
  token?: string;
  error?: string;
  permission: NotificationPermission;
  isSimulated: boolean;
}

/**
 * Request notification permissions and register with Firebase Cloud Messaging
 */
export async function registerPushNotifications(userId: string | null): Promise<FCMRegistrationResult> {
  // 1. Check browser permission capability
  if (!('Notification' in window)) {
    return {
      success: false,
      error: 'Este navegador no soporta notificaciones de escritorio.',
      permission: 'default',
      isSimulated: true
    };
  }

  try {
    // 2. Request permission from the user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: 'Permiso de notificaciones denegado por el usuario.',
        permission,
        isSimulated: false
      };
    }

    // 3. Check if FCM is supported on this browser (e.g. Chrome/Firefox vs restricted iframes)
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM no es compatible con este entorno (común en iframes de desarrollo). Se activará simulación local.");
      
      // Save local subscription preference
      localStorage.setItem(`fcm_token_simulated_${userId || 'guest'}`, 'simulated_fcm_token_3a9bf81b2');
      localStorage.setItem(`fcm_notifications_enabled_${userId || 'guest'}`, 'true');

      // Sync simulated preference to Firestore if logged in
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, {
            fcmToken: 'simulated_fcm_token_3a9bf81b2',
            notificationsEnabled: true,
            isSimulated: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("No se pudo sincronizar token simulado a Firestore:", e);
        }
      }

      return {
        success: true,
        token: 'simulated_fcm_token_3a9bf81b2',
        permission,
        isSimulated: true
      };
    }

    // 4. Get FCM instance and retrieve token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Save token locally
      localStorage.setItem(`fcm_token_${userId || 'guest'}`, token);
      localStorage.setItem(`fcm_notifications_enabled_${userId || 'guest'}`, 'true');

      // Sync real token to Firestore if logged in
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, {
            fcmToken: token,
            notificationsEnabled: true,
            isSimulated: false,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("No se pudo guardar el token real en Firestore:", e);
        }
      }

      return {
        success: true,
        token,
        permission,
        isSimulated: false
      };
    } else {
      return {
        success: false,
        error: 'No se pudo generar un token de FCM. Intente de nuevo.',
        permission,
        isSimulated: false
      };
    }

  } catch (err: any) {
    console.error("Error al registrar notificaciones push:", err);
    
    // Fallback gracefully to Simulation mode if in restricted sandbox iframe
    const permissionStatus = 'Notification' in window ? Notification.permission : 'default' as NotificationPermission;
    
    // Setup local simulated token so that user can test vaccine notifications flawlessly
    localStorage.setItem(`fcm_token_simulated_${userId || 'guest'}`, 'simulated_fcm_token_fallback');
    localStorage.setItem(`fcm_notifications_enabled_${userId || 'guest'}`, 'true');

    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          fcmToken: 'simulated_fcm_token_fallback',
          notificationsEnabled: true,
          isSimulated: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Firestore sync fallback failed:", e);
      }
    }

    return {
      success: true,
      token: 'simulated_fcm_token_fallback',
      permission: permissionStatus,
      isSimulated: true,
      error: err.message || 'Se activó simulación debido a restricciones de iframe.'
    };
  }
}

/**
 * Set up in-app foreground message listener
 */
export async function listenToForegroundMessages(onMessageReceived: (payload: any) => void) {
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('Mensaje FCM recibido en primer plano:', payload);
      onMessageReceived(payload);
    });
  } catch (err) {
    console.error("Error al registrar listener de primer plano:", err);
    return null;
  }
}

/**
 * Triggers a real browser Notification or rich toast in-app (Simulation & Real Hybrid)
 */
export function triggerLocalPushNotification(title: string, body: string, icon: string = 'https://ai.studio/build/favicon.ico') {
  // 1. Browser Native Notification if granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200]
      } as any);
    } catch (e) {
      console.warn("No se pudo disparar notificación nativa (común en sandboxes). Se utilizará alerta visual en pantalla.", e);
    }
  }

  // 2. We can dispatch a custom event so that App.tsx can show a stunning rich custom toast in real-time
  const event = new CustomEvent('app-push-notification', {
    detail: { title, body, timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
}
