
import React from 'react';
import { WorkoutSession } from '../types';
import { Share2, History, Settings, Plus, ChevronDown, MoreHorizontal } from 'lucide-react';

interface WorkoutLogProps {
  history: WorkoutSession[];
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ history }) => {
  // Mock current week for the calendar
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

  return (
    <div className="min-h-screen pb-40 animate-in fade-in duration-700">
      {/* ATHLETE HEADER */}
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

      {/* KALENDER SECTION */}
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

      {/* TIDIGARE PASS SECTION */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic italic tracking-tighter">Tidigare pass</h2>
          <button className="bg-white/5 p-2 rounded-lg border border-white/5">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-8 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[3px] top-2 bottom-0 w-[1px] bg-white/10"></div>

          {history.length > 0 ? (
            history.slice().reverse().map((session, idx) => (
              <div key={session.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-white/20 border border-[#0f0d15] z-10"></div>
                
                {/* Date and Duration Meta */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/60">
                    {formatDate(session.date)}
                  </span>
                  <span className="text-[10px] font-black text-white/40">
                    Längd: {session.duration ? Math.floor(session.duration / 60) : 0} min
                  </span>
                </div>

                {/* Workout Card */}
                <div className="bg-[#1a1721] rounded-3xl p-5 border border-white/5 flex gap-4 items-center shadow-lg relative group active:scale-[0.98] transition-all">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 overflow-hidden flex items-center justify-center border border-white/5">
                     <img 
                       src={`https://api.dicebear.com/7.x/identicon/svg?seed=${session.name}-${idx}`} 
                       className="w-10 h-10 opacity-30 grayscale"
                       alt="icon"
                     />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2 leading-none">
                      {session.name.toUpperCase()}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Övningar</span>
                        <span className="text-sm font-bold">{session.exercises.length}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Volym</span>
                        <span className="text-sm font-bold text-white/60">Auto</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-2 opacity-60">
                    <button><Share2 size={16} /></button>
                    <button><MoreHorizontal size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-white/20 font-black uppercase italic tracking-widest">
              Inga sparade pass ännu
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
