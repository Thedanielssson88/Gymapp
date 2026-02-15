import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Goal, UserSettings } from '../types';
import { storage, exportExerciseLibrary, importExerciseLibrary } from '../services/storage';
import { db } from '../services/db';
import { getAccessToken, uploadBackup, findBackupFile, BackupData, isTokenValid } from '../services/googleDrive';
import { Save, Download, Upload, Smartphone, LayoutList, Map, Thermometer, Dumbbell, Scale, Cloud, RefreshCw, CloudOff, AlertCircle, CheckCircle2, Loader2, Timer, Key } from 'lucide-react';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdate: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdate }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Proactively check token validity on mount if user is linked
    if (userProfile.settings?.googleDriveLinked) {
      isTokenValid().then(valid => {
        if (!valid) {
          setConnectionError(true);
        }
      });
    }
  }, [userProfile.settings?.googleDriveLinked]);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setLocalProfile(prev => ({
        ...prev,
        settings: {
            includeWarmupInStats: prev.settings?.includeWarmupInStats ?? false,
            bodyViewMode: prev.settings?.bodyViewMode ?? 'list',
            vibrateButtons: prev.settings?.vibrateButtons ?? true,
            vibrateTimer: prev.settings?.vibrateTimer ?? true,
            googleDriveLinked: prev.settings?.googleDriveLinked ?? false,
            ...prev.settings,
            [key]: value
        }
    }));
  };

  const handleSave = async () => {
    await storage.setUserProfile(localProfile);
    onUpdate();
    alert("Inställningar sparade!");
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setConnectionError(false);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Kunde inte ansluta till Google. Försök igen.");
      }

      const backupData = await storage.getFullBackupData();
      const existingFileId = await findBackupFile(token);
      await uploadBackup(token, backupData, existingFileId);
      
      const updatedProfile = {
        ...localProfile,
        settings: {
          ...localProfile.settings!,
          googleDriveLinked: true,
          lastCloudSync: new Date().toISOString()
        }
      };
      await storage.setUserProfile(updatedProfile);
      setLocalProfile(updatedProfile);
      setSyncStatus('success');
      onUpdate();
    } catch (error) {
      console.error("Cloud sync failed:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000); // Reset status after 3s
    }
  };

  const handleExport = async () => {
    const allData = await storage.getFullBackupData();
    const blob = new Blob([JSON.stringify(allData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morphfit_backup.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Är du säker? Detta kommer att skriva över all din nuvarande data.")) {
        if(e.target) e.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const content = event.target?.result as string;
            const data = JSON.parse(content) as BackupData;
            if (!data.profile || !data.history) {
              throw new Error("Filen verkar inte vara en giltig backup.");
            }
            await storage.importFullBackup(data);
            alert("Återställning klar! Appen startas om.");
            window.location.reload();
        } catch (error) {
            alert("Kunde inte läsa backup-filen: " + (error as Error).message);
            console.error("Import failed:", error);
        } finally {
            if(e.target) e.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
  };
  
  const handleExportLibrary = async () => {
    const success = await exportExerciseLibrary();
    if (success) {
      alert("Ditt övningsbibliotek (inkl. bilder) har exporterats!");
    }
  };

  const handleImportLibrary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const count = await importExerciseLibrary(file);
      alert(`Import lyckades! ${count} övningar har lagts till eller uppdaterats.`);
      onUpdate();
    } catch (err: any) {
      alert("Ett fel uppstod vid importen: " + err.message);
    }
  };

  const getSyncButtonContent = () => {
    if (isSyncing) return <><Loader2 className="animate-spin" size={18} /> Synkroniserar...</>;
    if (syncStatus === 'success') return <><CheckCircle2 size={18} /> Synkning Lyckades!</>;
    if (syncStatus === 'error') return <><AlertCircle size={18} /> Försök Igen</>;
    return <><Cloud size={18} /> {localProfile.settings?.googleDriveLinked ? 'Synka Nu' : 'Anslut till Google Drive'}</>;
  };
  
  const getSyncButtonClass = () => {
    if (isSyncing) return 'bg-white/5 text-white/40 cursor-not-allowed';
    if (syncStatus === 'success') return 'bg-accent-green text-black';
    if (syncStatus === 'error') return 'bg-red-500 text-white';
    return 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20';
  };

  return (
    <div className="space-y-8 pb-32 px-2 animate-in fade-in">
      
      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-4">
         <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
            Profil
         </h3>
         <div className="space-y-4">
            <div className="flex flex-col gap-1">
               <label className="text-[10px] font-black uppercase text-text-dim">Namn</label>
               <input 
                 type="text" 
                 value={localProfile.name} 
                 onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                 className="bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-accent-pink"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-text-dim">Vikt (kg)</label>
                  <input 
                    type="number" 
                    value={localProfile.weight} 
                    onChange={e => setLocalProfile({...localProfile, weight: Number(e.target.value)})}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-accent-pink"
                  />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-text-dim">Mål</label>
                  <select 
                    value={localProfile.goal} 
                    onChange={e => setLocalProfile({...localProfile, goal: e.target.value as Goal})}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-accent-pink"
                  >
                     {Object.values(Goal).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
            </div>
         </div>
      </section>

      {/* CLOUD SYNC SECTION */}
      <section className="bg-gradient-to-br from-[#1a1721] to-[#1c1a26] p-6 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
             <Cloud className="text-accent-blue" size={24} />
             <div>
                <h3 className="text-xl font-black italic uppercase text-white leading-none">Cloud Sync</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Google Drive Backup</p>
             </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${localProfile.settings?.googleDriveLinked ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'bg-white/5 border-white/10 text-text-dim'}`}>
            {localProfile.settings?.googleDriveLinked ? 'Ansluten' : 'Ej Ansluten'}
          </div>
        </div>

        {connectionError && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-[10px] font-bold text-red-500 uppercase leading-snug">
              Anslutningen till Google har löpt ut. Tryck på "Synka Nu" för att logga in igen.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleCloudSync}
            disabled={isSyncing}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${getSyncButtonClass()}`}
          >
            {getSyncButtonContent()}
          </button>

          {localProfile.settings?.lastCloudSync && !connectionError && (
            <p className="text-[9px] text-center text-text-dim uppercase font-bold">
              Senaste synk: {new Date(localProfile.settings.lastCloudSync).toLocaleString('sv-SE')}
            </p>
          )}

          {localProfile.settings?.googleDriveLinked && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-text-dim" />
                  <div>
                    <p className="text-sm font-bold text-white">Auto-synk efter pass</p>
                    <p className="text-[9px] text-text-dim uppercase">Ladda upp automatiskt</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSettingChange('autoSyncMode', localProfile.settings?.autoSyncMode === 'after_workout' ? 'manual' : 'after_workout')}
                  className={`w-10 h-5 rounded-full relative transition-colors ${localProfile.settings?.autoSyncMode === 'after_workout' ? 'bg-accent-blue' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localProfile.settings?.autoSyncMode === 'after_workout' ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-text-dim" />
                  <div>
                    <p className="text-sm font-bold text-white">Återställ vid start</p>
                    <p className="text-[9px] text-text-dim uppercase">Kolla efter nyare data</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSettingChange('restoreOnStartup', !(localProfile.settings?.restoreOnStartup ?? false))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${(localProfile.settings?.restoreOnStartup ?? false) ? 'bg-accent-blue' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${(localProfile.settings?.restoreOnStartup ?? false) ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI INSTÄLLNINGAR SEKTION */}
      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-4">
        <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
          <Key size={18} className="text-accent-blue" /> AI Konfiguration
        </h3>
        
        <div>
          <label className="text-[10px] text-text-dim font-bold uppercase block mb-2">Gemini API Nyckel</label>
          <input 
            type="password"
            value={localProfile.settings?.geminiApiKey || ''}
            onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
            placeholder="Klistra in din nyckel här..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-accent-blue outline-none"
          />
          <p className="text-[10px] text-text-dim mt-2">
            Krävs för att använda AI-coachen i appen. 
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent-blue underline ml-1">
              Hämta nyckel här
            </a>
          </p>
        </div>
      </section>

      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-6">
         <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
            <Smartphone className="text-accent-blue" /> Appupplevelse
         </h3>

         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
               {(localProfile.settings?.bodyViewMode || 'list') === 'list' ? <LayoutList size={18} className="text-white"/> : <Map size={18} className="text-white"/>}
               <div>
                  <p className="text-sm font-bold text-white">Kroppsvy</p>
                  <p className="text-[10px] text-text-dim">Hur vill du se din status?</p>
               </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               <button 
                 onClick={() => handleSettingChange('bodyViewMode', 'list')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider ${
                   (localProfile.settings?.bodyViewMode || 'list') === 'list' 
                     ? 'bg-white text-black shadow-sm' 
                     : 'text-text-dim hover:bg-white/5'
                 }`}
               >
                 <LayoutList size={14} /> Lista
               </button>
               <button 
                 onClick={() => handleSettingChange('bodyViewMode', 'map')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider ${
                   (localProfile.settings?.bodyViewMode || 'list') === 'map' 
                     ? 'bg-white text-black shadow-sm' 
                     : 'text-text-dim hover:bg-white/5'
                 }`}
               >
                 <Map size={14} /> Karta
               </button>
            </div>
         </div>

         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Thermometer size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-bold text-white">Logga Uppvärmning</p>
                <p className="text-[10px] text-text-dim">Räkna med värmset i stats</p>
              </div>
            </div>
            <button 
              onClick={() => handleSettingChange('includeWarmupInStats', !(localProfile.settings?.includeWarmupInStats ?? false))}
              className={`w-12 h-6 rounded-full relative transition-colors ${(localProfile.settings?.includeWarmupInStats ?? false) ? 'bg-accent-green' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(localProfile.settings?.includeWarmupInStats ?? false) ? 'left-7' : 'left-1'}`} />
            </button>
         </div>
         
         <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Smartphone size={18} className={localProfile.settings?.vibrateButtons ? "text-accent-blue" : "text-text-dim"} />
            <div>
              <p className="text-sm font-bold text-white">Vibrera vid tryck</p>
              <p className="text-[10px] text-text-dim">Känn haptisk feedback när du trycker på knappar</p>
            </div>
          </div>
          <button 
            onClick={() => handleSettingChange('vibrateButtons', !(localProfile.settings?.vibrateButtons ?? true))}
            className={`w-12 h-6 rounded-full relative transition-colors ${(localProfile.settings?.vibrateButtons ?? true) ? 'bg-accent-blue' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(localProfile.settings?.vibrateButtons ?? true) ? 'left-7' : 'left-1'}`} />
          </button>
         </div>

         <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Timer size={18} className={localProfile.settings?.vibrateTimer ? "text-accent-green" : "text-text-dim"} />
            <div>
              <p className="text-sm font-bold text-white">Vibrera vid timer slut</p>
              <p className="text-[10px] text-text-dim">Kraftig vibration när vilan är över</p>
            </div>
          </div>
          <button 
            onClick={() => handleSettingChange('vibrateTimer', !(localProfile.settings?.vibrateTimer ?? true))}
            className={`w-12 h-6 rounded-full relative transition-colors ${(localProfile.settings?.vibrateTimer ?? true) ? 'bg-accent-green' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(localProfile.settings?.vibrateTimer ?? true) ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/10 space-y-6">
        <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
          <Dumbbell className="text-accent-blue" /> Utrustning
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
                <Scale size={20} />
              </div>
              <div>
                <p className="text-sm font-black uppercase italic text-white">Skivstång</p>
                <p className="text-[10px] text-text-dim font-bold uppercase">Standardvikt (kg)</p>
              </div>
            </div>
            <input 
              type="number"
              value={localProfile.settings?.barbellWeight || 20}
              onChange={(e) => handleSettingChange('barbellWeight', Number(e.target.value))}
              className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right font-black text-accent-blue outline-none focus:border-accent-blue"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-pink/10 rounded-xl flex items-center justify-center text-accent-pink">
                <Dumbbell size={20} />
              </div>
              <div>
                <p className="text-sm font-black uppercase italic text-white">Justerbar Hantel</p>
                <p className="text-[10px] text-text-dim font-bold uppercase">Greppvikt per st (kg)</p>
              </div>
            </div>
            <input 
              type="number"
              value={localProfile.settings?.dumbbellBaseWeight || 2}
              onChange={(e) => handleSettingChange('dumbbellBaseWeight', Number(e.target.value))}
              className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right font-black text-accent-pink outline-none focus:border-accent-pink"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue">
            <Dumbbell size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic text-white">Övningsbibliotek</h3>
            <p className="text-[9px] text-text-dim uppercase font-bold tracking-widest">Exportera/Importera enbart övningar</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportLibrary}
            className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <Download size={16} /> Exportera
          </button>
          
          <label className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">
            <Upload size={16} /> Importera
            <input type="file" className="hidden" accept=".json" onChange={handleImportLibrary} />
          </label>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
          <Download size={20} className="text-accent-blue" />
          <span className="text-[10px] font-black uppercase tracking-widest">Full Backup</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
          <Upload size={20} className="text-accent-green" />
          <span className="text-[10px] font-black uppercase tracking-widest">Återställ Allt</span>
        </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

      <button 
        onClick={handleSave} 
        className="w-full py-5 bg-white text-black rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Save size={24} /> Spara Inställningar
      </button>
    </div>
  );
};