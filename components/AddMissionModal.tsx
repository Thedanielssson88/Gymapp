

import React, { useState, useMemo, useEffect } from 'react';
import { UserMission, Exercise, UserProfile, MuscleGroup, BodyMeasurements } from '../types';
import { Plus, X, Check, Target as TargetIcon, Dumbbell, Calendar, Ruler, MessageSquare, Search } from 'lucide-react';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';

interface AddMissionModalProps {
  allExercises: Exercise[];
  userProfile: UserProfile; // Changed to UserProfile type
  initialMission?: UserMission; // New prop for editing existing missions
  onSave: (mission: UserMission) => void;
  onClose: () => void;
}

export const AddMissionModal: React.FC<AddMissionModalProps> = ({
  allExercises,
  userProfile,
  initialMission, // Destructure new prop
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialMission?.name || '');
  const [type, setType] = useState<UserMission['type']>(initialMission?.type || 'weight');
  const [targetValue, setTargetValue] = useState<number>(initialMission?.targetValue || 0);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialMission?.exerciseId || '');
  // Fix: Update state type to include 'weight'
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState<keyof BodyMeasurements | 'weight'>(initialMission?.measurementKey || 'weight');
  const [searchQuery, setSearchQuery] = useState('');

  // Update state when initialMission changes (e.g., when editing a different mission)
  useEffect(() => {
    setName(initialMission?.name || '');
    setType(initialMission?.type || 'weight');
    setTargetValue(initialMission?.targetValue || 0);
    setSelectedExerciseId(initialMission?.exerciseId || '');
    setSelectedMeasurementKey(initialMission?.measurementKey || 'weight');
    setSearchQuery(''); // Reset search query on new mission
  }, [initialMission]);


  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, searchQuery]);

  const handleSave = () => {
    if (!name || targetValue <= 0) {
      alert('Vänligen fyll in alla obligatoriska fält korrekt.');
      return;
    }

    const newMission: UserMission = {
      id: initialMission?.id || `mission-${Date.now()}`,
      name,
      type,
      targetValue,
      isCompleted: initialMission?.isCompleted || false, // Preserve completion status if editing
      createdAt: initialMission?.createdAt || new Date().toISOString(),
      completedAt: initialMission?.completedAt || undefined
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
        // Fix: Update validation to allow 'weight' or existing BodyMeasurements keys
        if (selectedMeasurementKey !== 'weight' && !(selectedMeasurementKey in (userProfile.measurements || {}))) {
             alert('Ogiltig mätnyckel eller inte en känd viktmätning.');
             return;
        }
        newMission.measurementKey = selectedMeasurementKey;
    }
    // No specific fields for 'frequency' other than name and targetValue

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

  // Fix: Update parameter type for key
  const getMeasurementUnit = (key: keyof BodyMeasurements | 'weight' | undefined) => {
    if (!key) return '';
    // Fix: Cast key to string for array.includes check
    if (['neck', 'shoulders', 'chest', 'waist', 'hips', 'bicepsL', 'bicepsR', 'thighL', 'thighR', 'calves'].includes(key as string)) {
      return 'cm';
    } else if (key === 'bodyFat') {
      return '%';
    } else if (key === 'weight') {
      return 'kg';
    }
    return '';
  };

  const availableMeasurements = useMemo(() => {
    // Fix: Include 'weight' explicitly in the list of available measurement keys
    const bodyKeys = Object.keys(userProfile.measurements || {}) as (keyof BodyMeasurements)[];
    const allKeys: (keyof BodyMeasurements | 'weight')[] = [...bodyKeys, 'weight'];
    return Array.from(new Set(allKeys)); // Ensure unique keys
  }, [userProfile.measurements]);


  return (
    <div className="fixed inset-0 bg-[#0f0d15]/95 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 space-y-8 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">
            {initialMission ? 'Redigera Uppdrag' : 'Nytt Uppdrag'}
          </h3>
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
            <div className="relative mb-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök övning..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white text-sm outline-none focus:border-accent-blue/50"
              />
            </div>
            <div className="h-40 overflow-y-auto bg-black/20 rounded-2xl border border-white/5 p-2 space-y-1 scrollbar-hide">
              {filteredExercises.length > 0 ? filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all ${selectedExerciseId === ex.id ? 'bg-accent-blue text-white' : 'text-text-dim hover:bg-white/5'}`}
                >
                  {ex.name}
                </button>
              )) : (
                <p className="text-center text-text-dim/50 italic text-xs py-4">Inga övningar matchar sökningen.</p>
              )}
            </div>
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest mt-4 block">Målvikt (kg)</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 100"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
             <p className="text-[9px] text-text-dim italic mt-1 ml-2 flex items-center gap-1"><MessageSquare size={10} /> Spårar högsta uppnådda vikt för ett set (1RM-fokus).</p>
          </div>
        )}

        {type === 'frequency' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Antal pass per 30 dagar</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 12"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
            <p className="text-[9px] text-text-dim italic mt-1 ml-2 flex items-center gap-1"><MessageSquare size={10} /> Spårar antal unika slutförda pass de senaste 30 dagarna.</p>
          </div>
        )}

        {type === 'measurement' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Välj Mått</label>
            <select
                value={selectedMeasurementKey}
                onChange={(e) => setSelectedMeasurementKey(e.target.value as keyof BodyMeasurements | 'weight')}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            >
                {availableMeasurements.length > 0 ? availableMeasurements.map((key) => (
                    <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} ({getMeasurementUnit(key)})
                    </option>
                )) : (
                  <option value="" disabled>Inga mått loggade än</option>
                )}
            </select>
            <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest mt-4 block">
              Målvärde ({getMeasurementUnit(selectedMeasurementKey)})
            </label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(Number(e.target.value))} 
              placeholder="T.ex. 75 (cm) eller 10 (%)"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
            />
             <p className="text-[9px] text-text-dim italic mt-1 ml-2 flex items-center gap-1"><MessageSquare size={10} /> Spårar ditt senast inmatade mått. (Antar att högre är bättre för framsteg).</p>
          </div>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full py-5 bg-white text-black rounded-3xl font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={24} strokeWidth={3} /> {initialMission ? 'Spara Ändringar' : 'Skapa Uppdrag'}
        </button>
      </div>
    </div>
  );
};