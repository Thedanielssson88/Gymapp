
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, ChevronUp, ChevronDown, Scale } from 'lucide-react';
import { PlateDisplay } from './PlateDisplay';

interface NumberPickerModalProps {
  title: string;
  unit: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  barWeight?: number;
  onSave: (value: number) => void;
  onClose: () => void;
}

export const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  title, unit, value, step = 1, min = 0, max = 99999, precision = 2, barWeight = 0, onSave, onClose
}) => {
  const [localVal, setLocalVal] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleStep = (direction: 'up' | 'down') => {
    const currentNum = parseFloat(localVal) || 0;
    const newValue = direction === 'up' ? currentNum + step : currentNum - step;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    if (precision === 0) {
        setLocalVal(Math.round(clampedValue).toString());
    } else {
        setLocalVal(parseFloat(clampedValue.toFixed(precision)).toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (precision === 0) {
      val = val.replace(/[^0-9]/g, '');
    } else {
      val = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    }
    setLocalVal(val);
  };

  const handleQuickSelect = (val: number) => {
    if (precision === 0) {
        setLocalVal(Math.round(val).toString());
    } else {
        setLocalVal(parseFloat(val.toFixed(precision)).toString());
    }
  };

  const handleFinalSave = () => {
    const num = parseFloat(localVal) || 0;
    const rounded = precision === 0 ? Math.round(num) : parseFloat(num.toFixed(precision));
    onSave(Math.max(min, Math.min(max, rounded)));
  };

  const quickValues = useMemo(() => {
    const numValue = parseFloat(localVal) || 0;
    let values: number[] = [];

    if (unit === 'kg') {
      if (numValue === 0) values = [2.5, 5, 10, 15, 20, 25];
      else if (numValue >= 40) {
        values = [numValue - 20, numValue - 10, numValue - 5, numValue + 5, numValue + 10, numValue + 20];
      } else {
        values = [numValue - 10, numValue - 5, numValue - 2.5, numValue + 2.5, numValue + 5, numValue + 10];
      }
    } else if (unit === 'm') {
      values = [100, 400, 1000, 2000, 5000];
    } else if (unit === 'reps') {
      if (numValue <= 5) values = [1, 3, 5, 8, 10, 12, 15];
      else values = [numValue - 5, numValue - 2, numValue - 1, numValue + 1, numValue + 2, numValue + 5];
    }
    
    return [...new Set(values)]
      .map(v => (precision === 0) ? Math.round(v) : parseFloat(v.toFixed(precision)))
      .filter(v => v >= min && v <= max && v !== numValue)
      .sort((a, b) => a - b);
      
  }, [localVal, unit, min, max, precision]);


  const currentNumericWeight = parseFloat(localVal) || 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#0f0d15]/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-4 w-full justify-between">
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleStep('down')}
              className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"
            >
              <ChevronDown size={32} strokeWidth={3} />
            </button>

            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-baseline justify-center w-full">
                <input 
                  ref={inputRef}
                  type="text"
                  inputMode={precision === 0 ? "numeric" : "decimal"}
                  value={localVal}
                  onChange={handleInputChange}
                  className="bg-transparent text-6xl font-black text-white w-full text-center outline-none focus:text-accent-pink transition-colors caret-accent-pink"
                  placeholder="0"
                />
              </div>
              <span className="text-sm font-black italic text-accent-blue uppercase tracking-widest mt-1">{unit}</span>
            </div>

            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleStep('up')}
              className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"
            >
              <ChevronUp size={32} strokeWidth={3} />
            </button>
          </div>
          
          {unit === 'kg' && barWeight > 0 && <PlateDisplay weight={currentNumericWeight} barWeight={barWeight} />}
        </div>

        <div className="border-t border-white/5 pt-6 space-y-3 mb-6">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-text-dim">Smarta Förslag</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {quickValues.map(val => (
              <button
                key={val}
                onClick={() => handleQuickSelect(val)}
                className="flex-shrink-0 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-colors"
              >
                {unit === 'm' && val >= 1000 ? `${val/1000}km` : `${val}${unit !== 'reps' ? 'kg' : ''}`}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleFinalSave}
          className="w-full py-5 bg-white text-black rounded-[24px] font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={24} strokeWidth={4} /> Spara
        </button>
      </div>
    </div>
  );
};
