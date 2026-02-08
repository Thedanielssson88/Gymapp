
import React, { useState, useEffect } from 'react';
import { Zone, Equipment } from '../types';
import { storage } from '../services/storage';
import { MapPin, Plus, Edit2, Trash2, X, Check, Save, Dumbbell, Home, Trees } from 'lucide-react';

export const LocationManager: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = () => {
    setZones(storage.getZones());
  };

  const handleSave = (zone: Zone) => {
    storage.saveZone(zone);
    setEditingZone(null);
    loadZones();
  };

  const handleDelete = (id: string) => {
    if (confirm("Är du säker på att du vill ta bort denna plats?")) {
      storage.deleteZone(id);
      loadZones();
    }
  };

  const createNew = () => {
    setEditingZone({
      id: `zone-${Date.now()}`,
      name: '',
      icon: 'map-pin',
      inventory: [] 
    });
  };

  return (
    <div className="pb-40 animate-in fade-in space-y-6 px-4 pt-8">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Mina Platser</h2>
          <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Hantera utrustning & gym</p>
        </div>
        <button 
          onClick={createNew}
          className="p-4 bg-accent-pink text-white rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      <div className="space-y-4">
        {zones.map(zone => (
          <div key={zone.id} onClick={() => setEditingZone(zone)} className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5 flex items-center justify-between group active:scale-95 transition-all cursor-pointer">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-accent-blue border border-white/5">
                 {zone.name.toLowerCase().includes('hem') ? <Home size={32} /> : 
                  zone.name.toLowerCase().includes('ute') ? <Trees size={32} /> : 
                  <Dumbbell size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{zone.name}</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">
                  {zone.inventory.length} Redskap tillgängliga
                </p>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-full text-text-dim group-hover:bg-accent-blue group-hover:text-black transition-colors">
              <Edit2 size={18} />
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <MapPin size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Inga platser tillagda</p>
          </div>
        )}
      </div>

      {editingZone && (
        <LocationEditor 
          zone={editingZone} 
          onClose={() => setEditingZone(null)} 
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

interface LocationEditorProps {
  zone: Zone;
  onClose: () => void;
  onSave: (z: Zone) => void;
  onDelete: (id: string) => void;
}

const LocationEditor: React.FC<LocationEditorProps> = ({ zone, onClose, onSave, onDelete }) => {
  const [localZone, setLocalZone] = useState<Zone>(zone);

  const toggleEquipment = (eq: Equipment) => {
    const hasIt = localZone.inventory.includes(eq);
    let newInv = [];
    if (hasIt) {
      newInv = localZone.inventory.filter(i => i !== eq);
    } else {
      newInv = [...localZone.inventory, eq];
    }
    setLocalZone({ ...localZone, inventory: newInv });
  };

  const applyPreset = (type: 'gym' | 'home' | 'body') => {
    let newInv: Equipment[] = [];
    if (type === 'gym') {
      newInv = Object.values(Equipment).filter(e => e !== Equipment.BANDS); 
    } else if (type === 'home') {
      newInv = [Equipment.DUMBBELL, Equipment.KETTLEBELL, Equipment.BANDS, Equipment.BODYWEIGHT];
    } else {
      newInv = [Equipment.BODYWEIGHT];
    }
    setLocalZone({ ...localZone, inventory: newInv });
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[200] flex flex-col p-6 animate-in slide-in-from-bottom-10 duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Redigera Plats</h3>
          <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-black">Konfigurera utrustning</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl"><X size={24}/></button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-8 pb-32 scrollbar-hide">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim ml-1">Namn</label>
          <input 
            type="text" 
            value={localZone.name}
            onChange={e => setLocalZone({...localZone, name: e.target.value})}
            placeholder="T.ex. Nordic Wellness"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-xl font-black italic uppercase text-white outline-none focus:border-accent-pink transition-all"
          />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim ml-1">Snabbval</label>
           <div className="flex gap-2">
             <button onClick={() => applyPreset('gym')} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all">Fullt Gym</button>
             <button onClick={() => applyPreset('home')} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all">Hemma</button>
             <button onClick={() => applyPreset('body')} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 active:scale-95 transition-all">Kroppsvikt</button>
           </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim ml-1">Tillgänglig Utrustning</label>
          <div className="grid grid-cols-2 gap-3 pb-8">
            {Object.values(Equipment).map((eq) => {
              const isSelected = localZone.inventory.includes(eq);
              return (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`p-5 rounded-[24px] border text-left flex items-center gap-4 transition-all ${
                    isSelected 
                      ? 'bg-accent-blue/10 border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                      : 'bg-white/5 border-white/5 text-text-dim opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'border-accent-blue bg-accent-blue text-black' : 'border-white/20'}`}>
                    {isSelected && <Check size={14} strokeWidth={4} />}
                  </div>
                  <span className="font-black uppercase italic text-[11px] tracking-tight">{eq}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-6 border-t border-white/5 bg-[#0f0d15]/80 backdrop-blur-xl">
        <button 
          onClick={() => onSave(localZone)}
          disabled={!localZone.name}
          className="w-full py-6 bg-white text-black rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
        >
          <Save size={24} /> Spara ändringar
        </button>

        <button 
          onClick={() => onDelete(localZone.id)}
          className="w-full py-4 bg-red-500/5 border border-red-500/10 text-red-500/60 rounded-[24px] font-black italic text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white active:scale-95 transition-all"
        >
           Radera Plats
        </button>
      </div>
    </div>
  );
};
