
import React, { useRef, useEffect } from 'react';
import { Caption } from '../types';

interface VideoPlayerProps {
  src: string | null;
  captions: Caption[];
  onTimeUpdate: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, captions, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentCaption, setCurrentCaption] = React.useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      onTimeUpdate(time);
      
      const cap = captions.find(c => time >= c.start && time <= c.end);
      setCurrentCaption(cap ? cap.text : null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [captions, onTimeUpdate]);

  if (!src) {
    return (
      <div className="aspect-video bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-center justify-center text-slate-500 flex-col shadow-2xl">
         <p className="font-medium">No video loaded</p>
         <p className="text-sm opacity-50 mt-2">Upload a video to begin localization</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl group border border-slate-800">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full object-contain"
      />
      {currentCaption && (
        <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none p-4">
          <span className="inline-block bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-lg md:text-xl font-medium shadow-lg">
            {currentCaption}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
