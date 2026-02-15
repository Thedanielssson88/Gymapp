
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, Plus, Check, Search, Dumbbell, ArrowRight } from 'lucide-react';
import { recommendExercises, ExerciseRecommendation } from '../services/geminiService';
import { storage } from '../services/storage';
import { Exercise } from '../types';

interface AIExerciseRecommenderProps {
  onEditExercise: (exerciseId: string) => void;
}

export const AIExerciseRecommender: React.FC<AIExerciseRecommenderProps> = ({ onEditExercise }) => {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setAllExercises(await storage.getAllExercises());
  };

  const handleSearch = async () => {
    if (!request.trim()) return;
    setLoading(true);
    setRecommendations([]);
    try {
      const result = await recommendExercises(request, allExercises);
      setRecommendations(result);
    } catch (e) {
      alert("Kunde inte hämta förslag. Kontrollera din anslutning.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (rec: ExerciseRecommendation) => {
    if (!rec.isNew) return;
    try {
      await storage.saveExercise(rec.data);
      setAddedIds(prev => [...prev, rec.data.id]);
      await loadLibrary();
    } catch (e) {
      alert("Kunde inte spara övningen.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-[#1a1721] to-[#2a2435] p-6 rounded-[32px] border border-accent-blue/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-blue/10 rounded-full">
                    <Dumbbell className="text-accent-blue" size={24} />
                </div>
                <h2 className="text-xl font-black uppercase italic text-white">Övnings-scout</h2>
            </div>
            
            <p className="text-xs text-text-dim mb-4 leading-relaxed">
                Behöver du övningar för Hyrox, bättre hållning eller explosivitet? Jag scannar ditt bibliotek och hittar det som passar eller skapar det som saknas.
            </p>

            <textarea 
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="T.ex. 'Jag vill träna inför Hyrox' eller 'Övningar för stela höfter'..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base min-h-[100px] focus:border-accent-blue outline-none transition-all resize-none mb-4 shadow-inner"
            />

            <button 
                onClick={handleSearch}
                disabled={loading || !request}
                className="w-full bg-accent-blue text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-accent-blue/20"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={18} strokeWidth={3} />}
                {loading ? 'SCANNAR BIBLIOTEKET...' : 'HITTA ÖVNINGAR'}
            </button>
        </div>

        <div className="space-y-3 pb-24">
            {recommendations.map((rec, idx) => {
                const isJustAdded = addedIds.includes(rec.data.id);
                const isExisting = !rec.isNew || isJustAdded;

                return (
                    <div key={idx} className="bg-[#1a1721] p-5 rounded-[28px] border border-white/5 flex flex-col gap-4 animate-in slide-in-from-bottom-2 shadow-lg" style={{animationDelay: `${idx * 80}ms`}}>
                        <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h3 className="text-white font-black italic uppercase text-lg truncate leading-none">{rec.data.name}</h3>
                                    {rec.isNew && !isJustAdded && (
                                        <span className="bg-purple-500/20 text-purple-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple-500/30">Ny</span>
                                    )}
                                    {isExisting && (
                                        <span className="bg-white/5 text-text-dim text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">Finns</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-accent-blue italic leading-snug">"{rec.reason}"</p>
                            </div>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                            {rec.data.primaryMuscles.map(m => (
                                <span key={m} className="text-[8px] font-black uppercase bg-white/5 text-text-dim px-2 py-1 rounded-lg border border-white/5">{m}</span>
                            ))}
                            <span className="text-[8px] font-black uppercase bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-lg border border-accent-blue/20">{rec.data.equipment[0]}</span>
                        </div>

                        <div className="pt-2">
                            {isExisting ? (
                                <button 
                                    onClick={() => onEditExercise(rec.data.id)}
                                    className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
                                >
                                    Se detaljer <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleAddExercise(rec)}
                                    className="w-full py-3.5 rounded-2xl bg-[#2ed573] hover:bg-[#26b963] text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/10"
                                >
                                    <Plus size={16} strokeWidth={3} /> Lägg till i bibliotek
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {recommendations.length > 0 && (
              <div className="py-8 text-center opacity-30">
                <Sparkles size={24} className="mx-auto mb-2" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em]">AI-Generated Results</p>
              </div>
            )}
        </div>
    </div>
  );
};
