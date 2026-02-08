
import React, { useState, useMemo } from 'react';
import { WorkoutSession, Exercise } from '../types';
import { Share2, History, Settings, Plus, ChevronDown, MoreHorizontal, X, Clock, Activity, Zap, ShieldCheck, Heart, Info, ChevronRight, Dumbbell } from 'lucide-react';

interface WorkoutLogProps {
  history: WorkoutSession[];
  allExercises: Exercise[];
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ history, allExercises }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const today = new Date();
  const weekDays = ['SÖ', 'MÅ', 'TI', 'ON', 'TO', 'FR', 'LÖ'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - today.getDay() + i);
    return {
      day: weekDays[d.getDay()],
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString()
    };
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${monthNames[d.getMonth()].toUpperCase()}`;
  };

  const selectedSession = useMemo(() => 
    history.find(s => s.id === selectedSessionId), 
    [selectedSessionId, history]
  );

  const calculateTotalVolume = (session: WorkoutSession) => {
    return session.exercises.reduce((total, pe) => {
      const exVol = pe.sets.reduce((sum, s) => s.completed ? sum + (s.weight * s.reps) : sum, 0);
      return total + exVol;
    }, 0);
  };

  const getFeelingIcon = (feeling?: string) => {
    switch(feeling?.toLowerCase()) {
      case 'pigg': return '⚡';
      case 'stark': return '💪';
      case 'trött': return '😴';
      case 'sliten': return '🤕';
      default: return '😐';
    }
  };

  const getRpeColor = (rpe?: number) => {
    if (!rpe) return 'text-text-dim';
    if (rpe <= 4) return 'text-green-400';
    if (rpe <= 7) return 'text-accent-blue';
    if (rpe <= 9) return 'text-orange-400';
    return 'text-accent-pink';
  };

  return (
    <div className="min-h-screen pb-40 animate-in fade-in duration-700">
      <header className="px-6 pt-8 pb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black tracking-tighter">Athlete</h1>
        <div className="flex gap-4 items-center">
          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <Share2 size={22} />
          </button>
          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <History size={22} />
          </button>
          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <Settings size={22} />
          </button>
        </div>
      </header>

      <section className="px-6 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Kalender</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-white/60">
            {monthNames[today.getMonth()]} <ChevronDown size={14} />
          </button>
        </div>
        
        <div className="flex justify-between">
          {calendarDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <span className={`text-[10px] font-black tracking-widest ${d.isToday ? 'text-white' : 'text-white/40'}`}>
                {d.day}
              </span>
              <span className={`text-base font-bold ${d.isToday ? 'text-white' : 'text-white/40'}`}>
                {d.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter">Tidigare pass</h2>
          <button className="bg-white/5 p-2 rounded-lg border border-white/5">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-8 relative">
          <div className="absolute left-[3px] top-2 bottom-0 w-[1px] bg-white/10"></div>

          {history.length > 0 ? (
            history.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, idx) => (
              <div key={session.id} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-white/20 border border-[#0f0d15] z-10"></div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/60">
                    {formatDate(session.date)}
                  </span>
                  <div className="flex items-center gap-3">
                    {session.rpe && (
                       <span className={`text-[9px] font-black uppercase tracking-widest ${getRpeColor(session.rpe)}`}>
                         RPE {session.rpe}
                       </span>
                    )}
                    <span className="text-[10px] font-black text-white/40">
                      {session.duration ? Math.floor(session.duration / 60) : 0} min
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSessionId(session.id)}
                  className="w-full text-left bg-[#1a1721] rounded-3xl p-5 border border-white/5 flex gap-4 items-center shadow-lg relative group active:scale-[0.98] transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 overflow-hidden flex items-center justify-center border border-white/5">
                     <img 
                       src={`https://api.dicebear.com/7.x/identicon/svg?seed=${session.name}-${idx}`} 
                       className="w-10 h-10 opacity-30 grayscale"
                       alt="icon"
                     />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2 leading-none group-hover:text-accent-pink transition-colors">
                      {session.name.toUpperCase()}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Övningar</span>
                        <span className="text-sm font-bold">{session.exercises.length}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Volym</span>
                        <span className="text-sm font-bold text-white/60">{calculateTotalVolume(session).toLocaleString()} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-2 opacity-60">
                    <ChevronRight size={18} className="text-white/20 group-hover:text-accent-pink group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-white/20 font-black uppercase italic tracking-widest">
              Inga sparade pass ännu
            </div>
          )}
        </div>
      </section>

      {selectedSession && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-0 flex flex-col animate-in slide-in-from-bottom-6 duration-500 overflow-y-auto scrollbar-hide">
          <header className="px-6 pt-12 pb-8 flex justify-between items-start sticky top-0 bg-[#0f0d15]/80 backdrop-blur-xl z-10 border-b border-white/5">
            <div>
              <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.4em] block mb-2">
                {formatDate(selectedSession.date)} • {selectedSession.duration ? Math.floor(selectedSession.duration / 60) : 0} MIN
              </span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedSession.name}</h2>
            </div>
            <button 
              onClick={() => setSelectedSessionId(null)} 
              className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-white"
            >
              <X size={28}/>
            </button>
          </header>

          <div className="p-6 space-y-8 pb-32">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-accent-blue" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Ansträngning</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black italic ${getRpeColor(selectedSession.rpe)}`}>
                    {selectedSession.rpe || '--'}
                  </span>
                  <span className="text-[10px] font-bold text-white/20 uppercase">RPE</span>
                </div>
              </div>
              
              <div className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-accent-pink" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">Känsla</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getFeelingIcon(selectedSession.feeling)}</span>
                  <span className="text-lg font-black italic uppercase text-white/80">{selectedSession.feeling || 'OK'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                   <Activity size={18} className="text-accent-pink" />
                   <h4 className="text-xs font-black uppercase tracking-[0.2em]">Övningar & Belastning</h4>
                 </div>
                 <span className="text-[10px] font-black text-white/40 uppercase">Totalt {calculateTotalVolume(selectedSession).toLocaleString()} kg</span>
              </div>

              <div className="space-y-6">
                {selectedSession.exercises.map((pe, idx) => {
                  const ex = allExercises.find(e => e.id === pe.exerciseId);
                  const completedSets = pe.sets.filter(s => s.completed);
                  const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
                  
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                             <Dumbbell size={14} className="text-white/20" />
                           </div>
                           <div>
                             <h5 className="font-black uppercase italic text-sm tracking-tight leading-none">{ex?.name || 'Okänd Övning'}</h5>
                             <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">{ex?.pattern}</span>
                           </div>
                        </div>
                        <span className="text-[9px] font-black text-accent-pink uppercase">{exerciseVolume.toLocaleString()} KG</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 pl-11">
                        {pe.sets.map((set, sIdx) => (
                          <div key={sIdx} className={`flex items-center justify-between text-[11px] py-1 px-3 rounded-lg border ${set.completed ? 'bg-white/5 border-white/5' : 'bg-transparent border-white/5 opacity-30'}`}>
                             <div className="flex items-center gap-4">
                               <span className="font-black text-text-dim/60 w-3">{sIdx + 1}</span>
                               <span className="font-bold text-white/80">{set.weight} kg <span className="text-[8px] text-white/20 mx-1">x</span> {set.reps} reps</span>
                             </div>
                             {set.completed ? (
                               <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/20" />
                             ) : (
                               <div className="w-3 h-3 rounded-full border border-white/10" />
                             )}
                          </div>
                        ))}
                      </div>

                      {pe.notes && (
                        <div className="pl-11 pt-1">
                          <p className="text-[10px] italic text-text-dim font-medium border-l-2 border-accent-pink/20 pl-3">"{pe.notes}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              className="w-full py-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center gap-3 text-white/60 font-black uppercase tracking-[0.2em] italic active:scale-95 transition-all"
              onClick={() => {
                const text = `Jag tränade ${selectedSession.name} i ${Math.floor((selectedSession.duration || 0) / 60)} minuter och lyfte totalt ${calculateTotalVolume(selectedSession)} kg! #MorphFit`;
                if(navigator.share) {
                  navigator.share({ title: 'Mitt MorphFit Pass', text: text });
                } else {
                  alert("Kopierat till urklipp!");
                  navigator.clipboard.writeText(text);
                }
              }}
            >
              <Share2 size={18} /> Dela Passet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
