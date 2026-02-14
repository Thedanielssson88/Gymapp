import React, { useState } from 'react';
import { Sparkles, Send, Calendar, Target, Loader2, CheckCircle2 } from 'lucide-react';
import { generateProfessionalPlan, AIPlanResponse } from '../services/geminiService';
import { storage } from '../services/storage';
import { WorkoutRoutine, UserMission, ScheduledActivity } from '../types';
import { getLastPerformance, calculate1RM } from '../utils/fitness';

interface AIArchitectProps {
  onPlanApplied: () => void;
}

export const AIArchitect: React.FC<AIArchitectProps> = ({ onPlanApplied }) => {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIPlanResponse | null>(null);

  const handleGenerate = async () => {
    if (!request) return;
    setLoading(true);
    setPlan(null);
    try {
      const history = await storage.getHistory();
      const exercises = await storage.getAllExercises();
      const profile = await storage.getUserProfile();
      
      const result = await generateProfessionalPlan(request, history, exercises, profile);
      setPlan(result);
    } catch (error) {
      console.error("AI Error:", error);
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!plan) return;
    setLoading(true);

    try {
        // 1. Spara rutiner
        const newRoutines: WorkoutRoutine[] = [];
        for (const r of plan.routines) {
            const newRoutine: WorkoutRoutine = {
                id: `routine-ai-${Date.now()}-${Math.random()}`,
                name: `AI: ${r.name}`,
                category: 'AI Generated',
                isAiGenerated: true,
                exercises: r.exercises.map((ex: any) => {
                    const repMatch = ex.targetReps.match(/(\d+)/);
                    const reps = repMatch ? parseInt(repMatch[1], 10) : 8;
                    return {
                        exerciseId: ex.id,
                        sets: Array(ex.targetSets).fill(null).map(() => ({
                            reps: reps,
                            weight: 0,
                            completed: false,
                            type: 'normal'
                        }))
                    };
                })
            };
            await storage.saveRoutine(newRoutine);
            newRoutines.push(newRoutine);
        }

        // 2. Spara mål
        for (const g of plan.smartGoals) {
            const newMission: UserMission = {
                id: `mission-ai-${Date.now()}-${Math.random()}`,
                type: 'smart_goal',
                title: g.title,
                isCompleted: false,
                progress: 0,
                total: g.targetValue,
                createdAt: new Date().toISOString(),
                exerciseId: g.exerciseId,
                smartConfig: {
                    targetType: g.targetType,
                    exerciseId: g.exerciseId,
                    startValue: 0, 
                    targetValue: g.targetValue,
                    deadline: g.deadline,
                    strategy: g.strategy,
                }
            };
            
            if (newMission.smartConfig?.targetType === 'exercise' && newMission.smartConfig.exerciseId) {
                const history = await storage.getHistory();
                const lastPerf = getLastPerformance(newMission.smartConfig.exerciseId, history);
                const max1RM = lastPerf ? Math.max(...lastPerf.map(s => calculate1RM(s.weight || 0, s.reps || 0))) : 0;
                newMission.smartConfig.startValue = max1RM;
            } else if (newMission.smartConfig?.targetType === 'body_weight') {
                const profile = await storage.getUserProfile();
                newMission.smartConfig.startValue = profile.weight;
            }
            
            await storage.addUserMission(newMission);
        }

        // 3. Schemalägg passen för kommande vecka
        const today = new Date();
        const todayDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        for (const routine of newRoutines) {
            const aiRoutine = plan.routines.find((r: any) => `AI: ${r.name}` === routine.name);
            if (!aiRoutine) continue;
            
            const scheduledDay = aiRoutine.scheduledDay; // 1=Mon, ..., 7=Sun
            let dayDiff = (scheduledDay - (todayDay === 0 ? 7 : todayDay));
            if(dayDiff < 0) dayDiff += 7; // Schedule for next week if day has passed
            
            const scheduleDate = new Date(today);
            scheduleDate.setDate(today.getDate() + dayDiff);
            
            const activity: ScheduledActivity = {
                id: `sched-ai-${routine.id}`,
                date: scheduleDate.toISOString().split('T')[0],
                type: 'gym',
                title: routine.name,
                isCompleted: false,
                exercises: routine.exercises
            };
            await storage.addScheduledActivity(activity);
        }

        alert("Planen är nu aktiverad! Dina nya rutiner, mål och ett schema för veckan har lagts till.");
        setPlan(null);
        setRequest('');
        onPlanApplied();

    } catch (error) {
        console.error("Failed to apply AI plan:", error);
        alert("Kunde inte spara planen. Försök igen.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pt-8 pb-32">
      <div className="bg-gradient-to-br from-accent-blue/20 to-purple-500/20 p-6 rounded-3xl border border-accent-blue/30">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-accent-blue" />
          <h2 className="text-xl font-black uppercase italic text-white">AI Architect</h2>
        </div>
        
        <textarea 
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Ex: 'Jag har ont i ländryggen, vill få bättre hållning och bli starkare i ryggen på 3 månader'..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 focus:border-accent-blue outline-none transition-all"
        />

        <button 
          onClick={handleGenerate}
          disabled={loading || !request}
          className="w-full mt-4 bg-accent-blue text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
          {loading ? 'ANALYSERSAR DIN DATA...' : 'GENERERA TRÄNINGSPLAN'}
        </button>
      </div>

      {plan && (
        <div className="bg-[#1a1721] p-6 rounded-3xl border border-white/5 animate-in slide-in-from-bottom duration-500">
          <h3 className="text-accent-blue font-bold mb-2">Tränarens analys:</h3>
          <p className="text-sm text-text-dim mb-6 italic">"{plan.motivation}"</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase">
              <Calendar size={16} /> Föreslagna pass:
            </div>
            {plan.routines.map((r: any, i: number) => (
              <div key={i} className="bg-white/5 p-3 rounded-xl text-xs text-text-dim">
                <span className="text-white font-bold">{r.name}</span> • {r.exercises.length} övningar
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase">
              <Target size={16} /> Föreslagna mål:
            </div>
            {plan.smartGoals.map((g: any, i: number) => (
              <div key={i} className="bg-white/5 p-3 rounded-xl text-xs text-text-dim">
                <span className="text-white font-bold">{g.title}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={applyPlan}
            disabled={loading}
            className="w-full mt-8 bg-green-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
            Aktivera Planen
          </button>
        </div>
      )}
    </div>
  );
};
