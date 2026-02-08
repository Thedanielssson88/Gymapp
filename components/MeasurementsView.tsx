
import React, { useState } from 'react';
import { UserProfile, BodyMeasurements } from '../types';
import { storage } from '../services/storage';
import { X, Check, Ruler, Plus, History } from 'lucide-react';

interface MeasurementsViewProps {
  profile: UserProfile;
  onUpdate: () => void;
}

export const MeasurementsView: React.FC<MeasurementsViewProps> = ({ profile, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleSave = () => {
    storage.setUserProfile(formData);
    onUpdate();
    setIsModalOpen(false);
  };

  const updateMeasurement = (key: keyof BodyMeasurements, val: string) => {
    const num = parseFloat(val) || 0;
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [key]: num
      }
    });
  };

  const m = profile.measurements || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#1a1721] rounded-[32px] p-8 border border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black italic uppercase">Aktuella Mått</h3>
          <Ruler size={20} className="text-accent-pink" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Metric label="Hals" value={m.neck} unit="cm" />
          <Metric label="Axlar" value={m.shoulders} unit="cm" />
          <Metric label="Bröst" value={m.chest} unit="cm" />
          <Metric label="Midja" value={m.waist} unit="cm" />
          <Metric label="Höft" value={m.hips} unit="cm" />
          <Metric label="Biceps (V/H)" value={`${m.bicepsL || 0} / ${m.bicepsR || 0}`} unit="cm" />
          <Metric label="Lår (V/H)" value={`${m.thighL || 0} / ${m.thighR || 0}`} unit="cm" />
          <Metric label="Vader" value={m.calves} unit="cm" />
          <Metric label="Fett %" value={m.bodyFat} unit="%" />
          <Metric label="Vikt" value={profile.weight} unit="kg" />
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-10 bg-white text-black py-5 rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={20} strokeWidth={3} /> Logga Mått
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-6 overflow-y-auto animate-in slide-in-from-bottom-4">
          <header className="flex justify-between items-center mb-10">
            <div>
              <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.3em] block mb-1">Update Biometrics</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Nya Mått</h3>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-2xl border border-white/10"><X size={28}/></button>
          </header>

          <div className="space-y-8 pb-32">
            <div className="grid grid-cols-2 gap-4">
               <InputBlock label="Vikt (kg)" value={formData.weight} onChange={(v) => setFormData({...formData, weight: parseFloat(v) || 0})} />
               <InputBlock label="Fett %" value={formData.measurements.bodyFat} onChange={(v) => updateMeasurement('bodyFat', v)} />
               <InputBlock label="Hals (cm)" value={formData.measurements.neck} onChange={(v) => updateMeasurement('neck', v)} />
               <InputBlock label="Axlar (cm)" value={formData.measurements.shoulders} onChange={(v) => updateMeasurement('shoulders', v)} />
               <InputBlock label="Bröst (cm)" value={formData.measurements.chest} onChange={(v) => updateMeasurement('chest', v)} />
               <InputBlock label="Midja (cm)" value={formData.measurements.waist} onChange={(v) => updateMeasurement('waist', v)} />
               <InputBlock label="Höft (cm)" value={formData.measurements.hips} onChange={(v) => updateMeasurement('hips', v)} />
               <InputBlock label="Vader (cm)" value={formData.measurements.calves} onChange={(v) => updateMeasurement('calves', v)} />
            </div>

            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6">
               <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest">Symmetri (Vänster / Höger)</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                     <InputBlock label="Biceps V" value={formData.measurements.bicepsL} onChange={(v) => updateMeasurement('bicepsL', v)} />
                     <InputBlock label="Lår V" value={formData.measurements.thighL} onChange={(v) => updateMeasurement('thighL', v)} />
                  </div>
                  <div className="space-y-4">
                     <InputBlock label="Biceps H" value={formData.measurements.bicepsR} onChange={(v) => updateMeasurement('bicepsR', v)} />
                     <InputBlock label="Lår H" value={formData.measurements.thighR} onChange={(v) => updateMeasurement('thighR', v)} />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-accent-pink py-6 rounded-3xl font-black italic tracking-widest uppercase shadow-2xl flex items-center justify-center gap-3 text-xl"
            >
              <Check size={24} strokeWidth={3} /> Spara Mått
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, unit }: { label: string; value: any; unit: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</span>
    <span className="text-xl font-bold italic">{value || '--'} <span className="text-[10px] text-white/20 not-italic font-black">{unit}</span></span>
  </div>
);

const InputBlock = ({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">{label}</label>
    <input 
      type="number" 
      step="0.1"
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-black text-lg outline-none focus:border-accent-pink" 
      placeholder="0.0"
    />
  </div>
);
