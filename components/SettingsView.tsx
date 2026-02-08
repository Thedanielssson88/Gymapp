import React, { useState, useRef } from 'react';
import { UserProfile, Goal } from '../types';
import { storage } from '../services/storage';
import { db } from '../services/db'; // Direktåtkomst till DB för backup
import { Save, Download, Upload, Trash2, User, Volume2, Smartphone, Timer, AlertTriangle } from 'lucide-react';
// FIX: Add Dexie import for type casting.
import Dexie from 'dexie';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdate: () => void; // Ladda om App.tsx efter ändringar
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdate }) => {
  const [localProfile, setLocalProfile] = useState(userProfile);
  // Lokala preferenser (kan sparas i localStorage för enkelhetens skull)
  const [restTimer, setRestTimer] = useState(localStorage.getItem('pref_restTimer') || '90');
  const [keepAwake, setKeepAwake] = useState(localStorage.getItem('pref_keepAwake') === 'true');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. PROFIL & SPARANDE ---
  const handleSaveProfile = async () => {
    await storage.setUserProfile(localProfile);
    
    // Spara preferenser
    localStorage.setItem('pref_restTimer', restTimer);
    localStorage.setItem('pref_keepAwake', String(keepAwake));
    
    onUpdate();
    alert("Inställningar sparade!");
  };

  // --- 2. DATAHANTERING (BACKUP) ---
  const handleExport = async () => {
    try {
      const allData = {
        profile: await db.userProfile.toArray(),
        history: await db.workoutHistory.toArray(),
        zones: await db.zones.toArray(),
        exercises: await db.exercises.toArray(),
        logs: await db.biometricLogs.toArray(),
        routines: await db.workoutRoutines.toArray(),
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(allData)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphfit_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Kunde inte skapa backup: " + e);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm("VARNING: Detta kommer att ersätta all din nuvarande data med innehållet i filen. Är du säker?")) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Transaktion för att nollställa och återställa
        // FIX: Cast `db` to Dexie to access transaction and tables properties.
        await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
          // FIX: Cast `db` to Dexie to access tables property.
          await Promise.all((db as Dexie).tables.map(table => table.clear()));
          
          if (data.profile) await db.userProfile.bulkAdd(data.profile);
          if (data.history) await db.workoutHistory.bulkAdd(data.history);
          if (data.zones) await db.zones.bulkAdd(data.zones);
          if (data.exercises) await db.exercises.bulkAdd(data.exercises);
          if (data.logs) await db.biometricLogs.bulkAdd(data.logs);
          if (data.routines) await db.workoutRoutines.bulkAdd(data.routines);
        });
        
        alert("Data återställd! Appen laddas om.");
        window.location.reload();
      } catch (e) {
        alert("Import misslyckades. Filen kan vara skadad.");
      }
    }
  };

  // --- 3. RADERA KONTO ---
  const handleDeleteAccount = async () => {
    const confirmText = prompt("Skriv 'RADERA' för att permanent ta bort all historik, profil och inställningar. Detta kan inte ångras.");
    if (confirmText === 'RADERA') {
      // FIX: Cast `db` to Dexie to access tables property.
      await Promise.all((db as Dexie).tables.map(table => table.clear()));
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-20">
      
      {/* SEKTION: PROFIL */}
      <section className="bg-[#1a1721] rounded-3xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent-pink flex items-center gap-2">
          <User size={14} /> Min Profil
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-text-dim block mb-1">Namn</label>
            <input 
              type="text" 
              value={localProfile.name}
              onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-accent-pink"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-text-dim block mb-1">Träningsmål</label>
            <div className="flex gap-2">
              {[Goal.HYPERTROPHY, Goal.STRENGTH].map(g => (
                <button
                  key={g}
                  onClick={() => setLocalProfile({...localProfile, goal: g})}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                    localProfile.goal === g 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent border-white/10 text-text-dim'
                  }`}
                >
                  {g === Goal.HYPERTROPHY ? 'Bygga Muskel' : 'Styrka'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEKTION: PREFERENSER */}
      <section className="bg-[#1a1721] rounded-3xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent-blue flex items-center gap-2">
          <Volume2 size={14} /> App & Träning
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Timer size={18} className="text-text-dim" />
            <div>
              <p className="text-sm font-bold text-white">Standard Viletid</p>
              <p className="text-[10px] text-text-dim">Startvärde för timern</p>
            </div>
          </div>
          <select 
            value={restTimer}
            onChange={(e) => setRestTimer(e.target.value)}
            className="bg-white/5 text-white text-xs font-bold py-2 px-4 rounded-lg outline-none"
          >
            <option value="60">60 sek</option>
            <option value="90">90 sek</option>
            <option value="120">120 sek</option>
            <option value="180">180 sek</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Smartphone size={18} className="text-text-dim" />
            <div>
              <p className="text-sm font-bold text-white">Vaken Skärm</p>
              <p className="text-[10px] text-text-dim">Förhindra att mobilen släcks</p>
            </div>
          </div>
          <button 
            onClick={() => setKeepAwake(!keepAwake)}
            className={`w-12 h-6 rounded-full relative transition-colors ${keepAwake ? 'bg-accent-green' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${keepAwake ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* SEKTION: DATAHANTERING */}
      <section className="bg-[#1a1721] rounded-3xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
          <Save size={14} /> Data & Säkerhet
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
            <Download size={20} className="text-accent-blue" />
            <span className="text-[10px] font-black uppercase">Spara Backup</span>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
            <Upload size={20} className="text-accent-green" />
            <span className="text-[10px] font-black uppercase">Återställ</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
        </div>

        <div className="pt-4 border-t border-white/5">
          <button onClick={handleDeleteAccount} className="w-full py-4 flex items-center justify-center gap-2 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <Trash2 size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Radera Konto</span>
          </button>
          <p className="text-[9px] text-red-500/50 text-center mt-2">Detta raderar all data permanent.</p>
        </div>
      </section>

      {/* SPARA KNAPP */}
      <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto">
        <button 
          onClick={handleSaveProfile}
          className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Spara Ändringar
        </button>
      </div>
    </div>
  );
};
