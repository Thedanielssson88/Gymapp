import { UserProfile } from '../types';

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const vibrate = (pattern: number | number[]) => {
  if (canVibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Vibration failed", e);
    }
  }
};

export const haptics = {
  impact: () => vibrate([50, 50, 50]),
  selection: () => vibrate(10),
};

export const triggerHaptic = {
  light: () => vibrate(10),
  
  tick: (user: UserProfile | null) => {
    if (user?.settings?.vibrateButtons) {
      vibrate(10);
    }
  },

  success: (user: UserProfile | null) => {
    if (user?.settings?.vibrateButtons) {
      vibrate([50, 50, 50]);
    }
  },

  double: (user: UserProfile | null) => {
    if (user?.settings?.vibrateButtons) {
      vibrate([50, 50, 50]);
      setTimeout(() => vibrate([50, 50, 50]), 200);
    }
  },
};
