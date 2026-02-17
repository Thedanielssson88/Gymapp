
import { SocialLogin } from '@capgo/capacitor-social-login';
import { GOOGLE_CLIENT_ID, DRIVE_BACKUP_FILENAME } from '../constants';

// Vi använder inte längre webb-scriptet (GSI), utan det nativa pluginet.
// Se till att du har konfigurerat capacitor.config.ts med dina Client IDs.

export interface BackupData {
  timestamp: string;
  data: any;
  device: string;
}

let isInitialized = false;

/**
 * 1. Initialize - Behövs oftast bara köras en gång av pluginet
 */
export const initializeGoogleDrive = async (): Promise<void> => {
  if (isInitialized) return;
  console.log("Initializing SocialLogin plugin...");
  await SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_CLIENT_ID, // Din webb-klient-ID (behövs ibland för Android också)
    }
  });
  isInitialized = true;
};

/**
 * 2. Get Access Token (Via @capgo/capacitor-social-login)
 */
export const getAccessToken = async (forceRefresh: boolean = false): Promise<string> => {
  if (!isInitialized) {
    await initializeGoogleDrive();
  }

  // 1. Kolla om vi redan har en token i localStorage som är giltig
  const savedToken = localStorage.getItem('g_drive_token');
  const expiry = localStorage.getItem('g_drive_token_expiry');

  if (!forceRefresh && savedToken && expiry && Date.now() < (parseInt(expiry, 10) - 300000)) {
    console.log("Using cached Google Drive token.");
    return savedToken;
  }

  // 2. Om ingen giltig token finns, logga in via pluginet
  console.log("Requesting native Google Login...");
  try {
    // VIKTIGT: För Drive behöver vi specifika scopes.
    // Pluginet hanterar inloggningsrutan native på telefonen.
    const response = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['https://www.googleapis.com/auth/drive.file']
      }
    });

    if (!response.result || !response.result.accessToken) {
      throw new Error("No access token received from Google Login");
    }

    // Cacha token (Google tokens varar oftast 1h)
    // Strukturen kan variera något beroende på plattform
    console.log("Login response:", response);

    // Enklare hantering om strukturen skiljer sig:
    const finalToken = typeof response.result.accessToken === 'string' 
      ? response.result.accessToken 
      : response.result.accessToken.token;

    // Sätt expiry till 50 minuter framåt (säkerhetsmarginal)
    const expiryTime = Date.now() + (3000 * 1000); 
    
    localStorage.setItem('g_drive_token', finalToken);
    localStorage.setItem('g_drive_token_expiry', expiryTime.toString());
    
    return finalToken;

  } catch (err) {
    console.error("Native Google Login Error:", err);
    throw err;
  }
};

/**
 * 3. Find the file (Samma som förut, men använder token från ovan)
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
    if (response.status === 401) {
      // Om token gått ut, rensa och kasta fel så användaren får försöka igen (eller hantera retry)
      localStorage.removeItem('g_drive_token');
    }
    const err = await response.text();
    console.error("List Backups Failed:", err);
    throw new Error("Could not list files: " + response.statusText);
  }

  const data = await response.json();
  console.log("Found files:", data.files);
  return data.files || [];
};

/**
 * 4. Upload Backup (Samma som förut)
 */
export const uploadBackup = async (data: any): Promise<void> => {
  console.log("Starting upload process...");
  const token = await getAccessToken();
  
  const fileName = DRIVE_BACKUP_FILENAME;
  const fileContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    device: "Android/Capacitor", // Uppdaterat namn
    data: data
  }, null, 2);

  const fileBlob = new Blob([fileContent], { type: 'application/json' });
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  try {
    const existingFiles = await listBackups();
    if (existingFiles.length > 0) {
      const fileId = existingFiles[0].id;
      console.log(`Overwriting existing file: ${fileId}`);
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = 'PATCH';
    }
  } catch (err) {
    console.warn("Could not check for existing files, trying to create a new one.", err);
  }
  
  const response = await fetch(url, {
    method: method,
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }
  console.log("Upload successful!");
};

/**
 * 5. Download backup (Samma som förut)
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
export const signOutGoogle = async () => {
  try {
    await SocialLogin.logout({ provider: 'google' });
  } catch (e) {
    console.warn("Logout failed", e);
  }
  localStorage.removeItem('g_drive_token');
  localStorage.removeItem('g_drive_token_expiry');
};
