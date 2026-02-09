import React, { useState, useRef } from 'react';
import { UserProfile, Goal, MuscleGroup } from '../types';
import { storage } from '../services/storage';
import { db } from '../services/db';
import { Save, Download, Upload, Trash2, Smartphone, LayoutList, Map, Thermometer } from 'lucide-react';
import Dexie from 'dexie';

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
    const updatedProfile: UserProfile = {
      ...localProfile,
      settings: {
        ...localProfile.settings,
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

  return (
    <div className="space-y-8 pb-20 px-2">
      <section className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 space-y-6">
         <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
            <Smartphone className="text-accent-blue" /> Appupplevelse
         </h3>

         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
               {bodyViewMode === 'list' ? <LayoutList size={18} className="text-text-dim"/> : <Map size={18} className="text-text-dim"/>}
               <div>
                  <p className="text-sm font-bold text-white">Kroppsvy</p>
                  <p className="text-[10px] text-text-dim">Hur vill du se din status?</p>
               </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               <button onClick={() => setBodyViewMode('list')} className={`p-2 rounded-lg transition-all ${bodyViewMode === 'list' ? 'bg-white/10 text-white' : 'text-text-dim'}`}><LayoutList size={16} /></button>
               <button onClick={() => setBodyViewMode('map')} className={`p-2 rounded-lg transition-all ${bodyViewMode === 'map' ? 'bg-white/10 text-white' : 'text-text-dim'}`}><Map size={16} /></button>
            </div>
         </div>

         <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Thermometer size={18} className="text-text-dim" />
              <div><p className="text-sm font-bold text-white">Logga Uppvärmning</p><p className="text-[10px] text-text-dim">Räkna med värmset i stats</p></div>
            </div>
            <button onClick={() => setIncludeWarmup(!includeWarmup)} className={`w-12 h-6 rounded-full relative transition-colors ${includeWarmup ? 'bg-accent-green' : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeWarmup ? 'left-7' : 'left-1'}`} /></button>
         </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExport} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2"><Download size={20} className="text-accent-blue" /><span className="text-[10px] font-black uppercase">Backup</span></button>
        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2"><Upload size={20} className="text-accent-green" /><span className="text-[10px] font-black uppercase">Återställ</span></button>
      </div>

      <button onClick={handleSave} className="w-full py-5 bg-white text-black rounded-[24px] font-black italic text-xl uppercase tracking-widest flex items-center justify-center gap-3"><Save size={24} /> Spara</button>
    </div>
  );
};