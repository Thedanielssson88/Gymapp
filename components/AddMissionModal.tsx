
import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, UserMission, UserProfile, BodyMeasurements, WorkoutSession, BiometricLog } from '../types';
import { Search, X, Check, Ruler, Activity, CheckCircle2, Dumbbell, Calendar, Info } from 'lucide-react';
import { calculate1RM, getLastPerformance } from '../utils/fitness';

interface AddMissionModalProps {
  allExercises: Exercise[];
  userProfile: UserProfile;
  history: WorkoutSession[];
  biometricLogs: BiometricLog[];
  initialMission?: UserMission;
  onSave: (mission: UserMission) => void;
  onClose: () => void;
}

export const AddMissionModal: React.FC<AddMissionModalProps> = ({ 
  allExercises, userProfile, history, biometricLogs, initialMission, onSave, onClose 
}) => {
  const [name, setName] = useState(initialMission?.name || '');
  const [type, setType] = useState<'weight' | 'frequency' | 'measurement'>(initialMission?.type || 'weight');
  const [targetValue, setTargetValue] = useState<string>(initialMission?.targetValue?.toString() || '');
  const [selectedExId, setSelectedExId] = useState(initialMission?.exerciseId || '');
  const [selectedMeasure, setSelectedMeasure] = useState<keyof BodyMeasurements | 'weight' | ''>(initialMission?.measurementKey || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setName(initialMission?.name || '');
    setType(initialMission?.type || 'weight');
    setTargetValue(initialMission?.targetValue?.toString() || '');
    setSelectedExId(initialMission?.exerciseId || '');
    setSelectedMeasure(initialMission?.measurementKey || '');
    setSearchQuery('');
  }, [initialMission]);
  
  const exerciseData = useMemo(() => 
    allExercises.find(e => e.id === selectedExId), 
  [selectedExId, allExercises]);

  const typeDescription = useMemo(() => {
    switch (type) {
      case 'weight':
        if (!selectedExId) return "Välj en övning för att se måldetaljer.";
        if (exerciseData?.trackingType === 'time_distance') 
          return "Sätt ett mål för distans. Appen spårar din längsta sträcka i ett set.";
        if (exerciseData?.trackingType === 'reps_only') 
          return "Sätt ett mål för antal repetitioner. Appen spårar ditt uthållighetsrekord.";
        if (exerciseData?.trackingType === 'time_only')
          return "Sätt ett mål för tid. Appen spårar din längsta tid i ett set.";
        return "Sätt ett mål för din maxstyrka. För styrkeövningar beräknas ditt 1RM (Maxlyft).";
      case 'frequency':
        return "Sätt ett mål för hur många pass du ska genomföra under en rullande 30-dagarsperiod för att bibehålla din vana.";
      case 'measurement':
        return "Sätt ett mål för ett specifikt kroppsmått. Appen känner automatiskt av om du vill öka eller minska baserat på ditt startvärde.";
      default:
        return "";
    }
  }, [type, selectedExId, exerciseData]);

  const currentValue = useMemo(() => {
    if (type === 'weight' && exerciseData) {
      const lastPerf = getLastPerformance(exerciseData.id, history);
      if (!lastPerf) return 0;
      switch (exerciseData.trackingType) {
        case 'time_distance': return Math.max(...lastPerf.map(s => s.distance || 0));
        case 'reps_only': return Math.max(...lastPerf.map(s => s.reps || 0));
        case 'time_only': return Math.max(...lastPerf.map(s => s.duration || 0));
        default: return Math.round(Math.max(...lastPerf.map(s => calculate1RM(s.weight, s.reps))));
      }
    }
    if (type === 'measurement' && selectedMeasure) {
      if (selectedMeasure === 'weight') {
          const sortedLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latestLog = sortedLogs.find(log => log.weight !== undefined);
          return latestLog?.weight || userProfile.weight || 0;
      }
      const sortedLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestLog = sortedLogs.find(log => log.measurements[selectedMeasure as keyof BodyMeasurements]);
      return latestLog?.measurements[selectedMeasure as keyof BodyMeasurements] || userProfile.measurements?.[selectedMeasure as keyof BodyMeasurements] || 0;
    }
    if (type === 'frequency') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Set(history.filter(s => new Date(s.date) > thirtyDaysAgo).map(s => s.date.split('T')[0])).size;
    }
    return 0;
  }, [type, exerciseData, history, userProfile, biometricLogs, selectedMeasure, selectedExId]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [allExercises, searchQuery]);
  
  const availableMeasurements = useMemo(() => {
    const bodyKeys = Object.keys(userProfile.measurements || {}) as (keyof BodyMeasurements)[];
    const allKeys: (keyof BodyMeasurements | 'weight')[] = ['weight', ...bodyKeys];
    return Array.from(new Set(allKeys));
  }, [userProfile.measurements]);

  const getUnit = () => {
    if (type === 'weight' && exerciseData) {
        switch (exerciseData.trackingType) {
            case 'time_distance': return 'm';
            case 'reps_only': return 'reps';
            case 'time_only': return 'sek';
            default: return 'kg';
        }
    }
    if (type === 'frequency') return 'pass';
    if (type === 'measurement') {
        if (!selectedMeasure) return '';
        if (selectedMeasure === 'weight') return 'kg';
        if (selectedMeasure === 'bodyFat') return '%';
        return 'cm';
    }
    return 'st';
  };

  const handleSave = () => {
    const target = parseFloat(targetValue);
    if (isNaN(target)) {
      alert("Ange ett giltigt målvärde");
      return;
    }

    const finalName = name || (type === 'weight' ? allExercises.find(e => e.id === selectedExId)?.name : selectedMeasure) || 'Nytt Uppdrag';

    if (!finalName || (type === 'weight' && !selectedExId) || (type === 'measurement' && !selectedMeasure)) {
        alert("Vänligen välj en övning eller ett mått för ditt uppdrag.");
        return;
    }

    onSave({
      id: initialMission?.id || `mission-${Date.now()}`,
      name: finalName,
      type,
      startValue: initialMission?.startValue !== undefined ? initialMission.startValue : currentValue,
      targetValue: target,
      exerciseId: type === 'weight' ? selectedExId : undefined,
      measurementKey: type === 'measurement' ? selectedMeasure : undefined,
      isCompleted: initialMission?.isCompleted || false,
      createdAt: initialMission?.createdAt || new Date().toISOString(),
      completedAt: initialMission?.completedAt
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0d15]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1a1721] w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl relative animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">
            {initialMission ? 'Redigera Uppdrag' : 'Starta Nytt Uppdrag'}
          </h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="Ge uppdraget ett namn..." 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-pink/50"
          />
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            {(['weight', 'frequency', 'measurement'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${type === t ? 'bg-white text-black shadow-lg' : 'text-text-dim'}`}
              >
                {t === 'weight' ? 'Prestation' : t === 'frequency' ? 'Vana' : 'Mått'}
              </button>
            ))}
          </div>
          
          <div className="bg-accent-blue/5 border border-accent-blue/10 rounded-2xl p-4 flex gap-3">
            <Info size={18} className="text-accent-blue shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-text-dim font-medium italic">
              {typeDescription}
            </p>
          </div>

          {type === 'weight' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök övning..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-accent-blue/50"
                />
              </div>
              <div className="h-32 overflow-y-auto bg-black/20 rounded-2xl border border-white/5 p-2 space-y-1">
                {filteredExercises.map(ex => {
                  const isSelected = selectedExId === ex.id;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExId(ex.id)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${
                        isSelected ? 'bg-accent-blue text-white shadow-lg' : 'text-text-dim hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate pr-2">{ex.name}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-white shrink-0 animate-in zoom-in" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {type === 'measurement' && (
            <div className="grid grid-cols-3 gap-2">
              {availableMeasurements.map(m => {
                const isSelected = selectedMeasure === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMeasure(m as any)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex justify-center items-center ${
                      isSelected ? 'bg-accent-blue border-accent-blue text-white shadow-lg' : 'bg-black/40 border-white/5 text-text-dim'
                    }`}
                  >
                    {m.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Nuvarande</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-accent-blue font-black text-xl text-center">
                {currentValue} <span className="text-[10px] opacity-40 uppercase">{getUnit()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Ditt Mål</label>
              <input 
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full bg-black/40 border border-accent-blue/30 rounded-2xl p-4 text-white font-black text-xl text-center outline-none focus:border-accent-blue transition-colors"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-5 bg-white text-black rounded-3xl font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {initialMission ? 'Spara Ändringar' : 'Starta Uppdrag'}
          </button>
        </div>
      </div>
    </div>
  );
};
