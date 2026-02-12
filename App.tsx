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
import { db } from './services/db'; 
import { OnboardingWizard } from './components/OnboardingWizard';
import { SettingsView } from './components/SettingsView';
import { getAccessToken, findBackupFile, downloadBackup, uploadBackup } from './services/googleDrive';
import { Dumbbell, User2, Calendar, X, MapPin, Activity, Home, Trees, ChevronRight, Settings, Trophy, BookOpen, Cloud } from 'lucide-react';
import { calculate1RM, getLastPerformance } from './utils/fitness';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { triggerHaptic } from './utils/haptics';

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
  const [goalTargets, setGoalTargets] = useState<GoalTarget[]>([]); 
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivityForLogDisplay[]>([]); 
  const [userMissions, setUserMissions] = useState<UserMission[]>([]); 

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [selectedZoneForStart, setSelectedZoneForStart] = useState<Zone | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [pendingManualDate, setPendingManualDate] = useState<string | null>(null);

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
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await StatusBar.setStyle({ style: Style.Dark });
        } catch (e) {
          console.warn('Statusbar kunde inte konfigureras:', e);
        }
      }
    };

    initNativeHardware();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // --- GLOBAL KNAPP-VIBRATION ---
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const isVibrationEnabled = user?.settings?.vibrateOnRestEnd ?? true; 

      if (!isVibrationEnabled) return;

      let target = e.target as HTMLElement;
      
      while (target && target !== document.body) {
        const tagName = target.tagName;
        
        if (tagName === 'BUTTON' || tagName === 'A' || target.getAttribute('role') === 'button') {
          triggerHaptic.light(); 
          break;
        }
        
        target = target.parentElement as HTMLElement;
      }
    };

    window.addEventListener('click', handleGlobalClick);

    return () => window.removeEventListener('click', handleGlobalClick);
  }, [user]);

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
      storage.getUserMissions() 
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
    setUserMissions(missions); 
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadingStatus('Ansluter till databas...');
        await storage.init();
        
        setLoadingStatus('Kollar molnsynkronisering...');
        const initialProfile = await storage.getUserProfile();
        
        // CHECK FOR STARTUP RESTORE
        if (initialProfile.settings?.googleDriveLinked && initialProfile.settings?.restoreOnStartup) {
           try {
             const token = await getAccessToken();
             if (token) {
               const fileId = await findBackupFile(token);
               if (fileId) {
                 const backup = await downloadBackup(token, fileId);
                 if (backup) {
                    const localExportedAt = initialProfile.settings.lastCloudSync || "0";
                    if (new Date(backup.exportedAt) > new Date(localExportedAt)) {
                       await storage.importFullBackup(backup);
                       console.log("Cloud data restored on startup.");
                       alert("Nyare data hittades i molnet och har återställts. Appen startas om.");
                       window.location.reload();
                       return;
                    }
                 }
               }
             }
           } catch (e) {
             console.warn("Startup cloud restore failed:", e);
           }
        }

        setLoadingStatus('Synkroniserar övningsbibliotek...');
        try {
          await db.syncExercises(); 
        } catch (e) {
          console.warn("Kunde inte synka övningar vid start:", e);
          setLoadingStatus('Synk misslyckades, laddar lokalt...');
        }

        setLoadingStatus('Läser in användardata...');
        await refreshData();
        const activeSess = await storage.getActiveSession();
        if (activeSess) {
          setActiveTab('workout');
        }
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

  useEffect(() => {
    const checkMissions = async () => {
      if (!history.length || !userMissions.length || !user) return;

      let missionsUpdated = false;
      
      const updatedMissions = await Promise.all(userMissions.map(async (mission) => {
        if (mission.isCompleted) return mission; 

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
        
        const isGoalMet = mission.targetValue > mission.startValue
          ? currentProgress >= mission.targetValue 
          : currentProgress <= mission.targetValue; 

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
  }, [history, userMissions, user, biometricLogs, isReady]); 

  const activeZone = useMemo(() => zones.find(z => z.id === (currentSession?.zoneId || selectedZoneForStart?.id)) || zones[0], [zones, currentSession, selectedZoneForStart]);

  const handleFinishWorkout = async (session: WorkoutSession, duration: number) => {
    try {
      await storage.saveToHistory({ 
        ...session, 
        isCompleted: true, 
        duration, 
        locationName: activeZone.name 
      });
      storage.setActiveSession(null);
      
      // AUTO SYNC AFTER WORKOUT with robust error handling
      if (user?.settings?.googleDriveLinked && user?.settings?.autoSyncMode === 'after_workout') {
        getAccessToken().then(async (token) => {
          if (token) {
            const backupData = await storage.getFullBackupData();
            const existingFileId = await findBackupFile(token);
            await uploadBackup(token, backupData, existingFileId);
            
            // This is a fire-and-forget update, so we update the local user state
            // to reflect the sync time immediately, even if the DB write is async.
            const updatedProfile = {
              ...user,
              settings: {
                ...user.settings!,
                lastCloudSync: backupData.exportedAt
              }
            };
            await storage.setUserProfile(updatedProfile);
            setUser(updatedProfile); // Update state locally for immediate feedback
            console.log("Cloud sync completed after workout.");

          } else {
            throw new Error("Ingen giltig token för Google Drive.");
          }
        }).catch((err) => {
          console.error("Auto-backup failed:", err);
          alert("OBS: Kunde inte spara backup till Drive (utloggad eller nätverksfel). Gå till Inställningar och synka manuellt.");
        });
      }

      await refreshData(); 
      setActiveTab('log');
    } catch (error) {
      console.error("Kunde inte spara passet:", error);
      alert("Ett fel uppstod när passet skulle sparas. Försök igen.");
    }
  };

  const handleCancelWorkout = () => {
    storage.setActiveSession(null);
    setCurrentSession(null);
    setActiveTab('workout');
  };

  const handleStartWorkout = (exercises: PlannedExercise[], name: string) => {
    const zone = selectedZoneForStart || zones[0];
    const sessionDate = pendingManualDate ? new Date(pendingManualDate).toISOString() : new Date().toISOString();
    
    const newSess: WorkoutSession = { 
      id: 'w-' + Date.now(), 
      date: sessionDate, 
      name, 
      zoneId: zone.id, 
      exercises, 
      isCompleted: false,
      isManual: !!pendingManualDate
    };
    
    // 1. Save to localStorage immediately (sync)
    storage.setActiveSession(newSess);
    
    // 2. Update React state
    setCurrentSession(newSess);
    
    // 3. Force the view to the workout tab
    setActiveTab('workout');
    
    // 4. Close modals and reset temporary state
    setShowStartMenu(false);
    setSelectedZoneForStart(null);
    setPendingManualDate(null);
  };

  const handleStartEmptyWorkout = () => {
    setShowStartMenu(true);
  };

  const handleStartManualWorkout = (date: string) => {
    setPendingManualDate(date);
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
    try {
      if (isTemplate) {
        await storage.deleteRecurringPlan(id);
      } else {
        await storage.deleteScheduledActivity(id);
      }
      await refreshData();
    } catch (error) {
      console.error("Kunde inte radera planeringen:", error);
    }
  };

  const handleMovePlan = async (id: string, newDate: string) => {
    try {
      const plan = await db.scheduledActivities.get(id);
      if (plan) {
        await db.scheduledActivities.update(id, { date: newDate });
        await refreshData();
      }
    } catch (error) {
      console.error("Kunde inte flytta planeringen:", error);
    }
  };

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
                  onZoneChange={(z) => {
                    if (currentSession) {
                      const newSession = {...currentSession, zoneId: z.id};
                      setCurrentSession(newSession);
                      storage.setActiveSession(newSession);
                    }
                  }} 
                  onComplete={handleFinishWorkout} 
                  onCancel={handleCancelWorkout} 
                  plannedActivities={plannedActivities}
                  onStartActivity={handleStartPlannedActivity}
                  onStartEmptyWorkout={handleStartEmptyWorkout}
                  onUpdate={refreshData}
                  isManualMode={currentSession?.isManual}
               />;
      case 'body':
        return (
          <div className="space-y-6 animate-in fade-in px-2 pb-32 min-h-screen pt-[calc(env(safe-area-inset-top)+2rem)]">
            <nav className="flex items-center justify-center gap-4 border-b border-white/5 pb-4 px-2">
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
                          onDeletePlan={handleDeletePlan}
                          onDeleteHistory={handleDeleteHistory}
                          onMovePlan={handleMovePlan}
                          onStartActivity={handleStartPlannedActivity}
                          onStartManualWorkout={handleStartManualWorkout}
                          onStartLiveWorkout={handleStartEmptyWorkout}
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
      case 'library': return <ExerciseLibrary allExercises={allExercises} history={history} onUpdate={refreshData} userProfile={user} />;
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
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-8 pt-[calc(env(safe-area-inset-top)+2rem)] flex flex-col overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedZoneForStart ? 'Välj Rutin' : 'Vart tränar du?'}</h3><button onClick={() => { setShowStartMenu(false); setSelectedZoneForStart(null); setPendingManualDate(null); }} className="text-text-dim p-2"><X size={32}/></button></header>
          {!selectedZoneForStart ? (
            <div className="grid grid-cols-1 w-full gap-4">
              {zones.map(z => (<button key={z.id} onClick={() => setSelectedZoneForStart(z)} className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex items-center justify-between group active:scale-95 transition-all"><div className="flex items-center gap-6"><div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center">{z.name.toLowerCase().includes('hem') ? <Home size={32} /> : z.name.toLowerCase().includes('ute') ? <Trees size={32} /> : <MapPin size={32} />}</div><span className="text-2xl font-black uppercase italic tracking-tight">{z.name}</span></div><ChevronRight size={32} className="text-text-dim" /></button>))}
            </div>
          ) : (
            <RoutinePicker onStart={handleStartWorkout} activeZone={selectedZoneForStart} allExercises={allExercises} userProfile={user} routines={routines} onUpdate={refreshData} history={history} />
          )}
        </div>
      )}

      {!isWorkoutActive && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pt-4 bg-gradient-to-t from-[#0f0d15] via-[#0f0d15] to-transparent fixed-bottom-nav">
          <div className="max-w-md mx-auto flex gap-1 items-center bg-[#1a1721]/80 backdrop-blur-xl border border-white/10 p-2 rounded-[32px] shadow-2xl overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('workout')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'workout' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <Dumbbell size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Träning</span>
            </button>
            <button 
              onClick={() => setActiveTab('gyms')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'gyms' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <MapPin size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Platser</span>
            </button>
            <button 
              onClick={() => setActiveTab('body')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'body' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <User2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Kropp</span>
            </button>
            <button 
              onClick={() => setActiveTab('targets')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'targets' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <Trophy size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Mål</span>
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'library' ? 'bg-white text-black' : 'text-text-dim'}`}
            >
              <BookOpen size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Övningar</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex-shrink-0 px-5 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'log' ? 'bg-white text-black' : 'text-text-dim'}`}
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