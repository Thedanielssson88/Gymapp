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
 * 2. Get Access Token (Caches in localStorage)
 */
export const getAccessToken = async (forcePrompt = false): Promise<string> => {
  if (!gisInited) await initializeGoogleDrive();

  // 1. Check for a valid cached token
  const savedToken = localStorage.getItem('g_drive_token');
  const expiry = localStorage.getItem('g_drive_token_expiry');

  // If token exists, has time left, and we aren't forcing a prompt, use it.
  if (!forcePrompt && savedToken && expiry && Date.now() < (parseInt(expiry, 10) - 300000)) {
    console.log("Using cached Google Drive token.");
    return savedToken;
  }

  // 2. Otherwise, request a new token
  return new Promise((resolve, reject) => {
    console.log("Requesting new Google Drive access token...");
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error) {
          console.error("Google Auth Error:", resp);
          return reject(resp);
        }
        
        const expiryTime = Date.now() + (resp.expires_in * 1000);
        localStorage.setItem('g_drive_token', resp.access_token);
        localStorage.setItem('g_drive_token_expiry', expiryTime.toString());
        
        console.log("New Google Access Token received and cached.");
        resolve(resp.access_token);
      };

      // Use 'consent' prompt if forced or if no token was ever saved.
      // Use silent prompt ('') if a token existed but may have expired.
      tokenClient.requestAccessToken({ prompt: (savedToken && !forcePrompt) ? '' : 'consent' });
    } catch (err) {
      console.error("Google Token Request Error:", err);
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
  // Revoke token from Google's side
  if (tokenClient && (window as any).google) {
    const savedToken = localStorage.getItem('g_drive_token');
    if(savedToken) {
      // @ts-ignore
      (window as any).google.accounts.oauth2.revoke(savedToken, () => {
        console.log('Revoked Google access token.');
      });
    }
  }
  // Clear local cache
  localStorage.removeItem('g_drive_token');
  localStorage.removeItem('g_drive_token_expiry');
};