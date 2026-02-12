import { UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, WorkoutRoutine, UserMission, GoalTarget } from '../types';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Note: In a real app, these would come from environment variables.
const CLIENT_ID = 'PLACEHOLDER_CLIENT_ID.apps.googleusercontent.com';

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

/**
 * Handles Google OAuth2 login and returns an access token.
 * This is a simplified version using a popup.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    // Check if we already have a valid token in memory or local storage if needed
    // For this implementation, we assume a standard browser OAuth flow.
    const token = localStorage.getItem('google_drive_access_token');
    const expiry = localStorage.getItem('google_drive_token_expiry');
    
    if (token && expiry && Date.now() < parseInt(expiry)) {
      return resolve(token);
    }

    // In a real environment, you'd use a library like @react-oauth/google or 
    // the Google Identity Services SDK. This is a conceptual trigger.
    console.warn("Google Drive: Auth token requested. This requires a real Client ID and the Google Identity SDK.");
    resolve(null);
  });
};

/**
 * Finds the backup file on Google Drive.
 */
export const findBackupFile = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='morphfit_backup.json' and trashed=false&fields=files(id, name, modifiedTime)`, {
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
    name: 'morphfit_backup.json',
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
