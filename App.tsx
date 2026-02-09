import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Zone, WorkoutSession, Exercise, BiometricLog, PlannedExercise, GoalTarget, WorkoutRoutine, ScheduledActivity, RecurringPlan } from './types';
import { WorkoutView } from './components/WorkoutView';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutLog } from './components/WorkoutLog';
import { TargetsView } from './components/TargetsView';
import { RoutinePicker } from './components/RoutinePicker';
import { StatsView } from './components/StatsView';
import { MeasurementsView } from './components/MeasurementsView';
import { LocationManager } from './components/LocationManager';
import { storage } from './services/storage';
import { calculateMuscleRecovery } from './utils/recovery';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SettingsView } from './components/SettingsView';
import { Dumbbell, User2, Target, Calendar, X, BookOpen, MapPin, Activity, Home, Trees, ChevronRight, Settings } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'workout' | 'body' | 'targets' | 'log' | 'library' | 'gyms'>('body');
  const [bodySubTab, setBodySubTab] = useState<'recovery' | 'measurements' | 'analytics' | 'settings'>('recovery');
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [goalTargets, setGoalTargets] = useState<GoalTarget[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<ScheduledActivity[]>([]);

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [selectedZoneForStart, setSelectedZoneForStart] = useState<Zone | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const refreshData = async () => {
    const [p, z, h, logs, sess, ex, gt, r, plans] = await Promise.all([
      storage.getUserProfile(),
      storage.getZones(),
      storage.getHistory(),
      storage.getBiometricLogs(),
      storage.getActiveSession(),
      storage.getAllExercises(),
      storage.getGoalTargets(),
      storage.getRoutines(),
      storage.getScheduledActivities()
    ]);

    if (z.length === 0 || p.name === "Atlet") {
       setShowOnboarding(true);
    } else {
       setShowOnboarding(false);
    }

    setUser(p);
    setZones(z);
    setHistory(h);
    setBiometricLogs(logs);
    setCurrentSession(sess || null);
    setAllExercises(ex);
    setGoalTargets(gt);
    setRoutines(r);
    setPlannedActivities(plans);
  };

  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      await refreshData();
      setIsReady(true);
    };
    initApp();
  }, []);

  const activeZone = useMemo(() => zones.find(z => z.id === (currentSession?.zoneId || selectedZoneForStart?.id)) || zones[0], [zones, currentSession, selectedZoneForStart]);

  const handleFinishWorkout = async (session: WorkoutSession, duration: number) => {
    try {
      await storage.saveToHistory({ ...session, isCompleted: true, date: new Date().toISOString(), duration });
      await storage.setActiveSession(null);
      await refreshData();
      setActiveTab('log');
    } catch (error) {
      console.error("Kunde inte spara passet:", error);
      alert("Ett fel uppstod när passet skulle sparas. Försök igen.");
    }
  };

  const handleCancelWorkout = async () => {
    await storage.setActiveSession(null);
    setCurrentSession(null);
    setActiveTab('workout');
  };

  const handleStartWorkout = async (exercises: PlannedExercise[], name: string) => {
    const zone = selectedZoneForStart || zones[0];
    const newSess: WorkoutSession = { 
      id: 'w-' + Date.now(), 
      date: new Date().toISOString(), 
      name, 
      zoneId: zone.id, 
      exercises, 
      isCompleted: false 
    };
    await storage.setActiveSession(newSess);
    await refreshData();
    setShowStartMenu(false);
    setSelectedZoneForStart(null);
    setActiveTab('workout');
  };

  const handleAddPlan = async (activity: ScheduledActivity, isRecurring: boolean, days?: number[]) => {
    if (isRecurring && days) {
      const plan: RecurringPlan = {
        id: `rec-${Date.now()}`,
        type: activity.type,
        title: activity.title,
        daysOfWeek: days,
        startDate: activity.date,
        exercises: activity.exercises
      };
      await storage.addRecurringPlan(plan);
    } else {
      await storage.addScheduledActivity(activity);
    }
    await refreshData();
  };

  const handleTogglePlan = async (id: string) => {
    await storage.toggleScheduledActivity(id);
    await refreshData();
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm("Ta bort planering?")) {
      await storage.deleteScheduledActivity(id);
      await refreshData();
    }
  };

  if (!isReady || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f0d15] text-white">
        <div className="relative"><div className="w-24 h-24 border-4 border-accent-pink/20 border-t-accent-pink rounded-full animate-spin"></div><Activity className="absolute inset-0 m-auto text-accent-pink animate-pulse" size={32} /></div>
        <h1 className="mt-8 text-2xl font-black uppercase italic tracking-[0.3em] animate-pulse">MorphFit</h1>
      </div>
    );
  }

  const isWorkoutActive = activeTab === 'workout' && currentSession;

  const renderContent = () => {
    switch (activeTab) {
      case 'workout':
        if (!currentSession) return (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-8 px-8 text-center">
            <div className="w-32 h-32 bg-accent-pink/5 rounded-full flex items-center justify-center text-accent-pink"><Dumbbell size={64} className="animate-bounce" /></div>
            <div className="space-y-2"><h2 className="text-3xl font-black uppercase italic">Klar för kamp?</h2><p className="text-text-dim font-bold">Välj din miljö för att optimera passet.</p></div>
            <button onClick={() => setShowStartMenu(true)} className="bg-accent-pink w-full py-6 rounded-3xl font-black italic tracking-widest uppercase shadow-2xl text-xl">Starta Pass</button>
          </div>
        );
        return <WorkoutView 
                  key={currentSession.id}
                  session={currentSession}
                  allExercises={allExercises}
                  userProfile={user}
                  allZones={zones}
                  history={history}
                  activeZone={activeZone}
                  onZoneChange={async (z) => {
                    if (currentSession) {
                      const newSession = {...currentSession, zoneId: z.id};
                      setCurrentSession(newSession);
                      await storage.setActiveSession(newSession);
                    }
                  }} 
                  onComplete={handleFinishWorkout} 
                  onCancel={handleCancelWorkout} 
               />;
      case 'body':
        return (
          <div className="space-y-6 animate-in fade-in px-2 pb-32 min-h-screen">
            <nav className="flex items-center justify-center gap-4 pt-8 border-b border-white/5 pb-4 px-2">
              <button 
                onClick={() => setBodySubTab('recovery')} 
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all ${bodySubTab === 'recovery' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}
              >
                Återhämtning
              </button>
              <button 
                onClick={() => setBodySubTab('measurements')} 
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all ${bodySubTab === 'measurements' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}
              >
                Mått
              </button>
              <button 
                onClick={() => setBodySubTab('analytics')} 
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all ${bodySubTab === 'analytics' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}
              >
                Statistik
              </button>
              <button 
                onClick={() => setBodySubTab('settings')} 
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all ${bodySubTab === 'settings' ? 'text-accent-pink scale-110' : 'text-text-dim'}`}
              >
                 <Settings size={16} />
              </button>
            </nav>
            {(bodySubTab === 'recovery' || bodySubTab === 'analytics') && (
              <StatsView 
                logs={biometricLogs} 
                history={history} 
                allExercises={allExercises} 
                userProfile={user} 
                onUpdateProfile={refreshData}
                initialMode={bodySubTab === 'analytics' ? 'analytics' : 'recovery'}
              />
            )}
            {bodySubTab === 'measurements' && <MeasurementsView profile={user} onUpdate={refreshData} />}
            {bodySubTab === 'settings' && user && ( <SettingsView userProfile={user} onUpdate={refreshData} /> )}
          </div>
        );
      case 'log': return <WorkoutLog history={history} plannedActivities={plannedActivities} routines={routines} allExercises={allExercises} onAddPlan={handleAddPlan} onTogglePlan={handleTogglePlan} onDeletePlan={handleDeletePlan} />;
      case 'targets': return <TargetsView history={history} goalTargets={goalTargets} allExercises={allExercises} />;
      case 'library': return <ExerciseLibrary allExercises={allExercises} onUpdate={refreshData} />;
      case 'gyms': return <LocationManager zones={zones} onUpdate={refreshData} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0f0d15] selection:bg-accent-pink selection:text-white relative overflow-x-hidden">
      {showOnboarding && isReady && (
        <OnboardingWizard onComplete={() => {
           setShowOnboarding(false);
           refreshData();
        }} />
      )}

      {renderContent()}
      
      {showStartMenu && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-8 flex flex-col overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black uppercase italic tracking-tighter">{selectedZoneForStart ? 'Välj Rutin' : 'Vart tränar du?'}</h3><button onClick={() => { setShowStartMenu(false); setSelectedZoneForStart(null); }} className="text-text-dim p-2"><X size={32}/></button></header>
          {!selectedZoneForStart ? (
            <div className="grid grid-cols-1 w-full gap-4">
              {zones.map(z => (<button key={z.id} onClick={() => setSelectedZoneForStart(z)} className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex items-center justify-between group active:scale-95 transition-all"><div className="flex items-center gap-6"><div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center">{z.name.toLowerCase().includes('hem') ? <Home size={32} /> : z.name.toLowerCase().includes('ute') ? <Trees size={32} /> : <MapPin size={32} />}</div><span className="text-2xl font-black uppercase italic tracking-tight">{z.name}</span></div><ChevronRight size={32} className="text-text-dim" /></button>))}
            </div>
          ) : (
            <RoutinePicker onStart={handleStartWorkout} activeZone={selectedZoneForStart} allExercises={allExercises} userProfile={user} routines={routines} onUpdate={refreshData} />
          )}
        </div>
      )}

      {!isWorkoutActive && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0d15]/80 backdrop-blur-3xl border-t border-white/5 z-[100] max-w-md mx-auto px-4 pb-12 pt-4">
          <div className="flex justify-between items-center">
            <NavButton active={activeTab === 'workout'} onClick={() => setActiveTab('workout')} icon={<Dumbbell size={24} />} label="Träning" />
            <NavButton active={activeTab === 'gyms'} onClick={() => setActiveTab('gyms')} icon={<MapPin size={24} />} label="Platser" />
            <NavButton active={activeTab === 'body'} onClick={() => setActiveTab('body')} icon={<User2 size={24} />} label="Kropp" />
            <NavButton active={activeTab === 'targets'} onClick={() => setActiveTab('targets')} icon={<Target size={24} />} label="Mål" />
            <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<BookOpen size={24} />} label="Övningar" />
            <NavButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<Calendar size={24} />} label="Logg" />
          </div>
        </nav>
      )}
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (<button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all flex-1 ${active ? 'text-white' : 'text-text-dim'}`}><div className={`p-1.5 transition-all ${active ? 'text-accent-pink scale-110 drop-shadow-[0_0_10px_rgba(255,45,85,0.5)]' : ''}`}>{icon}</div><span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span></button>);