import React, { useState } from 'react';
import ScreenRecorder from './components/ScreenRecorder';
import GuideReview from './components/GuideReview';
import RecordingSetup from './components/RecordingSetup';
import { generateUserGuide } from './lib/gemini';
import { Sparkles, Zap, Layout, Monitor, ArrowRight, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AppSettings, UserGuide } from './types';

export default function App() {
  const [appState, setAppState] = useState<'setup' | 'recording' | 'processing' | 'review'>('setup');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [guideData, setGuideData] = useState<UserGuide | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecordingFlow = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setAppState('recording');
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setRecordedBlob(blob);
    // Check file size (approx limit for inline data is usually around 10-20MB for flash)
    if (blob.size > 15 * 1024 * 1024) {
      setError("Video quá lớn (>15MB). Vui lòng quay ngắn hơn (dưới 1 phút) để AI có thể xử lý.");
      setAppState('setup');
      return;
    }

    setAppState('processing');
    setError(null);
    
    try {
      // Convert blob to base64 for Gemini
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          const guide = await generateUserGuide(base64String, blob.type);
          if (guide) {
            setGuideData(guide);
            setAppState('review');
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#fb923c', '#ffffff']
            });
          }
        } catch (err: any) {
          console.error("AI Error Details:", err);
          let msg = "Lỗi khi tạo hướng dẫn từ AI.";
          const errorStr = JSON.stringify(err);
          
          if (errorStr.includes("400") || (err.message && err.message.includes("400"))) {
            msg = "Video quá lớn hoặc không đúng định dạng để AI xử lý. Vui lòng quay ngắn hơn (< 30 giây).";
          } else if (err.message && err.message.includes("API_KEY")) {
            msg = "Lỗi API Key: Vui lòng kiểm tra lại cấu hình GEMINI_API_KEY trong mục Secrets.";
          } else if (err.message) {
            msg = `Lỗi AI: ${err.message}`;
          }
          setError(msg);
          setAppState('setup');
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra trong quá trình xử lý video.");
      setAppState('setup');
    }
  };

  const reset = () => {
    setAppState('setup');
    setGuideData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">SCREEN<span className="text-orange-500">GUIDE</span></span>
              <div className="h-0.5 w-full bg-orange-500/30 mt-0.5 rounded-full" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold border border-zinc-700 transition-all">
                v3.0.0 (New Edition)
             </button>
             {appState === 'review' && (
               <button 
                onClick={reset}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all"
               >
                 Tạo bản mới
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {appState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">CREATE YOUR <span className="text-orange-500">USER GUIDE</span></h1>
                <p className="text-zinc-500 max-w-xl mx-auto">AI sẽ tự động nhận diện clicks, scrolls và phím bấm để tạo ra bản hướng dẫn trực quan nhất.</p>
              </div>
              <RecordingSetup onStart={startRecordingFlow} />
              {error && (
                <div className="mt-6 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm max-w-lg mx-auto text-center">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {(appState === 'recording' || appState === 'processing') && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pt-12"
            >
              <ScreenRecorder 
                isProcessing={appState === 'processing'} 
                onRecordingComplete={handleRecordingComplete} 
                settings={settings}
              />
            </motion.div>
          )}

          {appState === 'review' && guideData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <GuideReview 
                guide={guideData} 
                fileName={settings?.fileName || 'UserGuide'} 
                videoBlob={recordedBlob || undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-zinc-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 grayscale opacity-30">
            <Zap className="w-5 h-5 text-zinc-500" />
            <span className="text-sm font-bold tracking-tighter text-zinc-500 uppercase tracking-widest">Screen Guide AI v3.0</span>
          </div>
          <div className="flex gap-8 opacity-30">
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
