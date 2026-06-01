import React, { useState } from 'react';
import { Modal, Button, Input, toast } from '../ui';
import { Calculator } from 'lucide-react';

interface RMEntry {
  percentage: number;
  weight: number;
  reps: number;
}

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

const calculateRM = (weight: number, reps: number): RMEntry[] | null => {
  if (weight <= 0 || reps <= 0) return null;
  // Epley formula: 1RM = weight * (1 + reps / 30)
  const rm = weight * (1 + reps / 30);
  return PERCENTAGES.map(pct => {
    const w = rm * pct / 100;
    const estimatedReps = Math.max(1, Math.round(30 * (100 / pct - 1)));
    return { percentage: pct, weight: Math.round(w * 100) / 100, reps: estimatedReps };
  });
};

const OneRMCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [results, setResults] = useState<RMEntry[] | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!w || !r || w <= 0 || r <= 0) {
      toast.error('Ingresa peso y repeticiones válidos');
      return;
    }
    const table = calculateRM(w, r);
    setResults(table);
  };

  const handleClose = () => {
    setIsOpen(false);
    setResults(null);
    setWeight('');
    setReps('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all animate-in fade-in"
        title="Calculadora 1RM"
      >
        <Calculator size={20} />
        <span className="font-bold text-sm">RM</span>
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Calculadora 1RM" size="md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso (kg)"
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Ej: 80"
              min={1}
            />
            <Input
              label="Repeticiones"
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="Ej: 8"
              min={1}
            />
          </div>

          <Button fullWidth onClick={handleCalculate}>
            <Calculator size={18} className="mr-2" /> Calcular RM
          </Button>

          {results && (
            <div className="overflow-x-auto">
              <p className="text-sm text-slate-500 mb-3">
                1RM estimado: <strong className="text-slate-900 dark:text-white">{results[0].weight} kg</strong> (Fórmula de Epley)
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 font-semibold text-slate-500">%</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-500">Peso (kg)</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-500">Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(row => (
                    <tr key={row.percentage} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-2 px-3 font-medium">{row.percentage}%</td>
                      <td className="py-2 px-3 text-right font-mono">{row.weight}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">{row.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default OneRMCalculator;
