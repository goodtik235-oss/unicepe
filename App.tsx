
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Languages, Download, Wand2, Loader2, AlertTriangle, 
  Film, LogOut, Mic, Square, PlayCircle, Volume2, Sparkles, ChevronRight
} from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CaptionEditor from './components/CaptionEditor';
import StatsChart from './components/StatsChart';
import { Caption, ProcessingStatus, SUPPORTED_LANGUAGES } from './types';
import { extractAudioFromVideo, base64ToWavBlob } from './services/audioUtils';
import { transcribeAudio, translateCaptions, generateSpeech } from './services/geminiService';
import { renderVideoWithCaptions } from './services/videoRenderer';

function App() {
  // App Logic State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [selectedLang, setSelectedLang] = useState<string>('ur-PK');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [dubbedAudioBlob, setDubbedAudioBlob] = useState<Blob | null>(null);
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState<string | null>(null);
  const [useDubbing, setUseDubbing] = useState(false);
  const [isDubPreviewPlaying, setIsDubPreviewPlaying] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processAbortControllerRef = useRef<AbortController | null>(null);
  const dubPreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup object URLs automatically via useEffect
  useEffect(() => {
    return () => {
      if (dubbedAudioUrl) URL.revokeObjectURL(dubbedAudioUrl);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [dubbedAudioUrl, videoSrc]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Don't manually revoke here; let the useEffect cleanup handle the old videoSrc
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFile(file);
      setCaptions([]);
      setStatus(ProcessingStatus.IDLE);
      setErrorMsg(null);
      setRenderingProgress(0);
      setDubbedAudioBlob(null);
      setDubbedAudioUrl(null);
      setUseDubbing(false);
    }
  };

  const handleStopProcessing = () => {
    if (processAbortControllerRef.current) {
      processAbortControllerRef.current.abort();
      processAbortControllerRef.current = null;
    }
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg("Process aborted by user.");
  };

  const handleGenerateCaptions = async () => {
    if (!videoFile) return;
    if (processAbortControllerRef.current) processAbortControllerRef.current.abort();
    const controller = new AbortController();
    processAbortControllerRef.current = controller;

    try {
      setErrorMsg(null);
      setStatus(ProcessingStatus.EXTRACTING_AUDIO);
      const audioBase64 = await extractAudioFromVideo(videoFile);
      if (controller.signal.aborted) return;
      
      setStatus(ProcessingStatus.TRANSCRIBING);
      const generatedCaptions = await transcribeAudio(audioBase64, controller.signal);
      if (controller.signal.aborted) return;
      
      setCaptions(generatedCaptions);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg(err.message || "An unknown error occurred.");
    }
  };

  const handleTranslate = async () => {
    if (captions.length === 0) return;
    if (processAbortControllerRef.current) processAbortControllerRef.current.abort();
    const controller = new AbortController();
    processAbortControllerRef.current = controller;

    try {
      setStatus(ProcessingStatus.TRANSLATING);
      const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name || "English";
      const translated = await translateCaptions(captions, targetLangName, controller.signal);
      if (controller.signal.aborted) return;
      
      setCaptions(translated);
      setDubbedAudioBlob(null);
      setDubbedAudioUrl(null);
      setUseDubbing(false);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("Translation failed: " + err.message);
    }
  };

  const handleDubbing = async () => {
    if (captions.length === 0) return;
    if (processAbortControllerRef.current) processAbortControllerRef.current.abort();
    const controller = new AbortController();
    processAbortControllerRef.current = controller;

    try {
      setStatus(ProcessingStatus.GENERATING_SPEECH);
      setErrorMsg(null);
      
      const fullText = captions.map(c => c.text).join('. ');
      const audioBase64 = await generateSpeech(fullText, controller.signal);
      if (controller.signal.aborted) return;
      
      const blob = base64ToWavBlob(audioBase64, 24000);
      const url = URL.createObjectURL(blob);

      setDubbedAudioBlob(blob);
      setDubbedAudioUrl(url);
      setUseDubbing(true);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("Dubbing failed: " + err.message);
    }
  };

  const toggleDubPreview = () => {
    if (!dubPreviewAudioRef.current) return;
    
    if (isDubPreviewPlaying) {
      dubPreviewAudioRef.current.pause();
      setIsDubPreviewPlaying(false);
    } else {
      dubPreviewAudioRef.current.currentTime = 0;
      dubPreviewAudioRef.current.play();
      setIsDubPreviewPlaying(true);
    }
  };

  const handleDownloadSRT = () => {
    let srtContent = "";
    const formatSRTTime = (seconds: number) => {
      const date = new Date(0);
      date.setMilliseconds(seconds * 1000);
      return date.toISOString().substring(11, 23).replace('.', ',');
    };

    captions.forEach((cap, index) => {
      const start = formatSRTTime(cap.start);
      const end = formatSRTTime(cap.end);
      srtContent += `${index + 1}\n${start} --> ${end}\n${cap.text}\n\n`;
    });
    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "captions.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportVideo = async () => {
    if (!videoSrc || captions.length === 0) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setStatus(ProcessingStatus.RENDERING);
      setRenderingProgress(0);
      const audioToUse = useDubbing ? dubbedAudioBlob : null;
      const blob = await renderVideoWithCaptions(
        videoSrc, 
        captions, 
        (progress) => setRenderingProgress(progress),
        controller.signal,
        audioToUse
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aha_studio_export_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus(ProcessingStatus.IDLE);
      } else {
        setStatus(ProcessingStatus.ERROR);
        setErrorMsg("Render error: " + err.message);
      }
    } finally {
      setRenderingProgress(0);
      abortControllerRef.current = null;
    }
  };

  const updateCaption = (id: string, newText: string) => {
    setCaptions(prev => prev.map(c => {
      if (c.id === id) return { ...c, text: newText };
      return c;
    }));
  };

  const isProcessing = [
    ProcessingStatus.EXTRACTING_AUDIO, 
    ProcessingStatus.TRANSCRIBING, 
    ProcessingStatus.TRANSLATING, 
    ProcessingStatus.GENERATING_SPEECH
  ].includes(status);
  
  const isRendering = status === ProcessingStatus.RENDERING;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative selection:bg-indigo-500/30">
      
      {dubbedAudioUrl && (
        <audio 
          ref={dubPreviewAudioRef} 
          src={dubbedAudioUrl} 
          onEnded={() => setIsDubPreviewPlaying(false)}
          className="hidden"
        />
      )}

      {/* Processing Overlay */}
      {(isRendering || isProcessing) && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">
                {isRendering ? 'Rendering' : 'Perfecting Content'}
            </h2>
            <div className="flex flex-col items-center max-w-sm w-full text-center">
              <p className="text-slate-400 mb-8 text-lg font-medium">
                  {status === ProcessingStatus.EXTRACTING_AUDIO && 'Extracting audio frequencies...'}
                  {status === ProcessingStatus.TRANSCRIBING && 'AHA is listening to your content...'}
                  {status === ProcessingStatus.TRANSLATING && 'Synthesizing global perspectives...'}
                  {status === ProcessingStatus.GENERATING_SPEECH && 'Cloning your voice with AI...'}
                  {status === ProcessingStatus.RENDERING && `Compositing masterpiece: ${Math.round(renderingProgress * 100)}%`}
              </p>
              
              {isRendering && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mb-10 overflow-hidden shadow-inner">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                      style={{ width: `${renderingProgress * 100}%` }}
                    />
                  </div>
              )}

              <button
                onClick={isRendering ? () => abortControllerRef.current?.abort() : handleStopProcessing}
                className="px-8 py-3.5 bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/50 text-white rounded-2xl font-bold transition-all flex items-center shadow-2xl hover:scale-105 active:scale-95"
              >
                <Square size={16} className="mr-3 fill-current" />
                Cancel Process
              </button>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="h-20 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-2xl flex items-center px-10 justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <span className="font-black text-xl text-white">A</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">AHA STUDIO</h1>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">AI Video Localizer</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input type="file" ref={videoInputRef} accept="video/*" onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => videoInputRef.current?.click()} 
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5"
          >
            <Upload size={16} />
            <span>{videoFile ? 'Change Project' : 'New Project'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-slate-950/50">
          <div className="w-full max-w-6xl mx-auto flex flex-col">
             <VideoPlayer src={videoSrc} captions={captions} onTimeUpdate={setCurrentTime} />

             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Transcribe */}
                <div className="group bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-indigo-500/30 transition-all hover:bg-slate-900/60">
                  <div className="mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <Wand2 size={20}/>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100">Transcribe</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Extract high-fidelity text captions using Gemini Pro.</p>
                  </div>
                  <button
                    onClick={handleGenerateCaptions}
                    disabled={!videoFile || isProcessing || isRendering}
                    className="w-full py-3 bg-slate-800 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                     Analyze Audio
                  </button>
                </div>

                {/* 2. Translate */}
                <div className="group bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-purple-500/30 transition-all hover:bg-slate-900/60">
                  <div className="mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <Languages size={20}/>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100">Translate</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Localize content into 10+ global languages natively.</p>
                  </div>
                  <div className="flex space-x-3">
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                      disabled={isRendering || isProcessing}
                      className="bg-slate-800/80 border border-slate-700 text-xs rounded-xl px-3 py-3 outline-none focus:border-purple-500 flex-1 min-w-0"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleTranslate}
                      disabled={captions.length === 0 || isProcessing || isRendering}
                      className="bg-purple-500 hover:bg-purple-400 text-white p-3 rounded-xl transition-all disabled:opacity-50"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* 3. Dubbing */}
                <div className="group bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-pink-500/30 transition-all hover:bg-slate-900/60">
                   <div className="mb-4">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <Mic size={20}/>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100">AI Dub</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Synthesize ultra-natural voiceovers with TTS.</p>
                  </div>
                  <button
                    onClick={handleDubbing}
                    disabled={captions.length === 0 || isProcessing || isRendering}
                    className="w-full py-3 bg-slate-800 hover:bg-pink-500 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    Generate Voice
                  </button>
                </div>

                {/* 4. Export */}
                <div className="group bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:bg-slate-900/60">
                   <div className="mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Download size={20}/>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-lg text-slate-100">Export</h3>
                       {dubbedAudioUrl && (
                        <button
                          onClick={toggleDubPreview}
                          className={`p-2 rounded-xl transition-all ${isDubPreviewPlaying ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                          title="Listen to Dub"
                        >
                          {isDubPreviewPlaying ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-4">
                      <input 
                        type="checkbox" 
                        id="dubCheck" 
                        checked={useDubbing} 
                        onChange={(e) => setUseDubbing(e.target.checked)}
                        disabled={!dubbedAudioBlob || isProcessing || isRendering}
                        className="w-4 h-4 rounded-lg bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <label htmlFor="dubCheck" className={`text-xs select-none cursor-pointer font-medium ${dubbedAudioBlob ? 'text-slate-300' : 'text-slate-600'}`}>Include AI Dub</label>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                        onClick={handleDownloadSRT}
                        disabled={captions.length === 0 || isRendering || isProcessing}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs disabled:opacity-50"
                    >
                        .SRT
                    </button>
                    <button
                        onClick={handleExportVideo}
                        disabled={captions.length === 0 || isRendering || isProcessing}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/10 flex items-center justify-center disabled:opacity-50"
                    >
                        <Film size={14} className="mr-2"/>
                        Render
                    </button>
                  </div>
                </div>

             </div>

             {errorMsg && (
               <div className="mt-8 bg-red-500/5 border border-red-500/20 text-red-400 p-6 rounded-3xl flex items-start text-sm shadow-xl animate-in zoom-in-95">
                 <div className="p-2 bg-red-500/10 rounded-xl mr-4">
                    <AlertTriangle size={20} className="flex-shrink-0" />
                 </div>
                 <div>
                   <p className="font-black text-lg mb-1 tracking-tight">Studio Error</p>
                   <p className="opacity-70 font-medium leading-relaxed">{errorMsg}</p>
                 </div>
               </div>
             )}

             <StatsChart captions={captions} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-96 flex-shrink-0 bg-slate-950 border-l border-slate-800/40 shadow-2xl z-40">
           <CaptionEditor 
             captions={captions} 
             currentTime={currentTime} 
             onUpdateCaption={updateCaption}
             onSeek={(t) => {
                const video = document.querySelector('video');
                if (video) video.currentTime = t;
             }}
           />
        </aside>

      </main>
    </div>
  );
}

export default App;
