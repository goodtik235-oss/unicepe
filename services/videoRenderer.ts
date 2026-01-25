
import { Caption } from "../types";

export const renderVideoWithCaptions = async (
  videoSrc: string,
  captions: Caption[],
  onProgress: (progress: number) => void,
  signal: AbortSignal,
  audioBlob: Blob | null
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.muted = true; // We might handle audio separately

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error("Could not get 2D context"));
      return;
    }

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Audio Context setup for mixing if needed
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      let sourceNode: AudioNode | null = null;

      if (audioBlob) {
        // Use dubbed audio
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(dest);
        bufferSource.start(0);
        sourceNode = bufferSource;
      } else {
         // Try to capture video audio if not muted and if possible
         // Note: Capturing audio from a video element created via JS without DOM insertion 
         // sometimes is restricted. For this prototype, if no dub, we rely on video.captureStream()
         // but since we are drawing to canvas, we need to combine streams.
      }

      // Stream from canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Combine tracks
      const combinedTracks = [...canvasStream.getVideoTracks()];
      
      if (audioBlob) {
        combinedTracks.push(...dest.stream.getAudioTracks());
      } else {
        // Attempt to get original audio
        // Note: Cross-origin issues might block this if video not local
        // Since we are using local file Blob URL, it should be fine.
        // However, capturing audio from a non-playing video element is tricky.
        // We will play the video.
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
        videoBitsPerSecond: 5000000 // 5 Mbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
        // Cleanup
        audioCtx.close();
      };

      mediaRecorder.start();

      // Playback loop
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
          const fontSize = Math.max(24, canvas.height * 0.05);
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.1;
          
          const text = currentCaption.text;
          const x = canvas.width / 2;
          const y = canvas.height - (canvas.height * 0.1);
          
          // Simple word wrap
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

          // Draw lines
          lines.reverse().forEach((l, i) => {
             const lineY = y - (i * fontSize * 1.2);
             ctx.strokeText(l, x, lineY);
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
