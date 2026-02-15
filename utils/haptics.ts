import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { UserProfile } from '../types';

const canVibrate = async () => {
  try {
    if ((Haptics as any).checkPermissions) { // checkPermissions might not exist in all environments
      const permissions = await (Haptics as any).checkPermissions();
      return permissions.receive === 'granted';
    }
    return true; // Assume available if check is not present
  } catch (e) {
    return false;
  }
};

const isHapticsAvailable = canVibrate();

export const haptics = {
  impact: async () => {
    if (!(await isHapticsAvailable)) return;
    try {
      // For timer completion, notification is better than impact.
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn("Haptics impact/notification failed", e);
    }
  },
  selection: async () => {
    if (!(await isHapticsAvailable)) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      console.warn("Haptics selection failed", e);
    }
  },
};

export const triggerHaptic = {
  light: async () => {
    if (!(await isHapticsAvailable)) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn("Haptics light failed", e);
    }
  },
  
  tick: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateButtons || !(await isHapticsAvailable)) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn("Haptics tick failed", e);
    }
  },

  success: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateButtons || !(await isHapticsAvailable)) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn("Haptics success failed", e);
    }
  },

  double: async (user: UserProfile | null) => {
    if (!user?.settings?.vibrateButtons || !(await isHapticsAvailable)) return;
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
