
import React, { useRef, useEffect } from 'react';
import { Caption, CaptionStyle } from '../types';

interface VideoPlayerProps {
  src: string | null;
  captions: Caption[];
  style?: CaptionStyle;
  onTimeUpdate: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, captions, style, onTimeUpdate }) => {
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
      <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500 flex-col shadow-2xl relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950"></div>
          <p className="font-medium relative z-10">No video loaded</p>
      </div>
    );
  }

  // Default styles
  const overlayStyle = style || { textColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.6)', fontSize: 1 };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative group">
      <video
        ref={videoRef}
        src={src}
        controls
        className="max-h-full max-w-full object-contain"
      />
      {currentCaption && (
        <div className="absolute bottom-[10%] left-0 right-0 text-center pointer-events-none p-4 w-full flex justify-center">
          <span 
            className="inline-block px-4 py-2 rounded-lg font-medium shadow-sm break-words max-w-[80%]"
            style={{
                color: overlayStyle.textColor,
                backgroundColor: overlayStyle.backgroundColor,
                fontSize: `${1.2 * overlayStyle.fontSize}rem`,
                lineHeight: 1.4,
                textShadow: overlayStyle.textColor === '#FFFFFF' ? '0px 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {currentCaption}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
