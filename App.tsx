
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Languages, Download, Wand2, Loader2, AlertTriangle, 
  Film, LogOut, Mic, Square, Volume2, Sparkles, ChevronRight,
  Folder, Plus, Scissors, Type, Palette, MonitorPlay, Save, PlayCircle, VolumeX
} from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CaptionEditor from './components/CaptionEditor';
import { Caption, ProcessingStatus, SUPPORTED_LANGUAGES, CaptionStyle } from './types';
import { extractAudioFromVideo, base64ToWavBlob } from './services/audioUtils';
import { transcribeAudio, translateCaptions, generateSpeech } from './services/geminiService';
import { renderVideoWithCaptions } from './services/videoRenderer';

function App() {
  // View State
  const [view, setView] = useState<'projects' | 'editor'>('projects');
  
  // Tool State
  const [activeTool, setActiveTool] = useState<'captions' | 'styles' | 'trim' | 'audio'>('captions');

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

  // Style State
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    fontSize: 1
  });

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
      setView('editor');
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
      setActiveTool('audio'); // Switch to audio tab on success
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

  const handleDownloadAudio = () => {
    if (!dubbedAudioUrl) return;
    const a = document.createElement('a');
    a.href = dubbedAudioUrl;
    a.download = `dubbed_audio_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        captionStyle,
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

  const addManualCaption = () => {
    const newCap: Caption = {
        id: Date.now().toString(),
        start: currentTime,
        end: currentTime + 2,
        text: "New Caption"
    };
    setCaptions(prev => [...prev, newCap].sort((a, b) => a.start - b.start));
  };

  const isProcessing = [
    ProcessingStatus.EXTRACTING_AUDIO, 
    ProcessingStatus.TRANSCRIBING, 
    ProcessingStatus.TRANSLATING, 
    ProcessingStatus.GENERATING_SPEECH
  ].includes(status);
  
  const isRendering = status === ProcessingStatus.RENDERING;

  // --- PROJECTS VIEW ---
  if (view === 'projects') {
    return (
      <div className="flex flex-col h-screen bg-[#0F1115] text-white font-sans selection:bg-indigo-500/30">
        <input type="file" ref={videoInputRef} accept="video/*" onChange={handleFileUpload} className="hidden" />

        {/* Top */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
               <Folder size={20} />
             </div>
             Projects
          </h1>
          <button
             onClick={() => videoInputRef.current?.click()}
             className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-white transition-colors border border-slate-700 shadow-lg"
             title="New Project"
          >
             <Plus size={20} />
          </button>
        </div>

        {/* Center */}
        {videoFile ? (
           <div className="flex-1 p-6 overflow-y-auto animate-in fade-in duration-500">
             <div 
               onClick={() => setView('editor')}
               className="bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center gap-5 cursor-pointer group transition-all"
             >
                <div className="w-24 h-16 bg-black rounded-lg flex items-center justify-center overflow-hidden relative shadow-lg">
                   <video src={videoSrc || undefined} className="w-full h-full object-cover opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Film className="text-white/50" size={20} />
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-bold text-slate-200 truncate text-lg">{videoFile.name}</h3>
                   <p className="text-sm text-slate-500 mt-1 font-medium">
                      {captions.length > 0 ? `${captions.length} captions generated` : 'Ready to edit'}
                   </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-500 transition-all">
                   <ChevronRight size={18} />
                </div>
             </div>
           </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-800 shadow-2xl relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
              <Folder size={40} className="text-slate-600 relative z-10" />
              <div className="absolute -bottom-2 -right-2 bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#0F1115] z-20">
                 <Plus size={16} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">No projects yet</h2>
            <p className="text-[#9E9E9E] text-sm leading-relaxed max-w-xs">
              Hit the button below to add your first<br />
              project and see some magic
            </p>
          </div>
        )}

        {/* Bottom */}
        {!videoFile && (
          <div className="p-6">
            <button 
              onClick={() => videoInputRef.current?.click()}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-lg font-semibold rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create New Project
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-[#0F1115] text-white">
      
      {/* Hidden Elements */}
      <input type="file" ref={videoInputRef} accept="video/*" onChange={handleFileUpload} className="hidden" />
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
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
                {isRendering ? 'Rendering Video' : 'AI Processing'}
            </h2>
            <p className="text-slate-400 mb-6 text-center max-w-sm">
                {status === ProcessingStatus.EXTRACTING_AUDIO && 'Extracting audio...'}
                {status === ProcessingStatus.TRANSCRIBING && 'Transcribing speech...'}
                {status === ProcessingStatus.TRANSLATING && 'Translating text...'}
                {status === ProcessingStatus.GENERATING_SPEECH && 'Generating voice...'}
                {status === ProcessingStatus.RENDERING && `Rendering: ${Math.round(renderingProgress * 100)}%`}
            </p>
            {isRendering && (
                <div className="w-64 bg-slate-800 rounded-full h-2 mb-8 overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all" style={{ width: `${renderingProgress * 100}%` }} />
                </div>
            )}
            <button
                onClick={isRendering ? () => abortControllerRef.current?.abort() : handleStopProcessing}
                className="px-6 py-2 bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
            >
                Cancel
            </button>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-4 bg-black/40 backdrop-blur-sm z-50 absolute top-0 w-full pointer-events-none">
        <button 
            onClick={() => setView('projects')} 
            className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-black/70 transition-all border border-white/10"
        >
            <ChevronRight className="rotate-180" size={20} />
        </button>
        
        <div className="flex items-center space-x-2 pointer-events-auto">
            <button
                onClick={handleExportVideo}
                disabled={captions.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
                <Download size={16} />
                Export
            </button>
        </div>
      </header>

      {/* Main Video Area */}
      <div className="flex-1 relative bg-black flex flex-col justify-center">
         <VideoPlayer 
            src={videoSrc} 
            captions={captions} 
            style={captionStyle}
            onTimeUpdate={setCurrentTime} 
         />
      </div>

      {/* Bottom Editing Suite (Black Banner) */}
      <div className="bg-black border-t border-slate-900 flex flex-col z-40">
        
        {/* Tool Panel (Dynamic Content) */}
        <div className="h-64 border-b border-slate-900 bg-[#0F1115] relative overflow-hidden">
            {activeTool === 'captions' && (
                <div className="h-full flex flex-col">
                     <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex gap-2">
                             <button 
                                onClick={handleGenerateCaptions}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                             >
                                <Wand2 size={12} /> Auto Transcribe
                             </button>
                             <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2">
                                <Languages size={12} className="text-slate-400" />
                                <select 
                                    value={selectedLang} 
                                    onChange={(e) => setSelectedLang(e.target.value)}
                                    className="bg-transparent text-xs text-white py-1.5 outline-none border-none w-20"
                                >
                                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name.split(' ')[0]}</option>)}
                                </select>
                                <button onClick={handleTranslate} className="text-xs text-indigo-400 font-bold hover:text-white">→</button>
                             </div>
                        </div>
                        <button 
                            onClick={addManualCaption}
                            className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                            + Tap to add caption
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                        <CaptionEditor 
                            captions={captions}
                            currentTime={currentTime}
                            onUpdateCaption={updateCaption}
                            onSeek={(t) => {
                                const video = document.querySelector('video');
                                if (video) video.currentTime = t;
                            }}
                        />
                     </div>
                </div>
            )}

            {activeTool === 'styles' && (
                <div className="h-full p-6 flex flex-col justify-center space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Text Color</label>
                        <div className="flex gap-4">
                            {['#FFFFFF', '#FFE100', '#00FF9D', '#00F0FF', '#FF0055'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCaptionStyle(s => ({ ...s, textColor: c }))}
                                    className={`w-8 h-8 rounded-full border-2 ${captionStyle.textColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Background</label>
                        <div className="flex gap-3">
                             <button
                                onClick={() => setCaptionStyle(s => ({ ...s, backgroundColor: 'transparent' }))}
                                className={`px-4 py-2 rounded-lg text-xs font-medium border ${captionStyle.backgroundColor === 'transparent' ? 'border-white bg-slate-800' : 'border-slate-800 text-slate-400'}`}
                             >
                                None
                             </button>
                             <button
                                onClick={() => setCaptionStyle(s => ({ ...s, backgroundColor: 'rgba(0,0,0,0.6)' }))}
                                className={`px-4 py-2 rounded-lg text-xs font-medium border ${captionStyle.backgroundColor === 'rgba(0,0,0,0.6)' ? 'border-white bg-slate-800' : 'border-slate-800 text-slate-400'}`}
                             >
                                Box
                             </button>
                             <button
                                onClick={() => setCaptionStyle(s => ({ ...s, backgroundColor: '#000000' }))}
                                className={`px-4 py-2 rounded-lg text-xs font-medium border ${captionStyle.backgroundColor === '#000000' ? 'border-white bg-slate-800' : 'border-slate-800 text-slate-400'}`}
                             >
                                Solid Black
                             </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Size</label>
                         <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={captionStyle.fontSize}
                            onChange={(e) => setCaptionStyle(s => ({ ...s, fontSize: parseFloat(e.target.value) }))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                         />
                    </div>
                </div>
            )}
            
            {activeTool === 'audio' && (
                <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
                    {!dubbedAudioUrl ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 mx-auto">
                                <Mic size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">AI Dubbing</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">Generate lifelike voiceovers from your captions.</p>
                            </div>
                            <button 
                                onClick={handleDubbing}
                                disabled={captions.length === 0 || isProcessing}
                                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/20 disabled:opacity-50"
                            >
                                {captions.length === 0 ? 'Transcribe First' : 'Generate Voice'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-md space-y-6">
                            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center gap-4">
                                 <button 
                                    onClick={toggleDubPreview}
                                    className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-400 transition-all shadow-lg shadow-pink-500/20 flex-shrink-0"
                                 >
                                    {isDubPreviewPlaying ? <Square size={16} fill="currentColor" /> : <PlayCircle size={24} fill="currentColor" />}
                                 </button>
                                 <div className="flex-1">
                                    <div className="h-10 flex items-center gap-1 justify-center opacity-50">
                                        {/* Fake visualizer bars */}
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className={`w-1 bg-pink-500 rounded-full transition-all ${isDubPreviewPlaying ? 'animate-pulse' : ''}`} style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }}></div>
                                        ))}
                                    </div>
                                 </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleDownloadAudio}
                                    className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-700 hover:border-slate-600"
                                >
                                    <Download size={16} /> Save Audio
                                </button>
                                <button 
                                     onClick={() => setUseDubbing(!useDubbing)}
                                     className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border ${useDubbing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                                >
                                    {useDubbing ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    {useDubbing ? 'Include in Video' : 'Muted in Video'}
                                </button>
                            </div>
                            <button onClick={handleDubbing} className="w-full py-2 text-xs text-slate-500 hover:text-white">Regenerate</button>
                        </div>
                    )}
                </div>
            )}

            {activeTool === 'trim' && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 mb-2">
                        <Scissors size={32} />
                     </div>
                     <h3 className="text-lg font-bold">Auto Trim Silence</h3>
                     <p className="text-sm text-slate-500 max-w-xs">Automatically remove silent parts from your video to make it more engaging.</p>
                     <button 
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20"
                        onClick={() => alert("Auto Trim feature coming soon!")}
                     >
                        Analyze & Trim
                     </button>
                </div>
            )}
        </div>

        {/* Media Strip & Toolbar */}
        <div className="bg-black pt-2 pb-6 px-4">
            
            {/* Timeline / Media Strip */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                 <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="w-16 h-16 flex-shrink-0 bg-slate-900 rounded-xl flex items-center justify-center text-white border border-slate-800 hover:border-indigo-500 hover:bg-slate-800 transition-all"
                 >
                    <Plus size={24} />
                 </button>
                 {videoFile && (
                    <div className="w-24 h-16 flex-shrink-0 bg-slate-800 rounded-xl border-2 border-indigo-500 overflow-hidden relative">
                         <video src={videoSrc || undefined} className="w-full h-full object-cover opacity-60" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold bg-black/50 px-1 rounded text-white">Active</span>
                         </div>
                    </div>
                 )}
                 {/* Mock items for "Gallery" feel */}
                 {[1,2].map(i => (
                    <div key={i} className="w-24 h-16 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center opacity-30">
                        <Film size={16} />
                    </div>
                 ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-between items-center px-2 mt-2">
                 <button 
                    onClick={() => setActiveTool('captions')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTool === 'captions' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Type size={20} />
                    <span className="text-[10px] font-medium">Captions</span>
                 </button>

                 <button 
                    onClick={() => setActiveTool('styles')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTool === 'styles' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Palette size={20} />
                    <span className="text-[10px] font-medium">Styles</span>
                 </button>

                 <button 
                    onClick={() => setActiveTool('audio')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTool === 'audio' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Mic size={20} />
                    <span className="text-[10px] font-medium">Audio</span>
                 </button>

                 <button 
                    onClick={() => setActiveTool('trim')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTool === 'trim' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                 >
                    <Scissors size={20} />
                    <span className="text-[10px] font-medium">Auto Trim</span>
                 </button>
                 
                 <div className="w-px h-8 bg-slate-800 mx-2"></div>

                 <button 
                    onClick={handleExportVideo}
                    className="flex flex-col items-center gap-1 text-indigo-500 hover:text-indigo-400 transition-colors"
                 >
                    <Save size={20} />
                    <span className="text-[10px] font-medium">Save</span>
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;
