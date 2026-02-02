
import React, { useEffect } from 'react';
import { Caption } from '../types';
import { Clock, Edit2 } from 'lucide-react';

interface CaptionEditorProps {
  captions: Caption[];
  currentTime: number;
  onUpdateCaption: (id: string, text: string) => void;
  onSeek: (time: number) => void;
}

const CaptionEditor: React.FC<CaptionEditorProps> = ({ captions, currentTime, onUpdateCaption, onSeek }) => {
  const activeCaptionId = captions.find(c => currentTime >= c.start && currentTime <= c.end)?.id;

  // Auto-scroll active caption into view
  useEffect(() => {
    if (activeCaptionId) {
      const element = document.getElementById(`caption-${activeCaptionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeCaptionId]);
  
  if (captions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
         <Edit2 className="w-12 h-12 mb-4 opacity-20" />
         <p className="font-medium">No captions yet</p>
         <p className="text-xs opacity-50 mt-2">Transcribe your video to see and edit segments here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-white font-bold text-lg flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
            Editor ({captions.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {captions.map((cap) => {
          const isActive = currentTime >= cap.start && currentTime <= cap.end;
          return (
            <div
              key={cap.id}
              id={`caption-${cap.id}`}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div 
                className="flex items-center text-[10px] text-slate-500 mb-2 cursor-pointer hover:text-indigo-400"
                onClick={() => onSeek(cap.start)}
              >
                <Clock size={12} className="mr-1" />
                {formatTime(cap.start)} - {formatTime(cap.end)}
              </div>
              <textarea
                value={cap.text}
                onChange={(e) => onUpdateCaption(cap.id, e.target.value)}
                className="w-full bg-transparent text-slate-200 text-sm focus:outline-none resize-none min-h-[60px] leading-relaxed placeholder-slate-600"
                placeholder="Type caption here..."
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms}`;
}

export default CaptionEditor;
