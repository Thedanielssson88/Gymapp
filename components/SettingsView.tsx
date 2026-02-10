
import React, { useState, useRef } from 'react';
import { UserProfile, Goal } from '../types';
import { storage, exportExerciseLibrary, importExerciseLibrary } from '../services/storage';
import { db } from '../services/db';
import { Save, Download, Upload, Smartphone, LayoutList, Map, Thermometer, Dumbbell } from 'lucide-react';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdate: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdate }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [bodyViewMode, setBodyViewMode] = useState<'list' | 'map'>(userProfile.settings?.bodyViewMode || 'list');
  const [includeWarmup, setIncludeWarmup] = useState(userProfile.settings?.includeWarmupInStats ?? false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    // Prevent settings loss by merging current state
    const currentSettings = localProfile.settings || { includeWarmupInStats: false };
    
    const updatedProfile: UserProfile = {
      ...localProfile,
      settings: {
        ...currentSettings,
        includeWarmupInStats: includeWarmup,
        bodyViewMode: bodyViewMode
      }
    };
    
    await storage.setUserProfile(updatedProfile);
    onUpdate();
    alert("Inställningar sparade!");
  };

  const handleExport = async () => {
    const allData = {
      profile: await db.userProfile.toArray(),
      history: await db.workoutHistory.toArray(),
      zones: await db.zones.toArray(),
      exercises: await db.exercises.toArray(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morphfit_backup.json`;
    a.click();
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
      onUpdate(); // Anropa onUpdate för att ladda om datan i appen
    } catch (err: any) {
      alert("Ett fel uppstod vid importen: " + err.message);
    }
  };


  return (
    <div className="space-y-8 pb-32 px-2 animate-in fade-in">
      
      {/* BASIC INFO SECTION */}
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

      {/* PREFERENCES SECTION */}
      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-6">
         <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
            <Smartphone className="text-accent-blue" /> Appupplevelse
         </h3>

         {/* VISNINGSLÄGE FÖR KROPP */}
         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
               {bodyViewMode === 'list' ? <LayoutList size={18} className="text-white"/> : <Map size={18} className="text-white"/>}
               <div>
                  <p className="text-sm font-bold text-white">Kroppsvy</p>
                  <p className="text-[10px] text-text-dim">Hur vill du se din status?</p>
               </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               <button 
                 onClick={() => setBodyViewMode('list')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider ${
                   bodyViewMode === 'list' 
                     ? 'bg-white text-black shadow-sm' 
                     : 'text-text-dim hover:text-white'
                 }`}
               >
                 <LayoutList size={14} /> Lista
               </button>
               <button 
                 onClick={() => setBodyViewMode('map')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider ${
                   bodyViewMode === 'map' 
                     ? 'bg-white text-black shadow-sm' 
                     : 'text-text-dim hover:text-white'
                 }`}
               >
                 <Map size={14} /> Karta
               </button>
            </div>
         </div>

         {/* UPPVÄRMNING */}
         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Thermometer size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-bold text-white">Logga Uppvärmning</p>
                <p className="text-[10px] text-text-dim">Räkna med värmset i stats</p>
              </div>
            </div>
            <button 
              onClick={() => setIncludeWarmup(!includeWarmup)}
              className={`w-12 h-6 rounded-full relative transition-colors ${includeWarmup ? 'bg-accent-green' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeWarmup ? 'left-7' : 'left-1'}`} />
            </button>
         </div>
      </section>

      {/* LIBRARY DATA ACTIONS */}
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

      {/* ALL DATA ACTIONS */}
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
      <input type="file" ref={fileInputRef} className="hidden" />

      {/* SAVE BUTTON */}
      <button 
        onClick={handleSave} 
        className="w-full py-5 bg-white text-black rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Save size={24} /> Spara Inställningar
      </button>
    </div>
  );
};
