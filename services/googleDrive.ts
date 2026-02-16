import { GOOGLE_CLIENT_ID } from '../constants';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export interface BackupData {
  timestamp: string;
  data: any;
  device: string;
}

/**
 * 1. Laddar nödvändiga Google-skript
 */
export const initializeGoogleDrive = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (gapiInited && gisInited) {
      resolve();
      return;
    }

    // Ladda GAPI (för Drive API anrop)
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        if (gisInited) resolve();
      });
    };
    document.body.appendChild(gapiScript);

    // Ladda GIS (för Inloggning)
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      // @ts-ignore
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Definieras senare vid request
      });
      gisInited = true;
      if (gapiInited) resolve();
    };
    document.body.appendChild(gisScript);
  });
};

/**
 * 2. Logga in och hämta Token
 */
export const getAccessToken = async (): Promise<string> => {
  if (!gapiInited || !gisInited) await initializeGoogleDrive();

  return new Promise((resolve, reject) => {
    // Om vi redan har en giltig token, använd den (valfritt, men GIS hanterar detta bra själv)
    
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        }
        // Sätt token i gapi så att client.drive anrop fungerar
        const token = { access_token: resp.access_token };
        (window as any).gapi.client.setToken(token);
        resolve(resp.access_token);
      };

      // Trigga popup/redirect
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error("GAPI/GIS Error:", err);
      reject(err);
    }
  });
};

/**
 * 3. Hitta existerande backup
 */
export const listBackups = async (): Promise<any[]> => {
  await getAccessToken(); // Säkerställ inloggning

  try {
    const response = await (window as any).gapi.client.drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, createdTime)',
      q: "name = 'morphfit_backup.json' and trashed = false",
    });
    return response.result.files || [];
  } catch (error) {
    console.error("List error:", error);
    throw error;
  }
};

/**
 * 4. Ladda upp (Skapa ny eller Uppdatera)
 */
export const uploadBackup = async (data: any): Promise<void> => {
  const token = await getAccessToken();

  const fileName = 'morphfit_backup.json';
  const fileContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    device: navigator.userAgent,
    data: data
  }, null, 2);

  const file = new Blob([fileContent], { type: 'application/json' });
  
  // Kolla om filen finns
  const existingFiles = await listBackups();
  
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  // Om filen finns, uppdatera den istället (PATCH)
  if (existingFiles.length > 0) {
    const fileId = existingFiles[0].id;
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  await fetch(url, {
    method: method,
    headers: new Headers({ 'Authorization': 'Bearer ' + token }),
    body: form,
  });
};

/**
 * 5. Ladda ner och återställ
 */
export const downloadBackup = async (fileId: string): Promise<BackupData> => {
  const token = await getAccessToken(); // Behövs för fetch

  // Vi använder fetch för att ladda ner innehållet (alt=media)
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to download file');
  
  const data = await response.json();
  return data as BackupData;
};

/**
 * 6. Logga ut
 */
export const signOutGoogle = () => {
  const token = (window as any).gapi?.client?.getToken();
  if (token) {
    // @ts-ignore
    google.accounts.oauth2.revoke(token.access_token, () => {console.log('Revoked')});
    (window as any).gapi.client.setToken(null);
  }
};