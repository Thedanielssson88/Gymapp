
import { GOOGLE_CLIENT_ID, DRIVE_BACKUP_FILENAME } from '../constants';

const CLIENT_ID = GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// We only load the token client (GIS), skipping GAPI for uploads to reduce complexity
let tokenClient: any;
let gisInited = false;

export interface BackupData {
  timestamp: string;
  data: any;
  device: string;
}

/**
 * 1. Initialize Google Identity Services (GIS)
 */
export const initializeGoogleDrive = async (): Promise<void> => {
  console.log("Initializing Google Drive...");
  return new Promise((resolve, reject) => {
    if (gisInited) {
      console.log("GIS already initialized.");
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("GIS script loaded.");
      try {
        // @ts-ignore
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          // The callback is set dynamically later, but we need one here at init
          callback: (resp: any) => { console.log("Init callback (unused)", resp); },
        });
        gisInited = true;
        resolve();
      } catch (err) {
        console.error("GIS Init Error:", err);
        reject(err);
      }
    };
    script.onerror = (err) => {
      console.error("Failed to load GIS script", err);
      reject(err);
    };
    document.body.appendChild(script);
  });
};

/**
 * 2. Get Access Token (Forces login if needed)
 */
// FIX: Export the getAccessToken function to make it accessible to other modules.
export const getAccessToken = async (): Promise<string> => {
  console.log("Requesting Access Token...");
  if (!gisInited) await initializeGoogleDrive();

  return new Promise((resolve, reject) => {
    try {
      // Override the callback for this specific request
      tokenClient.callback = (resp: any) => {
        if (resp.error) {
          console.error("Auth Error:", resp);
          reject(resp);
          return;
        }
        console.log("Access Token Received!");
        resolve(resp.access_token);
      };

      // Request token (opens popup if user is not logged in)
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error("Token Request Error:", err);
      reject(err);
    }
  });
};

/**
 * 3. Find the file (via Fetch API instead of GAPI)
 */
export const listBackups = async (): Promise<any[]> => {
  const token = await getAccessToken();
  console.log("Listing backups...");

  const url = `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_BACKUP_FILENAME}' and trashed=false&fields=files(id,name,createdTime)`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("List Backups Failed:", err);
    throw new Error("Could not list files: " + response.statusText);
  }

  const data = await response.json();
  console.log("Found files:", data.files);
  return data.files || [];
};

/**
 * 4. Upload Backup (Multipart upload via Fetch)
 */
export const uploadBackup = async (data: any): Promise<void> => {
  console.log("Starting upload process...");
  
  // 1. Get token first
  const token = await getAccessToken();
  
  // 2. Prepare the file
  const fileName = DRIVE_BACKUP_FILENAME;
  const fileContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    device: navigator.userAgent,
    data: data
  }, null, 2);

  const fileBlob = new Blob([fileContent], { type: 'application/json' });
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  // 3. Build Multipart Body
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  // 4. Check if we should create a new file or update
  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  try {
    const existingFiles = await listBackups(); // This reuses the token, which is fine
    if (existingFiles.length > 0) {
      const fileId = existingFiles[0].id;
      console.log(`Overwriting existing file: ${fileId}`);
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = 'PATCH';
    }
  } catch (err) {
    console.warn("Could not check for existing files, trying to create a new one.", err);
  }

  // 5. Perform the upload
  console.log(`Sending ${method} request to Google Drive...`);
  
  const response = await fetch(url, {
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      // IMPORTANT: Let the browser set the Content-Type for FormData (boundary)
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload Failed Response:", errorText);
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  console.log("Upload successful!");
};

/**
 * 5. Download backup
 */
export const downloadBackup = async (fileId: string): Promise<BackupData> => {
  const token = await getAccessToken();
  console.log(`Downloading file: ${fileId}`);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }
  
  const data = await response.json();
  return data as BackupData;
};

/**
 * 6. Sign out
 */
export const signOutGoogle = () => {
  if (tokenClient && (window as any).google) {
    // @ts-ignore
    (window as any).google.accounts.oauth2.revoke(localStorage.getItem('g_token'), () => {
      console.log('Revoked access');
    });
  }
};