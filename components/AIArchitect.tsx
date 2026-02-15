
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, Save, Calendar, Repeat, Clock, Dumbbell } from 'lucide-react';
import { generateProfessionalPlan } from '../services/geminiService';
import { storage } from '../services/storage';
import { UserMission, ScheduledActivity, PlannedExercise, SetType, Exercise, AIProgram, AIPlanResponse } from '../types';
import { calculatePPLStats, suggestWeightForReps } from '../utils/progression';
import { calculate1RM, getLastPerformance } from '../utils/fitness';

interface AIArchitectProps {
  onClose: () => void;
}

export const AIArchitect: React.FC<AIArchitectProps> = ({ onClose }) => {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIPlanResponse | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Settings
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [weeksToSchedule, setWeeksToSchedule] = useState(4); // Default 4 veckor

  useEffect(() => {
      storage.getAllExercises().then(setAllExercises);
  }, []);

  const handleGenerate = async () => {
    if (!request.trim()) return;
    setLoading(true);
    setPlan(null);
    try {
      const history = await storage.getHistory();
      const exercises = await storage.getAllExercises();
      const profile = await storage.getUserProfile();
      const pplStats = calculatePPLStats(history, exercises);
      
      const result = await generateProfessionalPlan(
        request, history, exercises, profile, pplStats,
        { daysPerWeek, durationMinutes, durationWeeks: weeksToSchedule } 
      );
      setPlan(result);
    } catch (error) {
      console.error("AI Error:", error);
      alert((error as Error).message || "Kunde inte skapa planen. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!plan) return;
    setLoading(true);

    try {
      const fullHistory = await storage.getHistory();
      
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sön, 1=Mån
      const daysUntilMonday = (dayOfWeek === 1) ? 0 : (8 - dayOfWeek) % 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const programId = `ai-prog-${Date.now()}`;
      const newProgram: AIProgram = {
        id: programId,
        name: `AI: ${request.substring(0, 20)}...`,
        createdAt: new Date().toISOString(),
        status: 'active',
        motivation: plan.motivation,
        goalIds: [],
        weeks: weeksToSchedule
      };
      
      const newMissions: UserMission[] = [];
      if (plan.smartGoals) {
        for (const g of plan.smartGoals) {
            const newMission: UserMission = {
                id: `mission-ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: 'smart_goal',
                title: g.title,
                isCompleted: false, progress: 0, total: g.targetValue,
                createdAt: new Date().toISOString(),
                exerciseId: g.exerciseId,
                smartConfig: { ...g, startValue: 0 }
            };
            if (newMission.smartConfig?.targetType === 'exercise' && newMission.smartConfig.exerciseId) {
                const lastPerf = getLastPerformance(newMission.smartConfig.exerciseId, fullHistory);
                const max1RM = lastPerf ? Math.max(...lastPerf.map(s => calculate1RM(s.weight || 0, s.reps || 0))) : 0;
                newMission.smartConfig.startValue = max1RM;
            } else if (newMission.smartConfig?.targetType === 'body_weight') {
                const profile = await storage.getUserProfile();
                newMission.smartConfig.startValue = profile.weight;
            }
            newMissions.push(newMission);
            newProgram.goalIds.push(newMission.id);
        }
      }

      for (const r of plan.routines) {
        const weekNum = r.weekNumber || 1;
        const dayNum = r.scheduledDay || 1;
        
        const sessionDate = new Date(nextMonday);
        sessionDate.setDate(nextMonday.getDate() + ((weekNum - 1) * 7) + (dayNum - 1));

        const exercisesWithWeights: PlannedExercise[] = r.exercises.map((ex) => {
            const repsString = ex.targetReps.toString();
            const parsedReps = parseInt(repsString.split('-')[0], 10) || 8;
            const historyWeight = suggestWeightForReps(ex.id, parsedReps, fullHistory);
            const finalWeight = historyWeight > 0 ? historyWeight : (ex.estimatedWeight || 20);
            return {
                exerciseId: ex.id,
                sets: Array(ex.targetSets).fill(null).map(() => ({ reps: parsedReps, weight: finalWeight, completed: false, type: 'normal' as SetType })),
                notes: `AI Est. vikt: ${ex.estimatedWeight || 0}kg`
            };
        });
        
        const activity: ScheduledActivity = {
            id: `sched-ai-${programId}-w${weekNum}-d${dayNum}`,
            date: sessionDate.toISOString().split('T')[0],
            type: 'gym',
            title: r.name,
            isCompleted: false,
            exercises: exercisesWithWeights,
            programId: programId,
            weekNumber: weekNum
        };
        await storage.addScheduledActivity(activity);
      }

      await storage.saveAIProgram(newProgram);
      for (const mission of newMissions) { await storage.addUserMission(mission); }
      
      alert(`Program sparat! ${plan.routines.length} pass har lagts till i din kalender över ${weeksToSchedule} veckor.`);
      setPlan(null);
      setRequest('');
      onClose();
    } catch (error) {
      console.error("Failed to apply AI plan:", error);
      alert("Kunde inte spara planen. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="bg-gradient-to-br from-[#1a1721] to-[#2a2435] p-6 rounded-3xl border border-accent-blue/20 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent-blue/10 rounded-full"><Sparkles className="text-accent-blue" size={24} /></div>
          <h2 className="text-xl font-black uppercase italic text-white">Nytt Träningsprogram</h2>
        </div>
        
        <div className="space-y-3 mb-4">
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <label className="text-[10px] text-text-dim font-bold uppercase mb-2 flex items-center gap-1"><Repeat size={12}/> Programlängd</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(w => (
                        <button key={w} onClick={() => setWeeksToSchedule(w)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ weeksToSchedule === w ? 'bg-accent-blue text-black' : 'bg-white/5 text-text-dim hover:bg-white/10'}`}>{w} Veckor</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] text-text-dim font-bold uppercase mb-2 flex items-center gap-1"><Calendar size={12}/> Frekvens</label>
                    <div className="flex items-center justify-between">
                        <button onClick={() => setDaysPerWeek(Math.max(1, daysPerWeek - 1))} className="text-white bg-white/10 w-8 h-8 rounded-lg font-bold">-</button>
                        <span className="text-white font-bold">{daysPerWeek} /v</span>
                        <button onClick={() => setDaysPerWeek(Math.min(7, daysPerWeek + 1))} className="text-white bg-white/10 w-8 h-8 rounded-lg font-bold">+</button>
                    </div>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] text-text-dim font-bold uppercase mb-2 flex items-center gap-1"><Clock size={12}/> Tid/pass</label>
                    <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm"><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select>
                </div>
            </div>
        </div>

        <textarea value={request} onChange={(e) => setRequest(e.target.value)} placeholder="Beskriv ditt mål... (T.ex. 'Jag vill öka 10kg i bänkpress')" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base min-h-[100px] focus:border-accent-blue outline-none transition-all placeholder:text-white/20 resize-none mb-4"/>

        <button onClick={handleGenerate} disabled={loading || !request} className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-sm shadow-lg"><Send size={18} /> {loading ? 'BYGGER PROGRAM...' : 'GENERERA PROGRAM'}</button>
      </div>

      {plan && (
        <div className="animate-in slide-in-from-bottom duration-500 space-y-4">
          <div className="bg-[#1a1721] p-6 rounded-3xl border border-white/10">
            <h3 className="text-accent-blue font-bold mb-2 uppercase tracking-widest text-xs flex items-center gap-2"><Sparkles size={12} /> Förslag ({plan.routines.length} pass)</h3>
            <p className="text-sm text-white mb-6 leading-relaxed italic">"{plan.motivation}"</p>
            
            <div className="space-y-2 mb-6 opacity-75">
              {plan.routines.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-text-dim">
                    <span className="text-white font-bold block">{r.name}</span>
                    {r.exercises.length} övningar • Vecka {r.weekNumber}
                </div>
              ))}
              {plan.routines.length > 3 && (<p className="text-center text-[10px] text-text-dim">...och {plan.routines.length - 3} pass till</p>)}
            </div>

            <button onClick={applyPlan} className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg"><Save size={18} /> SPARA PROGRAM</button>
          </div>
        </div>
      )}
    </div>
  );
};
