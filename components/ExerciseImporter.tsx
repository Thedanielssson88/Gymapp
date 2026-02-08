
import React, { useState } from 'react';
import { Search, Download, Loader2, Globe, X } from 'lucide-react';
import { searchWger, fetchWgerDetails } from '../services/wger';
import { Exercise } from '../types';

interface ExerciseImporterProps {
  onImport: (exerciseData: Partial<Exercise>) => void;
  onClose: () => void;
}

export const ExerciseImporter: React.FC<ExerciseImporterProps> = ({ onImport, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    const hits = await searchWger(query);
    setResults(hits);
    setLoading(false);
  };

  const handleSelect = async (item: any) => {
    const id = item.data.id;
    const name = item.value;
    setImportingId(id);
    const details = await fetchWgerDetails(id, name);
    onImport(details);
    setImportingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0d15] animate-in slide-in-from-bottom-10 duration-300">
      <header className="flex justify-between items-center p-6 pb-2">
        <div>
          <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.3em] block mb-1">Global Import</span>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter">Wger Database</h3>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-text-dim hover:text-white transition-all">
          <X size={24}/>
        </button>
      </header>
      
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} />
          <input 
            autoFocus
            type="text" 
            placeholder="Sök globalt (ex: Bench Press)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold text-white placeholder:text-white/20 transition-all"
          />
        </div>
        <button 
            onClick={handleSearch} 
            disabled={loading}
            className="bg-accent-pink text-white p-5 rounded-[24px] shadow-[0_0_15px_rgba(255,45,85,0.3)] disabled:opacity-50 active:scale-95 transition-all"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {results.length > 0 ? (
          results.map((item) => (
            <button 
              key={item.data.id} 
              onClick={() => handleSelect(item)}
              disabled={importingId === item.data.id}
              className="w-full p-6 bg-[#1a1721] border border-white/5 rounded-[32px] flex justify-between items-center group hover:border-white/20 text-left active:scale-[0.98] transition-all shadow-lg"
            >
              <div className="flex-1">
                 <span className="font-black italic uppercase text-lg block tracking-tight leading-tight mb-1 group-hover:text-accent-pink transition-colors">{item.value}</span>
                 <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 text-[8px] font-black uppercase text-text-dim tracking-widest">Global Library</div>
                   <span className="text-[9px] text-white/20 uppercase font-black">ID: {item.data.id}</span>
                 </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl text-text-dim group-hover:bg-accent-pink group-hover:text-white transition-all shadow-inner">
                  {importingId === item.data.id ? <Loader2 size={20} className="animate-spin"/> : <Download size={20} />}
              </div>
            </button>
          ))
        ) : !loading && (
            <div className="py-32 text-center opacity-20 flex flex-col items-center justify-center space-y-4">
                <Globe size={64} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] max-w-[200px]">Sök efter övningar i det globala molnet</p>
            </div>
        )}
      </div>
    </div>
  );
};
