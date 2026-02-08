
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Zone, Goal, WorkoutSession, Equipment, Exercise, MovementPattern, MuscleGroup, BodyMeasurements, BiometricLog, PlannedExercise } from './types';
import { INITIAL_ZONES } from './constants';
import { WorkoutView } from './components/WorkoutView';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutLog } from './components/WorkoutLog';
import { TargetsView } from './components/TargetsView';
import { RoutinePicker } from './components/RoutinePicker';
import { StatsView } from './components/StatsView';
import { MeasurementsView } from './components/MeasurementsView';
import { storage } from './services/storage';
import { calculateMuscleRecovery } from './utils/recovery';
import { RecoveryMap } from './components/RecoveryMap';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, User2, Target, Calendar, Plus, Settings, ChevronRight, History, X, BookOpen, MapPin, Check, Activity } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'workout' | 'body' | 'targets' | 'log' | 'library' | 'gyms'>('body');
  const [bodySubTab, setBodySubTab] = useState<'recovery' | 'measurements' | 'stats'>('recovery');
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [selectedZoneForStart, setSelectedZoneForStart] = useState<Zone | null>(null);

  const refreshData = () => {
    setUser(storage.getUserProfile());
    setZones(storage.getZones());
    setHistory(storage.getHistory());
    setBiometricLogs(storage.getBiometricLogs());
    setCurrentSession(storage.getActiveSession());
  };

  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      refreshData();
      setTimeout(() => setIsReady(true), 1200);
    };
    initApp();
  }, []);

  const recoveryStatus = useMemo(() => calculateMuscleRecovery(history), [history]);
  const activeZone = useMemo(() => zones.find(z => z.id === (currentSession?.zoneId || selectedZoneForStart?.id)) || zones[0], [zones, currentSession, selectedZoneForStart]);

  const handleFinishWorkout = (session: WorkoutSession, duration: number) => {
    const finalSession = { ...session, isCompleted: true, date: new Date().toISOString(), duration };
    storage.saveToHistory(finalSession);
    refreshData();
    setCurrentSession(null);
    storage.setActiveSession(null);
    setActiveTab('log');
  };

  const handleCancelWorkout = () => {
    setCurrentSession(null);
    storage.setActiveSession(null);
    setActiveTab('body');
  };

  const handleStartWorkout = (exercises: PlannedExercise[], name: string) => {
    const zone = selectedZoneForStart || zones[0];
    const newSess = { 
      id: 'w-' + Date.now(), 
      date: new Date().toISOString(), 
      name, 
      zoneId: zone.id, 
      exercises, 
      isCompleted: false 
    };
    setCurrentSession(newSess);
    storage.setActiveSession(newSess);
    setShowStartMenu(false);
    setSelectedZoneForStart(null);
    setActiveTab('workout');
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f0d15] text-white">
        <div className="relative"><div className="w-24 h-24 border-4 border-accent-pink/20 border-t-accent-pink rounded-full animate-spin"></div><Activity className="absolute inset-0 m-auto text-accent-pink animate-pulse" size={32} /></div>
        <h1 className="mt-8 text-2xl font-black uppercase italic tracking-[0.3em] animate-pulse">MorphFit</h1>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'workout':
        if (!currentSession) return (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-8 px-8 text-center">
            <div className="w-32 h-32 bg-accent-pink/5 rounded-full flex items-center justify-center text-accent-pink"><Dumbbell size={64} className="animate-bounce" /></div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic">Klar för kamp?</h2>
              <p className="text-text-dim font-bold">Välj din miljö för att optimera passet.</p>
            </div>
            <button onClick={() => setShowStartMenu(true)} className="bg-accent-pink w-full py-6 rounded-3xl font-black italic tracking-widest uppercase shadow-2xl text-xl">Starta Pass</button>
          </div>
        );
        return <WorkoutView session={currentSession} activeZone={activeZone} onZoneChange={(z) => setCurrentSession({...currentSession, zoneId: z.id})} onComplete={handleFinishWorkout} onCancel={handleCancelWorkout} />;
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
            {bodySubTab === 'measurements' && user && (
              <MeasurementsView profile={user} onUpdate={refreshData} />
            )}
            {bodySubTab === 'stats' && (
               <StatsView logs={biometricLogs} history={history} />
            )}
          </div>
        );
      case 'log': return <WorkoutLog history={history} />;
      case 'targets': return <TargetsView history={history} />;
      case 'library': return <ExerciseLibrary />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0f0d15] selection:bg-accent-pink selection:text-white relative overflow-x-hidden">
      {renderContent()}

      {/* START WORKOUT FLOW (ZONE -> ROUTINE) */}
      {showStartMenu && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-8 flex flex-col overflow-y-auto">
          <header className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">{selectedZoneForStart ? 'Välj Rutin' : 'Vart tränar du?'}</h3>
            <button onClick={() => { setShowStartMenu(false); setSelectedZoneForStart(null); }} className="text-text-dim"><X size={32}/></button>
          </header>

          {!selectedZoneForStart ? (
            <div className="grid grid-cols-1 w-full gap-4">
              {zones.map(z => (
                <button key={z.id} onClick={() => setSelectedZoneForStart(z)} className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex items-center justify-between group active:scale-95 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center"><MapPin size={32} /></div>
                    <span className="text-2xl font-black uppercase italic">{z.name}</span>
                  </div>
                  <ChevronRight size={32} className="text-text-dim" />
                </button>
              ))}
            </div>
          ) : (
            <RoutinePicker onStart={handleStartWorkout} activeZone={selectedZoneForStart} />
          )}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0d15]/80 backdrop-blur-3xl border-t border-white/5 z-[100] max-w-md mx-auto px-4 pb-12 pt-4">
        <div className="flex justify-between items-center">
          <NavButton active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} icon={<Dumbbell size={24} />} label="Träning" />
          <NavButton active={activeTab === 'body'} onClick={() => setActiveTab('body')} icon={<User2 size={24} />} label="Kropp" />
          <NavButton active={activeTab === 'targets'} onClick={() => setActiveTab('targets')} icon={<Target size={24} />} label="Mål" />
          <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<BookOpen size={24} />} label="Övningar" />
          <NavButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<Calendar size={24} />} label="Logg" />
        </div>
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={onClick} className={`flex flex