import { UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, WorkoutRoutine, UserMission, GoalTarget } from '../types';
import { GOOGLE_CLIENT_ID, DRIVE_BACKUP_FILENAME } from '../constants';

export interface BackupData {
  profile: UserProfile;
  history: WorkoutSession[];
  zones: Zone[];
  exercises: Exercise[];
  routines: WorkoutRoutine[];
  biometricLogs: BiometricLog[];
  missions: UserMission[];
  goalTargets: GoalTarget[];
  exportedAt: string;
}

const STORAGE_KEY_TOKEN = 'google_access_token';
const STORAGE_KEY_EXPIRY = 'google_token_expiry';

/**
 * Checks if the currently stored token is still valid by pinging Google's token info endpoint.
 */
export const isTokenValid = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    // 5-minute safety margin (300000 ms)
    if (storedToken && expiry && Date.now() < parseInt(expiry) - 300000) {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${storedToken}`);
            return response.ok;
        } catch {
            return false;
        }
    }
    return false;
};

/**
 * Handles Google OAuth2 login and returns an access token, now with localStorage persistence.
 */
export const getAccessToken = async (): Promise<string | null> => {
  // 1. Check for a valid, non-expired token in localStorage
  const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);

  // 5-minute safety margin (300000 ms)
  if (storedToken && expiry && Date.now() < parseInt(expiry) - 300000) {
    return storedToken;
  }

  // 2. If no valid token exists, request a new one
  return new Promise((resolve, reject) => {
    if (!(window as any).google || !(window as any).google.accounts) {
      console.error("Google script not loaded");
      alert("Kunde inte ladda Google-inloggning. Kontrollera din internetanslutning.");
      resolve(null);
      return;
    }

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          console.error("Google Auth Error:", response);
          // Clear stale tokens if auth fails
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_EXPIRY);
          reject(response);
        } else {
          // Save the new token and calculate its expiry time
          const expiresIn = response.expires_in || 3599; // in seconds
          const expiryTime = Date.now() + (expiresIn * 1000);
          
          localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
          localStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());
          
          resolve(response.access_token);
        }
      },
    });

    client.requestAccessToken();
  });
};

/**
 * Finds the backup file on Google Drive.
 */
export const findBackupFile = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILENAME}' and trashed=false&fields=files(id, name, modifiedTime)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  } catch (error) {
    console.error("Error finding backup file:", error);
    return null;
  }
};

/**
 * Downloads the backup file from Google Drive.
 */
export const downloadBackup = async (token: string, fileId: string): Promise<BackupData | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await response.json();
  } catch (error) {
    console.error("Error downloading backup:", error);
    return null;
  }
};

/**
 * Creates or updates the backup file on Google Drive.
 */
export const uploadBackup = async (token: string, data: BackupData, existingFileId: string | null): Promise<string | null> => {
  const metadata = {
    name: DRIVE_BACKUP_FILENAME,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  try {
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error("Error uploading backup:", error);
    return null;
  }
};