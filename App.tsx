
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Zone, WorkoutSession, Exercise, BiometricLog, PlannedExercise, GoalTarget, WorkoutRoutine, ScheduledActivity, RecurringPlan, PlannedActivityForLogDisplay, UserMission, BodyMeasurements } from './types';
import { WorkoutView } from './components/WorkoutView';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutLog } from './components/WorkoutLog';
import { TargetsView } from './components/TargetsView';
import { RoutinePicker } from './components/RoutinePicker';
import { StatsView } from './components/StatsView';
import { MeasurementsView } from './components/MeasurementsView';
import { LocationManager } from './components/LocationManager';
import { storage } from './services/storage';
import { db } from './services/db'; // Importera db
import { calculateMuscleRecovery } from './utils/recovery';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SettingsView } from './components/SettingsView';
import { Dumbbell, User2, Target, Calendar, X, BookOpen, MapPin, Activity, Home, Trees, ChevronRight, Settings, Trophy } from 'lucide-react'; // Import Trophy
import { calculate1RM, getLastPerformance } from './utils/fitness';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initierar...');
  const [activeTab, setActiveTab] = useState<'workout' | 'body' | 'targets' | 'log' | 'library' | 'gyms'>('workout');
  const [bodySubTab, setBodySubTab] = useState<'recovery' | 'measurements' | 'analytics' | 'settings'>('recovery');
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [goalTargets, setGoalTargets] = useState<GoalTarget[]>([]); // Keeping existing goalTargets
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivityForLogDisplay[]>([]); 
  const [userMissions, setUserMissions] = useState<UserMission[]>([]); // NEW: State for gamified user missions

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [selectedZoneForStart, setSelectedZoneForStart] = useState<Zone | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const globalStyles = `
    :root {
      --safe-area-top: env(safe-area-inset-top);
      --safe-area-bottom: env(safe-area-inset-bottom);
    }

    body {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      min-height: 100vh;
      box-sizing: border-box;
      background-color: #0f0d15;
    }

    .fixed-bottom-nav {
      padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
    }
  `;

  useEffect(() => {
    const initNativeHardware = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: '#1a1721' });
          await StatusBar.setStyle({ style: Style.Dark });
        } catch (e) {
          console.warn('Statusbar kunde inte konfigureras:', e);
        }
      }
    };

    initNativeHardware();
  }, []);

  const refreshData = async () => {
    const [p, z, h, logs, sess, ex, gt, r, scheduled, recurring, missions] = await Promise.all([
      storage.getUserProfile(),
      storage.getZones(),
      storage.getHistory(),
      storage.getBiometricLogs(),
      storage.getActiveSession(),
      storage.getAllExercises(),
      storage.getGoalTargets(),
      storage.getRoutines(),
      storage.getScheduledActivities(),
      storage.getRecurringPlans(),
      storage.getUserMissions() // NEW: Fetch user missions
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
    
    const allPlansForDisplay: PlannedActivityForLogDisplay[] = [
      ...scheduled,
      ...recurring.map(rp => ({
          id: rp.id,
          date: rp.startDate,
          type: rp.type,
          title: rp.title,
          isCompleted: false,
          exercises: rp.exercises,
          isTemplate: true,
          daysOfWeek: rp.daysOfWeek
      }))
    ];
    setPlannedActivities(allPlansForDisplay);
    setUserMissions(missions); // NEW: Set user missions
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadingStatus('Ansluter till databas...');
        await storage.init();
        
        setLoadingStatus('Synkroniserar övningsbibliotek...');
        try {
          await db.syncExercises(); 
        } catch (e) {
          console.warn("Kunde inte synka övningar vid start:", e);
          setLoadingStatus('Synk misslyckades, laddar lokalt...');
        }

        setLoadingStatus('Läser in användardata...');
        await refreshData();
        setLoadingStatus('Slutför...');
      } catch (error) {
        console.error("Kritisk fel vid start:", error);
        setLoadingStatus(`Ett fel uppstod: ${error instanceof Error ? error.message : 'Okänt fel'}`);
      } finally {
        setIsReady(true);
      }
    };
    initApp();
  }, []);

  // NEW: Function to check and update mission status after a workout
  useEffect(() => {
    const checkMissions = async () => {
      if (!history.length || !userMissions.length || !user) return;

      let missionsUpdated = false;
      
      const updatedMissions = await Promise.all(userMissions.map(async (mission) => {
        if (mission.isCompleted) return mission; // Already completed

        let currentProgress = 0;
        if (mission.type === 'weight' && mission.exerciseId) {
          const lastPerf = getLastPerformance(mission.exerciseId, history);
          currentProgress = lastPerf ? Math.max(...lastPerf.map(s => calculate1RM(s.weight || 0, s.reps || 0)), 0) : mission.startValue;
        } else if (mission.type === 'frequency') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const uniqueWorkoutDays = new Set(history.filter(s => new Date(s.date) > thirtyDaysAgo).map(s => s.date.split('T')[0])).size;
          currentProgress = uniqueWorkoutDays;
        } else if (mission.type === 'measurement' && mission.measurementKey) {
          if (mission.measurementKey === 'weight') {
            const sortedBiometricLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestWeightLog = sortedBiometricLogs.find(log => log.weight !== undefined);
            currentProgress = latestWeightLog?.weight || user.weight || 0;
          } else {
            const sortedBiometricLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestMeasurementLog = sortedBiometricLogs.find(log => log.measurements[mission.measurementKey!]);
            currentProgress = latestMeasurementLog?.measurements[mission.measurementKey!] || user.measurements[mission.measurementKey!] || 0;
          }
        }
        
        // Check completion based on goal direction
        const isGoalMet = mission.targetValue > mission.startValue
          ? currentProgress >= mission.targetValue // Increasing goal
          : currentProgress <= mission.targetValue; // Decreasing goal

        if (isGoalMet) {
          missionsUpdated = true;
          return { ...mission, isCompleted: true, completedAt: new Date().toISOString() };
        }
        return mission;
      }));

      if (missionsUpdated) {
        const missionsToUpdateInDb = updatedMissions.filter(m => m.isCompleted && !userMissions.find(oldM => oldM.id === m.id && oldM.isCompleted));
        for (const mission of missionsToUpdateInDb) {
            await storage.updateUserMission(mission);
        }
        setUserMissions(updatedMissions);
      }
    };

    if (isReady && user) {
      checkMissions();
    }
  }, [history, userMissions, user, biometricLogs, isReady]); // Re-run when history or userMissions or user/biometricLogs changes

  const activeZone = useMemo(() => zones.find(z => z.id === (currentSession?.zoneId || selectedZoneForStart?.id)) || zones[0], [zones, currentSession, selectedZoneForStart]);

  const handleFinishWorkout = async (session: WorkoutSession, duration: number) => {
    try {
      await storage.saveToHistory({ ...session, isCompleted: true, date: new Date().toISOString(), duration, locationName: activeZone.name });
      await storage.setActiveSession(null);
      await refreshData(); // This will also trigger mission checks via useEffect
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

  const handleStartEmptyWorkout = () => {
    setShowStartMenu(true);
  };

  const handleDeleteHistory = async (sessionId: string) => {
    try {
      await storage.deleteWorkoutFromHistory(sessionId);
      setHistory(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error("Kunde inte radera passet:", error);
    }
  };

  const handleStartPlannedActivity = (activity: ScheduledActivity) => {
    const cleanExercises = (activity.exercises || []).map(pe => ({
      ...pe,
      sets: pe.sets.map(s => ({...s, completed: false}))
    }));
    handleStartWorkout(cleanExercises, activity.title);
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
      await storage.generateRecurringActivities();
    } else {
      await storage.addScheduledActivity(activity);
    }
    await refreshData();
  };

  const handleDeletePlan = async (id: string, isTemplate: boolean) => {
    if (confirm("Är du säker på att du vill ta bort denna planering?")) {
      try {
        if (isTemplate) {
          await storage.deleteRecurringPlan(id);
        } else {
          await storage.deleteScheduledActivity(id);
        }
        await refreshData();
      } catch (error) {
        console.error("Kunde inte radera planeringen:", error);
        alert("Ett fel uppstod när planeringen skulle raderas.");
      }
    }
  };

  // NEW: Mission related handlers
  const handleAddMission = async (mission: UserMission) => {
    await storage.addUserMission(mission);
    await refreshData();
  };

  const handleDeleteMission = async (id: string) => {
    if (confirm("Är du säker på att du vill ta bort detta uppdrag?")) {
      await storage.deleteUserMission(id);
      await refreshData();
    }
  };

  if (!isReady || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f0d15] text-white p-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-accent-pink/20 border-t-accent-pink rounded-full animate-spin"></div>
          <Activity className="absolute inset-0 m-auto text-accent-pink animate-pulse" size={32} />
        </div>
        <h1 className="mt-8 text-2xl font-black uppercase italic tracking-[0.3em] animate-pulse">MorphFit</h1>
        
        <div className="mt-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest animate-pulse">
            {loadingStatus}
          </p>
        </div>
      </div>
    );
  }

  const isWorkoutActive = currentSession !== null;

  const renderContent = () => {
    switch (activeTab) {
      case 'workout':
        return <WorkoutView 
                  key={currentSession?.id || 'no-session'}
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
                  plannedActivities={plannedActivities}
                  onStartActivity={handleStartPlannedActivity}
                  onStartEmptyWorkout={handleStartEmptyWorkout}
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
      case 'log': return <WorkoutLog 
                          history={history} 
                          plannedActivities={plannedActivities}
                          routines={routines} 
                          allExercises={allExercises} 
                          onAddPlan={handleAddPlan} 
                          onTogglePlan={async (id) => { /* No direct toggle for plans anymore in this model */ }}
                          onDeletePlan={handleDeletePlan}
                          onDeleteHistory={handleDeleteHistory}
                          onStartActivity={handleStartPlannedActivity}
                        />;
      case 'targets': return <TargetsView 
                                userMissions={userMissions} 
                                history={history} 
                                exercises={allExercises} 
                                userProfile={user} 
                                biometricLogs={biometricLogs} 
                                onAddMission={handleAddMission} 
                                onDeleteMission={handleDeleteMission} 
                              />;
      case 'library': return <ExerciseLibrary allExercises={allExercises} history={history} onUpdate={refreshData} />;
      case 'gyms': return <LocationManager zones={zones} onUpdate={refreshData} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0f0d15] selection:bg-accent-pink selection:text-white relative overflow-x-hidden">
      <style>{globalStyles}</style>
      {showOnboarding && isReady && (
        <OnboardingWizard onComplete={() => {
           setShowOnboarding(false);
           refreshData();
        }} />
      )}

      {renderContent()}
      
      {showStartMenu && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-8 flex flex-col overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedZoneForStart ? 'Välj Rutin' : 'Vart tränar du?'}</h3><button onClick={() => { setShowStartMenu(false); setSelectedZoneForStart(null); }} className="text-text-dim p-2"><X size={32}/></button></header>
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pt-4 bg-gradient-to-t from-[#0f0d15] via-[#0f0d15] to-transparent fixed-bottom-nav">
          <div className="max-w-md mx-auto flex justify-between items-center bg-[#1a1721]/80 backdrop-blur-xl border border-white/10 p-2 rounded-[32px] shadow-2xl">
            <button 
              onClick={() => setActiveTab('workout')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'workout' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <Dumbbell size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Träning</span>
            </button>
            <button 
              onClick={() => setActiveTab('gyms')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'gyms' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <MapPin size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Platser</span>
            </button>
            <button 
              onClick={() => setActiveTab('body')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'body' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <User2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Kropp</span>
            </button>
            <button 
              onClick={() => setActiveTab('targets')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'targets' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <Trophy size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Mål</span>
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'library' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <BookOpen size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Övningar</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'log' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <Calendar size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Logg</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
