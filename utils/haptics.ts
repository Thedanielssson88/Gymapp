import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { UserProfile } from '../types';

const canVibrate = async () => {
  try {
    if (Haptics.checkPermissions) { // checkPermissions might not exist in all environments
      const permissions = await Haptics.checkPermissions();
      return permissions.receive === 'granted';
    }
    return true; // Assume available if check is not present
  } catch (e) {
    return false;
  }
};

const isHapticsAvailable = canVibrate();

export const triggerHaptic = {
  tick: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateOnRestEnd || !(await isHapticsAvailable)) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn("Haptics tick failed", e);
    }
  },

  success: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateOnRestEnd || !(await isHapticsAvailable)) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn("Haptics success failed", e);
    }
  },

  double: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateOnRestEnd || !(await isHapticsAvailable)) return;
    try {
        await Haptics.notification({ type: NotificationType.Success });
        setTimeout(async () => {
            await Haptics.notification({ type: NotificationType.Success });
        }, 150);
    } catch (e) {
        console.warn("Haptics double failed", e);
    }
  },
};
