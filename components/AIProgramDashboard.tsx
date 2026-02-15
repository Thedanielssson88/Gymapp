
import React, { useState, useEffect } from 'react';
import { AIProgram, ScheduledActivity, WorkoutSession, Exercise, PlannedExercise, SetType } from '../types';
import { storage } from '../services/storage';
import { generateNextPhase } from '../services/geminiService';
import { calculatePPLStats, suggestWeightForReps } from '../utils/progression';
import { ChevronRight, Calendar, Activity, XCircle, PlusCircle, TrendingUp, CheckCircle, ArrowLeft, Sparkles, Loader2, Circle, CheckCircle2 } from 'lucide-react';
import { AIArchitect } from './AIArchitect';
import { WorkoutDetailsModal } from './WorkoutDetailsModal';

interface AIProgramDashboardProps {
  onStartSession: (activity: ScheduledActivity) => void;
}

export const AIProgramDashboard: React.FC<AIProgramDashboardProps> = ({ onStartSession }) => {
  const [programs, setPrograms] = useState<AIProgram[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledActivity[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<AIProgram | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  const [viewingActivity, setViewingActivity] = useState<ScheduledActivity | null>(null);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  const loadData = async () => {
    setPrograms(await storage.getAIPrograms());
    setScheduled(await storage.getScheduledActivities());
    setHistory(await storage.getHistory());
    setAllExercises(await storage.getAllExercises());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage-update', loadData);
    return () => window.removeEventListener('storage-update', loadData);
  }, []);

  const handleGenerateNextPhase = async () => {
    if (!selectedProgram) return;
    setIsGeneratingNext(true);
    try {
      const userProfile = await storage.getUserProfile();
      const pplStats = calculatePPLStats(history, allExercises);
      
      const completedProgramActivities = scheduled.filter(a => a.programId === selectedProgram.id && a.isCompleted && a.linkedSessionId);
      const completedSessionIds = completedProgramActivities.map(a => a.linkedSessionId!);
      const programHistory = history.filter(h => completedSessionIds.includes(h.id)).slice(-10);

      const result = await generateNextPhase(selectedProgram, programHistory, allExercises, pplStats);

      const currentWeeks = selectedProgram.weeks || 4;
      const lastProgramActivity = scheduled
        .filter(r => r.programId === selectedProgram.id)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .pop();
        
      const lastDate = lastProgramActivity ? new Date(lastProgramActivity.date) : new Date();
      
      const startOfNewPhase = new Date(lastDate);
      startOfNewPhase.setDate(lastDate.getDate() + (7 - lastDate.getDay() + 1));
      startOfNewPhase.setHours(0,0,0,0);
      
      for (let week = 0; week < 4; week++) {
         for (const routineTemplate of result.routines) {
            const exercisesWithWeights: PlannedExercise[] = routineTemplate.exercises.map((ex: any) => {
              const parsedReps = parseInt(ex.targetReps.toString().split('-')[0]) || 8;
              const historyWeight = suggestWeightForReps(ex.id, parsedReps, history);
              const finalWeight = historyWeight > 0 ? historyWeight : (ex.estimatedWeight || 20);
              return {
                  exerciseId: ex.id,
                  sets: Array(ex.targetSets).fill(null).map(() => ({
                      reps: parsedReps,
                      weight: finalWeight,
                      completed: false,
                      type: 'normal' as SetType
                  })),
                  notes: `AI Est. vikt: ${ex.estimatedWeight || 0}kg`
              };
            });

            const dayOffset = (routineTemplate.scheduledDay || 1) - 1; 
            const sessionDate = new Date(startOfNewPhase);
            sessionDate.setDate(startOfNewPhase.getDate() + (week * 7) + dayOffset);
            
            const activity: ScheduledActivity = {
                id: `sched-ai-${selectedProgram.id}-w${currentWeeks + week + 1}-${dayOffset}`,
                date: sessionDate.toISOString().split('T')[0],
                type: 'gym',
                title: `${routineTemplate.name} (V.${currentWeeks + week + 1})`,
                isCompleted: false,
                exercises: exercisesWithWeights,
                programId: selectedProgram.id,
                weekNumber: currentWeeks + week + 1
            };
            await storage.addScheduledActivity(activity);
         }
      }

      const updatedProgram = { 
          ...selectedProgram, 
          weeks: currentWeeks + 4,
          motivation: result.motivation
      };
      await storage.saveAIProgram(updatedProgram);
      
      alert("Nästa fas (4 veckor) är genererad och tillagd!");
      await loadData();
      setSelectedProgram(updatedProgram);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Kunde inte generera nästa fas.");
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleStartActivity = (activity: ScheduledActivity) => {
    setViewingActivity(null);
    onStartSession(activity);
  };

  if (showGenerator) {
    return (
        <div>
            <button onClick={() => setShowGenerator(false)} className="px-4 py-4 text-text-dim flex items-center gap-2 font-bold text-xs uppercase">
                <ArrowLeft size={16} /> Avbryt
            </button>
            <AIArchitect onClose={() => setShowGenerator(false)} />
        </div>
    );
  }

  if (selectedProgram) {
    const programActivities = scheduled
        .filter(r => r.programId === selectedProgram.id)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const todayStr = new Date().toISOString().split('T')[0];
    const completedActivities = programActivities.filter(a => a.isCompleted || (a.date < todayStr && a.linkedSessionId));
    const upcomingActivities = programActivities.filter(a => !completedActivities.some(c => c.id === a.id));

    const handleCancel = async () => {
        if(confirm("Är du säker? Detta tar bort alla kommande pass och mål kopplade till programmet.")) {
            await storage.cancelAIProgram(selectedProgram.id);
            setSelectedProgram(null);
        }
    };

    return (
      <div className="pb-24 pt-8 px-4 space-y-6 animate-in fade-in">
        {viewingActivity && (
            <WorkoutDetailsModal 
                activity={viewingActivity}
                allExercises={allExercises}
                onClose={() => setViewingActivity(null)} 
                onStart={handleStartActivity} 
            />
        )}
        
        <div className="flex items-center gap-2">
            <button onClick={() => setSelectedProgram(null)} className="text-text-dim hover:text-white flex items-center gap-1 bg-white/5 px-3 py-2 rounded-xl text-xs font-bold uppercase">
                <ArrowLeft size={16}/> Tillbaka
            </button>
        </div>

        <div className="bg-gradient-to-br from-[#1a1721] to-[#2a2435] p-6 rounded-3xl border border-accent-blue/20">
            <h2 className="text-2xl font-black italic uppercase text-white mb-2">{selectedProgram.name}</h2>
            <p className="text-sm text-text-dim italic border-l-2 border-accent-blue pl-3 mb-4">"{selectedProgram.motivation}"</p>
            {selectedProgram.status === 'active' && (
                <div className="flex gap-3 mt-4">
                    <button onClick={handleGenerateNextPhase} disabled={isGeneratingNext} className="flex-1 bg-accent-blue text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50">
                        {isGeneratingNext ? <Loader2 className="animate-spin"/> : <PlusCircle size={16} />} {isGeneratingNext ? 'Analyserar...' : 'Generera Nästa Fas'}
                    </button>
                    <button onClick={handleCancel} className="bg-red-500/10 text-red-500 font-bold py-3 px-4 rounded-xl flex items-center justify-center"><XCircle size={20} /></button>
                </div>
            )}
        </div>

        {upcomingActivities.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2">
                    <Circle size={12} className="text-accent-blue fill-current"/> Kommande Pass
                </h3>
                {upcomingActivities.map(activity => (
                    <div key={activity.id} onClick={() => setViewingActivity(activity)} className="bg-[#1a1721] p-4 rounded-xl border border-white/5 hover:border-accent-blue/50 transition-all cursor-pointer flex justify-between items-center group">
                        <div>
                            <span className="text-white font-bold text-sm block group-hover:text-accent-blue transition-colors">{activity.title}</span>
                            <div className="text-xs text-text-dim flex gap-3 mt-1"><span className="flex items-center gap-1"><Calendar size={10}/> {activity.date}</span><span>{activity.exercises?.length} övningar</span></div>
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-white" size={18} />
                    </div>
                ))}
            </div>
        )}

        {completedActivities.length > 0 && (
            <div className="space-y-3 opacity-60">
                <h3 className="text-text-dim font-bold text-sm uppercase flex items-center gap-2 mt-6"><CheckCircle2 size={12}/> Historik ({completedActivities.length})</h3>
                {completedActivities.reverse().map(activity => (
                    <div key={activity.id} className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 flex justify-between items-center">
                        <div>
                            <span className="text-green-400 font-bold text-sm block line-through">{activity.title}</span>
                            <div className="text-xs text-green-400/60 flex gap-3 mt-1"><span className="flex items-center gap-1"><Calendar size={10}/> {activity.date}</span><span>{activity.exercises?.length} övningar</span></div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase text-white">AI Program</h2>
        <button onClick={() => setShowGenerator(true)} className="bg-accent-blue text-black p-3 rounded-full hover:bg-white transition-colors shadow-lg shadow-accent-blue/20">
            <PlusCircle size={24} />
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
            <Sparkles size={32} className="mx-auto text-accent-blue mb-4"/>
            <p className="text-text-dim mb-4">Inga aktiva program.</p>
            <button onClick={() => setShowGenerator(true)} className="text-accent-blue font-bold uppercase text-sm">Skapa din första plan</button>
        </div>
      ) : (
        <div className="grid gap-4">
            {programs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(p => (
                <button key={p.id} onClick={() => setSelectedProgram(p)} className="bg-[#1a1721] p-5 rounded-2xl border border-white/5 text-left group hover:border-accent-blue/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{p.name}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${p.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-text-dim'}`}>{p.status === 'active' ? 'Pågående' : 'Avslutad'}</span>
                    </div>
                    <p className="text-xs text-text-dim line-clamp-2 mb-4">{p.motivation}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-dim font-bold uppercase tracking-widest"><Activity size={12} className="text-accent-blue" /> Se utveckling</div>
                </button>
            ))}
        </div>
      )}
    </div>
  );
};
