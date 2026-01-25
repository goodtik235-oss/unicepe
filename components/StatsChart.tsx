
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Caption } from '../types';

interface StatsChartProps {
  captions: Caption[];
}

const StatsChart: React.FC<StatsChartProps> = ({ captions }) => {
  if (captions.length === 0) return null;

  const data = captions.map((c, i) => ({
    name: `Seg ${i + 1}`,
    duration: parseFloat((c.end - c.start).toFixed(2)),
    words: c.text.split(' ').length
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{payload[0].payload.name}</p>
          <p className="text-sm font-bold text-white">{payload[0].value}s duration</p>
          <p className="text-xs text-indigo-400 mt-1">{payload[0].payload.words} words</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] h-64 w-full">
      <div className="flex items-center justify-between mb-4 px-2">
         <h3 className="font-bold text-slate-100 text-sm">Timing Distribution</h3>
         <span className="text-xs text-slate-500">{captions.length} Segments</span>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <XAxis dataKey="name" hide />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
          <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
