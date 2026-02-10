
import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Save } from 'lucide-react';

interface WorkoutHeaderProps {
  timer: number;
  isTimerActive: boolean;
  onToggleTimer: () => void;
  onCancel: () => void;
  onSaveRoutine: () => void;
  sessionName: string; // New prop for session name
  onUpdateSessionName: (name: string) => void; // New prop for updating session name
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  timer,
  isTimerActive,
  onToggleTimer,
  onCancel,
  onSaveRoutine,
  sessionName, // Destructure new prop
  onUpdateSessionName, // Destructure new prop
}) => {
  const [editableSessionName, setEditableSessionName] = useState(sessionName);

  // Update local state if sessionName prop changes (e.g., when a new session starts)
  useEffect(() => {
    setEditableSessionName(sessionName);
  }, [sessionName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditableSessionName(newName);
    onUpdateSessionName(newName); // Call the callback to update the parent state and storage
  };

  return (
    <header className="px-4 pt-8 flex justify-between items-start">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleTimer}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTimerActive ? 'bg-accent-pink/20 text-accent-pink shadow-[0_0_15px_rgba(255,45,85,0.2)]' : 'bg-white/5 text-white/40'}`}
        >
           {isTimerActive ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <div>
          {/* Editable Session Name */}
          <input 
            type="text"
            value={editableSessionName}
            onChange={handleNameChange}
            placeholder="Passets namn"
            className="bg-transparent text-xl font-black italic text-white leading-none outline-none focus:border-b-2 focus:border-accent-pink pb-1 w-full"
          />
          <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mt-1">Workout Timer: {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onCancel}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-95 transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button 
          onClick={onSaveRoutine}
          className="p-3 bg-white/5 rounded-xl border border-white/5 text-white/60 hover:text-white transition-all flex items-center gap-2 active:scale-95"
        >
           <Save size={18} />
           <span className="text-[10px] font-black uppercase">Spara Mall</span>
        </button>
      </div>
    </header>
  );
};