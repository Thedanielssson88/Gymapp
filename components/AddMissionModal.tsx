
import React, { useState, useMemo } from 'react';
import { UserMission, Exercise, UserProfile, MuscleGroup, BodyMeasurements } from '../types';
import { Plus, X, Check, Target as TargetIcon, Dumbbell, Calendar, Ruler, MessageSquare } from 'lucide-react';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';

interface AddMissionModalProps {
  allExercises: Exercise[];
  userProfile: UserProfile;
  onSave: (mission: UserMission) => void;
  onClose: () => void;
}

export const AddMissionModal: React.FC<AddMissionModalProps> = ({
  allExercises,
  userProfile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<UserMission['type']>('weight');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState<keyof BodyMeasurements>('weight');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | ''>('');


  const filteredExercises = useMemo(() => {
    return allExercises.sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises]);

  const handleSave = () => {
    if (!name || targetValue <= 0) {
      alert('Vänligen fyll i alla obligatoriska fält korrekt.');
      return;
    }

    const newMission: UserMission = {
      id: `mission-${Date.now()}`,
      name,
      type,
      targetValue,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    if (type === 'weight') {
      if (!selectedExerciseId) {
        alert('Välj en övning för viktmålet.');
        return;
      }
      newMission.exerciseId = selectedExerciseId;
    } else if (type === 'measurement') {
        if (!selectedMeasurementKey) {
            alert('Välj ett mått för måttet.');
            return;
        }
        newMission.measurementKey = selectedMeasurementKey;
    } else if (type === 'frequency' && selectedMuscleGroup) {
        newMission.muscleGroup = selectedMuscleGroup;
    }

    onSave(newMission);
    onClose();
  };

  const getIconForType = (missionType: UserMission['type']) => {
    switch (missionType) {
      case 'weight': return <Dumbbell size={18} />;
      case 'frequency': return <Calendar size={18} />;
      case 'measurement': return <Ruler size={18} />;
      default: return <TargetIcon size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15]/95 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 space-y-8 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Nytt Uppdrag</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Mission Name */}
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Uppdragsnamn</label>
            <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="T.ex. Bänka 100 kg"
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
        </div>

        {/* Mission Type */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Typ av Uppdrag</label>
          <div className="grid grid-cols-3 gap-2">
            {(['weight', 'frequency', 'measurement'] as UserMission['type'][]).map(missionType => (
              <button
                key={missionType}
                onClick={() => setType(missionType)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-2 ${
                  type === missionType ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white/5 border-white/10 text-text-dim'
                }`}
              >
                {getIconForType(missionType)} {missionType === 'weight' ? 'Vikt' : missionType === 'frequency' ? 'Frekvens' : 'Mått'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields based on Type */}
        {type === 'weight' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Välj Övning</label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            >
              <option value="">-- Välj övning --</option>
              {filteredExercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest mt-4 block">Målvikt (1RM, kg)</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 100"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
          </div>
        )}

        {type === 'frequency' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Antal pass på 30 dagar</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 12"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
            <p className="text-[9px] text-text-dim italic mt-1 ml-2 flex items-center gap-1"><MessageSquare size={10} /> Spårar antal slutförda pass de senaste 30 dagarna.</p>
          </div>
        )}

        {type === 'measurement' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Välj Mått</label>
            <select
                value={selectedMeasurementKey}
                onChange={(e) => setSelectedMeasurementKey(e.target.value as keyof BodyMeasurements)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            >
                {Object.keys(userProfile.measurements).map((key) => (
                    <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                ))}
            </select>
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest mt-4 block">Målvärde</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 75 (cm) eller 10 (%)"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
             <p className="text-[9px] text-text-dim italic mt-1 ml-2 flex items-center gap-1"><MessageSquare size={10} /> Spårar ditt senaste inmatade mått. (Antar att högre är bättre, lägre för t.ex. kroppsfett måste spåras manuellt)</p>
          </div>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full py-5 bg-white text-black rounded-3xl font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={24} strokeWidth={3} /> Skapa Uppdrag
        </button>
      </div>
    </div>
  );
};