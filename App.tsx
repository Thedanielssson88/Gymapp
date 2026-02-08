
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Zone, Goal, WorkoutSession, Equipment, Exercise, MovementPattern, MuscleGroup, BodyMeasurements, BiometricLog } from './types';
import { INITIAL_ZONES } from './constants';
import { WorkoutView } from './components/WorkoutView';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { getWorkoutInsights } from './services/geminiService';
import { storage } from './services/storage';
import { calculateMuscleRecovery } from './utils/recovery';
import { RecoveryMap } from './components/RecoveryMap';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, User2, Target, Calendar, Plus, Settings, ChevronRight, History, X, BookOpen, Ruler, Zap, RotateCcw, MapPin, Check, PlusCircle, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workout' | 'body' | 'targets' | 'log' | 'library' | 'gyms'>('body');
  const [bodySubTab, setBodySubTab] = useState<'recovery' | 'measurements' | 'stats'>('recovery');
  const [user, setUser] = useState<UserProfile>(storage.getUserProfile());
  const [zones, setZones] = useState<Zone[]>(storage.getZones());
  const [history, setHistory] = useState<WorkoutSession[]>(storage.getHistory());
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>(storage.getBiometricLogs());
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(storage.getActiveSession());
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [editingZone, setEditingZone] = useState<Partial<Zone> | null>(null);

  const recoveryStatus = useMemo(() => calculateMuscleRecovery(history), [history]);
  const activeZone = useMemo(() => zones.find(z => z.id === currentSession?.zoneId) || zones[0], [zones, currentSession]);

  const handleFinishWorkout = (session: WorkoutSession, duration: number) => {
    const finalSession = { 
      ...session, 
      isCompleted: true, 
      date: new Date().toISOString(),
      duration: duration
    };
    storage.saveToHistory(finalSession);
    setHistory(storage.getHistory());
    setCurrentSession(null);
    storage.setActiveSession(null);
    setActiveTab('log');
  };

  const startNewWorkout = (zone: Zone) => {
    const newSess = { 
      id: 'w-' + Date.now(), 
      date: new Date().toISOString(), 
      name: "Morph-pass", 
      zoneId: zone.id, 
      exercises: [], 
      isCompleted: false 
    };
    setCurrentSession(newSess);
    storage.setActiveSession(newSess);
    setShowZonePicker(false);
    setActiveTab('workout');
  };

  const handleAddZone = () => {
    if (!editingZone?.name) return;
    const newZone: Zone = {
      id: editingZone.id || `zone-${Date.now()}`,
      name: editingZone.name,
      inventory: editingZone.inventory || [],
      icon: editingZone.icon || 'building'
    };
    const newZones = editingZone.id 
      ? zones.map(z => z.id === editingZone.id ? newZone : z)
      : [...zones, newZone];
    
    setZones(newZones);
    storage.saveZones(newZones);
    setEditingZone(null);
  };

  const toggleEquipment = (eq: Equipment) => {
    const current = editingZone?.inventory || [];
    const next = current.includes(eq) ? current.filter(x => x !== eq) : [...current, eq];
    setEditingZone({ ...editingZone, inventory: next });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'workout':
        if (!currentSession) return (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-8 px-8 text-center">
            <div className="w-32 h-32 bg-accent-pink/5 rounded-full flex items-center justify-center text-accent-pink">
               <Dumbbell size={64} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic">Klar för kamp?</h2>
              <p className="text-text-dim font-bold">Välj din miljö för att optimera passet.</p>
            </div>
            <button onClick={() => setShowZonePicker(true)} className="bg-accent-pink w-full py-6 rounded-3xl font-black italic tracking-widest uppercase shadow-[0_10px_40px_rgba(255,45,85,0.3)] text-xl">Välj Gym & Starta</button>
          </div>
        );
        return <WorkoutView session={currentSession} activeZone={activeZone} onZoneChange={(z) => setCurrentSession({...currentSession, zoneId: z.id})} onComplete={handleFinishWorkout} />;
      
      case 'gyms':
        return (
          <div className="space-y-6 animate-in slide-in-from-right px-2 pt-6 pb-32">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase italic">Mina Gym</h2>
              <button onClick={() => setEditingZone({ name: '', inventory: [], icon: 'building' })} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-accent-pink">
                <Plus size={24} />
              </button>
            </header>
            <div className="space-y-4">
              {zones.map(z => (
                <div key={z.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><MapPin size={24} className="text-accent-pink" /></div>
                    <div>
                      <h4 className="font-black text-xl uppercase italic leading-none">{z.name}</h4>
                      <p className="text-[10px] font-black text-text-dim uppercase mt-1 tracking-widest">{z.inventory.length} utrustningar</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingZone(z)} className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-white transition-all"><Settings size={18}/></button>
                    {zones.length > 1 && (
                      <button onClick={() => {if(confirm("Radera gym?")){const n=zones.filter(x=>x.id!==z.id); setZones(n); storage.saveZones(n);}}} className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'body':
        return (
          <div className="space-y-6 animate-in fade-in px-2 pb-32 min-h-screen">
            <nav className="flex items-center justify-center gap-10 pt-8 border-b border-white/5 pb-4">
              <button onClick={() => setBodySubTab('recovery')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${bodySubTab === 'recovery' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}>Recovery</button>
              <button onClick={() => setBodySubTab('measurements')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${bodySubTab === 'measurements' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}>Mått</button>
              <button onClick={() => setBodySubTab('stats')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${bodySubTab === 'stats' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}>Stats</button>
            </nav>

            {bodySubTab === 'recovery' && (
              <div className="animate-in zoom-in-95">
                <RecoveryMap status={recoveryStatus} size="lg" />
                <div className="bg-white/2 p-6 rounded-[40px] border border-white/5 mt-8 text-center">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] mb-2">Din dagsform</p>
                  <p className="text-4xl font-black italic text-white uppercase tracking-tighter">Peak Performance</p>
                </div>
              </div>
            )}
            {/* stats & measurements kept same but styled slightly tighter */}
            {bodySubTab === 'stats' && (
               <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={biometricLogs.map(l => ({ d: new Date(l.date).toLocaleDateString(), w: l.weight }))}>
                      <Area type="monotone" dataKey="w" stroke="#ff2d55" fill="#ff2d55" fillOpacity={0.1} strokeWidth={4} />
                      <XAxis dataKey="d" hide />
                      <YAxis hide />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
            )}
          </div>
        );

      case 'log':
        return (
          <div className="space-y-6 animate-in slide-in-from-right px-2 pt-6 pb-32">
             <h2 className="text-3xl font-black uppercase italic">Träningslogg</h2>
             {history.slice().reverse().map(h => (
               <div key={h.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex gap-6">
                  <div className="w-12 h-12 bg-accent-pink/10 rounded-2xl flex items-center justify-center text-accent-pink"><Calendar size={24}/></div>
                  <div className="flex-1">
                     <div className="flex justify-between">
                        <h4 className="font-black text-lg uppercase italic">{h.name}</h4>
                        <span className="text-[10px] font-black text-text-dim uppercase">{new Date(h.date).toLocaleDateString()}</span>
                     </div>
                     <p className="text-text-dim text-xs font-bold uppercase mt-1">{h.exercises.length} övningar • {h.duration ? Math.floor(h.duration/60) : 0} min</p>
                  </div>
               </div>
             ))}
          </div>
        );

      case 'library': return <ExerciseLibrary />;
      case 'targets': return <div className="p-10 text-center opacity-30 font-black italic uppercase">Målsättning kommer snart</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0f0d15] selection:bg-accent-pink selection:text-white relative overflow-x-hidden">
      {renderContent()}

      {/* ZONE PICKER OVERLAY */}
      {showZonePicker && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-2xl z-[150] p-8 flex flex-col items-center justify-center">
          <button onClick={() => setShowZonePicker(false)} className="absolute top-8 right-8 text-text-dim"><X size={32}/></button>
          <h3 className="text-4xl font-black uppercase italic mb-10 tracking-tighter">Vart tränar du idag?</h3>
          <div className="grid grid-cols-1 w-full gap-4">
            {zones.map(z => (
              <button 
                key={z.id} 
                onClick={() => startNewWorkout(z)}
                className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex items-center justify-between group active:scale-95 transition-all hover:border-accent-pink/50"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center group-hover:bg-accent-pink/10 transition-all">
                    <MapPin size={32} className="group-hover:text-accent-pink transition-all" />
                  </div>
                  <span className="text-2xl font-black uppercase italic">{z.name}</span>
                </div>
                <ChevronRight size={32} className="text-text-dim" />
              </button>
            ))}
          </div>
          <button onClick={() => { setActiveTab('gyms'); setShowZonePicker(false); }} className="mt-10 text-[10px] font-black uppercase tracking-[0.4em] text-accent-pink underline underline-offset-8">Hantera mina gym</button>
        </div>
      )}

      {/* ZONE EDITOR MODAL */}
      {editingZone && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[160] p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black uppercase italic">Gym-setup</h3>
            <button onClick={() => setEditingZone(null)} className="p-2 bg-white/5 rounded-full"><X size={32}/></button>
          </div>
          <div className="space-y-8 pb-20">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Gymmets namn</label>
              <input 
                type="text" 
                value={editingZone.name} 
                onChange={e => setEditingZone({...editingZone, name: e.target.value})}
                placeholder="Ex: Sats Odenplan"
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 font-black text-xl outline-none focus:border-accent-pink"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Tillgänglig utrustning</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Equipment).map(e => (
                  <button 
                    key={e}
                    onClick={() => toggleEquipment(e)}
                    className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${editingZone.inventory?.includes(e) ? 'bg-accent-pink border-accent-pink' : 'bg-white/5 border-white/5 text-text-dim'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleAddZone} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-widest shadow-2xl flex items-center justify-center gap-2">
              <Check size={20} /> Spara Gym
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0d15]/80 backdrop-blur-3xl border-t border-white/5 z-[100] max-w-md mx-auto px-4 pb-12 pt-4">
        <div className="flex justify-between items-center">
          <NavButton active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} icon={<Dumbbell size={24} />} label="Träning" />
          <NavButton active={activeTab === 'body'} onClick={() => setActiveTab('body')} icon={<User2 size={24} />} label="Kropp" />
          <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<BookOpen size={24} />} label="Övningar" />
          <NavButton active={activeTab === 'gyms'} onClick={() => setActiveTab('gyms')} icon={<MapPin size={24} />} label="Gym" />
          <NavButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<Calendar size={24} />} label="Logg" />
        </div>
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all flex-1 ${active ? 'text-white' : 'text-text-dim'}`}>
    <div className={`p-1.5 transition-all ${active ? 'text-accent-pink scale-110 drop-shadow-[0_0_10px_rgba(255,45,85,0.5)]' : ''}`}>{icon}</div>
    <span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);
