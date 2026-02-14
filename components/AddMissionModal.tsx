import React, { useState, useEffect } from 'react';
import { UserMission, Exercise, ProgressionStrategy, SmartGoalTarget, WorkoutSession, UserProfile, BodyMeasurements } from '../types';
import { storage } from '../services/storage';
import { X, Trophy, TrendingUp, Calendar, Dumbbell, Scale, Ruler } from 'lucide-react';
import { calculate1RM, getLastPerformance } from '../utils/fitness';

interface AddMissionModalProps {
  onClose: () => void;
  onSave: (mission: UserMission) => void;
  allExercises: Exercise[];
  userProfile: UserProfile;
  history: WorkoutSession[];
}

export const AddMissionModal: React.FC<AddMissionModalProps> = ({ onClose, onSave, allExercises, userProfile, history }) => {
  const [missionType, setMissionType] = useState<'quest' | 'smart_goal'>('smart_goal');
  
  // Data för Quest
  const [title, setTitle] = useState('');
  const [targetCount, setTargetCount] = useState(10);

  // Data för Smart Goal
  const [targetType, setTargetType] = useState<SmartGoalTarget>('exercise');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [measurementKey, setMeasurementKey] = useState<keyof BodyMeasurements | 'weight'>('waist');
  const [startValue, setStartValue] = useState(0);
  const [targetValue, setTargetValue] = useState(0);
  const [startReps, setStartReps] = useState(8);
  const [targetReps, setTargetReps] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [strategy, setStrategy] = useState<ProgressionStrategy>('linear');
  

  // Autofyll Startvärde baserat på historik när man väljer övning/typ
  useEffect(() => {
    const fetchCurrent = async () => {
      if (targetType === 'exercise' && selectedExerciseId) {
        const lastPerf = getLastPerformance(selectedExerciseId, history);
        let max = 0;
        if(lastPerf){
           max = Math.max(...lastPerf.map(s => calculate1RM(s.weight, s.reps)));
        }
        if (max > 0) setStartValue(max);
      } else if (targetType === 'body_weight') {
        if (userProfile.weight) setStartValue(userProfile.weight);
      }
    };
    fetchCurrent();
  }, [targetType, selectedExerciseId, history, userProfile]);

  const handleSave = () => {
    const isSmart = missionType === 'smart_goal';
    
    // Generera titel om den saknas för smart goal
    let finalTitle = title;
    if (isSmart && !finalTitle) {
        if (targetType === 'exercise') {
            const exName = allExercises.find(e => e.id === selectedExerciseId)?.name || 'Övning';
            finalTitle = `Öka ${exName} till ${targetValue}kg`;
        } else if (targetType === 'body_weight') {
            finalTitle = `Nå ${targetValue}kg kroppsvikt`;
        } else {
            finalTitle = `Mål för ${measurementKey}`;
        }
    }

    const newMission: UserMission = {
      id: `m-${Date.now()}`,
      title: finalTitle || 'Nytt uppdrag',
      type: missionType,
      isCompleted: false,
      progress: 0,
      total: isSmart ? targetValue : targetCount,
      createdAt: new Date().toISOString(),
      
      ...(isSmart && {
        exerciseId: selectedExerciseId, // Bra för sökning
        smartConfig: {
          targetType,
          exerciseId: targetType === 'exercise' ? selectedExerciseId : undefined,
          measurementKey: targetType === 'body_measurement' ? measurementKey : (targetType === 'body_weight' ? 'weight' : undefined),
          startValue,
          targetValue,
          startReps: targetType === 'exercise' ? startReps : undefined,
          targetReps: targetType === 'exercise' ? targetReps : undefined,
          deadline,
          strategy,
        }
      })
    };
    
    onSave(newMission);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1721] w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase text-white">Nytt Mål</h3>
          <button onClick={onClose}><X className="text-text-dim" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Huvudflikar */}
          <div className="flex bg-white/5 p-1 rounded-xl">
             <button onClick={() => setMissionType('smart_goal')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 ${missionType === 'smart_goal' ? 'bg-accent-blue text-white' : 'text-text-dim'}`}>
                <TrendingUp size={16} /> Progression
             </button>
             <button onClick={() => setMissionType('quest')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 ${missionType === 'quest' ? 'bg-accent-blue text-white' : 'text-text-dim'}`}>
                <Trophy size={16} /> Uppdrag
             </button>
          </div>

          {missionType === 'smart_goal' ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Måltyp-väljare */}
              <div className="flex gap-2">
                {[
                  { id: 'exercise', icon: Dumbbell, label: 'Övning' },
                  { id: 'body_weight', icon: Scale, label: 'Vikt' },
                  { id: 'body_measurement', icon: Ruler, label: 'Mått' }
                ].map(t => (
                  <button key={t.id} onClick={() => setTargetType(t.id as any)} className={`flex-1 py-3 border border-white/10 rounded-xl flex flex-col items-center gap-1 ${targetType === t.id ? 'bg-white/10 border-accent-blue text-white' : 'text-text-dim'}`}>
                    <t.icon size={18} />
                    <span className="text-[9px] font-black uppercase">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Innehåll beroende på måltyp */}
              {targetType === 'exercise' && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-dim">Välj Övning</label>
                       <select value={selectedExerciseId} onChange={e => setSelectedExerciseId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none">
                          <option value="">-- Välj --</option>
                          {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-dim">Start Reps</label>
                            <input 
                                type="number" 
                                value={startReps} 
                                onChange={e => setStartReps(Number(e.target.value))} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-dim">Mål Reps</label>
                            <input 
                                type="number" 
                                value={targetReps} 
                                onChange={e => setTargetReps(Number(e.target.value))} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold text-accent-green" 
                            />
                        </div>
                    </div>
                 </div>
              )}
              
              {targetType === 'body_measurement' && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-dim">Mätpunkt</label>
                    <select value={measurementKey} onChange={e => setMeasurementKey(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none">
                       <option value="waist">Midja</option>
                       <option value="bicepsL">Biceps</option>
                       <option value="chest">Bröst</option>
                       <option value="thighL">Lår</option>
                    </select>
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-dim">Start ({targetType === 'body_measurement' ? 'cm' : 'kg'})</label>
                    <input type="number" value={startValue} onChange={e => setStartValue(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-dim">Mål ({targetType === 'body_measurement' ? 'cm' : 'kg'})</label>
                    <input type="number" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold text-accent-green" />
                 </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim">Deadline</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" />
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim">Strategi</label>
                  <div className="flex gap-2">
                      <button onClick={() => setStrategy('linear')} className={`flex-1 p-2 rounded-lg text-[10px] font-black uppercase border ${strategy === 'linear' ? 'bg-white text-black' : 'border-white/10 text-text-dim'}`}>Linjär</button>
                      <button onClick={() => setStrategy('undulating')} className={`flex-1 p-2 rounded-lg text-[10px] font-black uppercase border ${strategy === 'undulating' ? 'bg-white text-black' : 'border-white/10 text-text-dim'}`}>Vågform</button>
                      <button onClick={() => setStrategy('peaking')} className={`flex-1 p-2 rounded-lg text-[10px] font-black uppercase border ${strategy === 'peaking' ? 'bg-white text-black' : 'border-white/10 text-text-dim'}`}>Toppning</button>
                  </div>
              </div>
            </div>
          ) : (
            // Classic Quest Form
            <div className="space-y-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim">Uppdragets namn</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" placeholder="T.ex. 100 Pullups" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim">Mål-antal</label>
                  <input type="number" value={targetCount} onChange={e => setTargetCount(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" />
                </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5">
            <button onClick={handleSave} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-gray-200">
                Spara Mål
            </button>
        </div>
      </div>
    </div>
  );
};