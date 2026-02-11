import React, { useState } from 'react';
import { MuscleGroup, Zone, Exercise, UserProfile, WorkoutSession, PlannedExercise } from '../types';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { X, Zap, Dumbbell, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { generateWorkoutSession } from '../utils/fitness';

interface WorkoutGeneratorProps {
  activeZone: Zone;
  allExercises: Exercise[];
  userProfile: UserProfile;
  history: WorkoutSession[];
  onGenerate: (exercises: PlannedExercise[]) => void;
  onClose: () => void;
}

const SPLITS: { name: string; label: string; muscles: MuscleGroup[] }[] = [
  { 
    name: 'Push', 
    label: 'Press', 
    muscles: ['Bröst', 'Axlar', 'Triceps'] 
  },
  { 
    name: 'Pull', 
    label: 'Drag', 
    muscles: ['Rygg', 'Biceps', 'Trapezius', 'Underarmar', 'Baksida lår']
  },
  { 
    name: 'Legs', 
    label: 'Ben', 
    muscles: ['Framsida lår', 'Baksida lår', 'Säte', 'Vader', 'Abduktorer', 'Adduktorer'] 
  },
  { 
    name: 'Upper', 
    label: 'Överkropp', 
    muscles: ['Bröst', 'Rygg', 'Axlar', 'Biceps', 'Triceps'] 
  },
  { 
    name: 'Lower', 
    label: 'Underkropp', 
    muscles: ['Framsida lår', 'Baksida lår', 'Säte', 'Vader'] 
  },
  { 
    name: 'Full', 
    label: 'Helkropp', 
    muscles: ALL_MUSCLE_GROUPS 
  }
];

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({ 
  activeZone, allExercises, userProfile, history, onGenerate, onClose 
}) => {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [exerciseCount, setExerciseCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleMuscle = (m: MuscleGroup) => {
    setSelectedMuscles(prev => 
      prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m]
    );
  };

  const handleGenerate = () => {
    if (selectedMuscles.length === 0) return alert("Välj minst en muskelgrupp eller split.");
    
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateWorkoutSession(
        selectedMuscles, 
        activeZone, 
        allExercises, 
        userProfile, 
        history,
        exerciseCount
      );

      if (generated.length === 0) {
        alert(`Inga matchande övningar hittades i "${activeZone.name}".`);
        setIsGenerating(false);
      } else {
        onGenerate(generated);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[200] flex flex-col p-6 animate-in slide-in-from-bottom-10 duration-500">
      <header className="flex justify-between items-center mb-10">
        <div>
           <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
             <Sparkles className="text-accent-blue" size={28} /> Smart PT
           </h3>
           <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">Generator för {activeZone.name}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl"><X size={28} className="text-text-dim" /></button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-10 pb-32">
        
        {/* SNABBVAL / SPLITS */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-pink flex items-center gap-2">
            <Layers size={14} /> Välj Fokus
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {SPLITS.map(split => {
              const isSelected = split.muscles.every(m => selectedMuscles.includes(m)) && selectedMuscles.length === split.muscles.length;
              return (
                <button
                  key={split.name}
                  onClick={() => setSelectedMuscles(split.muscles)}
                  className={`py-5 rounded-2xl border font-black uppercase italic text-xs transition-all ${
                    isSelected 
                      ? 'bg-accent-blue text-white border-accent-blue shadow-lg' 
                      : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10'
                  }`}
                >
                  {split.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* VOLYM SLIDER */}
        <section className="space-y-4">
           <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-green flex items-center gap-2">
                <Dumbbell size={14} /> Passets Längd
              </h4>
              <span className="text-2xl font-black italic text-white leading-none">{exerciseCount} <span className="text-[10px] not-italic text-text-dim">Övningar</span></span>
           </div>
           
           <input 
             type="range" 
             min="1" max="12" step="1"
             value={exerciseCount}
             onChange={(e) => setExerciseCount(Number(e.target.value))}
             className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-green"
           />
           <div className="flex justify-between text-[8px] font-black text-text-dim uppercase tracking-widest px-1">
             <span>Snabbpass</span>
             <span>Standard</span>
             <span>Maraton</span>
           </div>
        </section>

        {/* MANUELLT URVAL */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Anpassat urval ({selectedMuscles.length})</h4>
          <div className="flex flex-wrap gap-2">
            {ALL_MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                  selectedMuscles.includes(m)
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-text-dim border-transparent hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f0d15]/80 backdrop-blur-xl border-t border-white/5">
         <button
           disabled={selectedMuscles.length === 0 || isGenerating}
           onClick={handleGenerate}
           className="w-full py-5 bg-white text-black disabled:opacity-50 disabled:grayscale rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
         >
           {isGenerating ? 'Anpassar övningar...' : 'Generera Pass'} 
           {!isGenerating && <ArrowRight size={24} strokeWidth={3} />}
         </button>
      </div>
    </div>
  );
};