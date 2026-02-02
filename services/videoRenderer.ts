
import { Caption, CaptionStyle } from "../types";

export const renderVideoWithCaptions = async (
  videoSrc: string,
  captions: Caption[],
  style: CaptionStyle,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
  audioBlob: Blob | null
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.muted = true; 

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error("Could not get 2D context"));
      return;
    }

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Audio Context setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      let sourceNode: AudioNode | null = null;

      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(dest);
        bufferSource.start(0);
        sourceNode = bufferSource;
      }

      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];
      
      if (audioBlob) {
        combinedTracks.push(...dest.stream.getAudioTracks());
      } else {
        // In a real app we'd capture video audio, but browser restrictions often block cross-origin video audio capture
        // We'll proceed with silent video if no dub is provided for this prototype
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
      
      const mediaRecorder = new MediaRecorder(new MediaStream(combinedTracks), {
        mimeType,
        videoBitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
        audioCtx.close();
      };

      mediaRecorder.start();
      video.play();
      
      const drawFrame = () => {
        if (signal.aborted) {
            mediaRecorder.stop();
            video.pause();
            reject(new Error("Aborted"));
            return;
        }

        if (video.ended) {
          mediaRecorder.stop();
          return;
        }

        // Draw video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw Captions
        const currentTime = video.currentTime;
        const currentCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);

        if (currentCaption) {
          const baseFontSize = canvas.height * 0.05; // 5% of height
          const fontSize = baseFontSize * style.fontSize;
          
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          const text = currentCaption.text;
          const x = canvas.width / 2;
          const y = canvas.height - (canvas.height * 0.1);
          
          // Measure text for wrapping
          const maxWidth = canvas.width * 0.8;
          const words = text.split(' ');
          let line = '';
          const lines = [];

          for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          lines.reverse();

          // Draw background if needed
          if (style.backgroundColor !== 'transparent') {
             const padding = fontSize * 0.4;
             const lineHeight = fontSize * 1.3;
             const totalHeight = lines.length * lineHeight;
             const boxBottom = y + (fontSize * 0.2); // slight offset
             const boxTop = boxBottom - totalHeight - padding;
             
             // Simplistic box width calculation based on longest line
             let maxLineWidth = 0;
             lines.forEach(l => {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(l).width);
             });
             const boxWidth = maxLineWidth + (padding * 3);
             
             ctx.fillStyle = style.backgroundColor;
             ctx.fillRect(x - (boxWidth / 2), boxTop, boxWidth, totalHeight + padding);
          }

          // Draw Text
          ctx.fillStyle = style.textColor;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.05;
          
          lines.forEach((l, i) => {
             const lineY = y - (i * fontSize * 1.3);
             if (style.textColor === '#FFFFFF' || style.textColor === 'white') {
                 // Add stroke only for white text visibility
                 ctx.strokeText(l, x, lineY);
             }
             ctx.fillText(l, x, lineY);
          });
        }

        onProgress(video.currentTime / video.duration);
        
        if (video.paused || video.ended) {
             // Stop loop
        } else {
             requestAnimationFrame(drawFrame);
        }
      };

      drawFrame();
    };
    
    video.onerror = (e) => reject(new Error("Video load error"));
  });
};
