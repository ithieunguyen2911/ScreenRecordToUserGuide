import React, { useState } from 'react';
import ScreenRecorder from './components/ScreenRecorder';
import GuideReview from './components/GuideReview';
import RecordingSetup from './components/RecordingSetup';
import { guideService } from './services/GuideService';
import { createFallbackGuide } from './services/FallbackGuideService';
import { exportService } from './services/ExportService';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AppSettings, RecordingResult, UserGuide } from './models';

type AppState = 'setup' | 'recording' | 'processing' | 'review';

export default function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [guideData, setGuideData] = useState<UserGuide | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const startRecordingFlow = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setNotice(null);
    setAppState('recording');
  };

  const reset = () => {
    setAppState('setup');
    setGuideData(null);
    setRecordedBlob(null);
    setNotice(null);
  };

  const getVideoExtension = (blob: Blob) => {
    if (blob.type.includes('mp4')) return 'mp4';
    return 'webm';
  };

  const showFallbackReview = async (result: RecordingResult, reason?: string) => {
    const fileName = settings?.fileName || 'UserGuide';
    const fallback = createFallbackGuide(fileName, result.duration, result.actions ?? []);
    const guideWithScreenshots = await guideService.addScreenshotsToGuide(result.blob, fallback);
    setGuideData(guideWithScreenshots);
    setNotice(reason ?? 'Đã lưu video record. AI guide chưa được tạo vì thiếu cấu hình hoặc video không thể xử lý.');
    setAppState('review');
  };

  const handleRecordingComplete = async (result: RecordingResult) => {
    const blob = result.blob;
    const fileName = settings?.fileName || 'ScreenRecord';
    setRecordedBlob(blob);
    setNotice(null);

    if ((settings?.saveToLocal ?? true) && !result.localVideoPath) {
      exportService.downloadBlob(blob, `${fileName}.${getVideoExtension(blob)}`);
    }

    if (blob.size > 15 * 1024 * 1024) {
      await showFallbackReview(
        result,
        'Video đã được lưu về local. Video lớn hơn 15MB nên AI guide tạm thời dùng bản review fallback.'
      );
      return;
    }

    if (!guideService.hasConfiguredApiKey()) {
      await showFallbackReview(
        result,
        'Video đã được lưu về local. Chưa có GEMINI_API_KEY nên app hiển thị bản review fallback thay vì chặn kết quả.'
      );
      return;
    }

    setAppState('processing');

    try {
      const base64String = await guideService.blobToBase64(blob);
      const guide = await guideService.generateUserGuide(base64String, blob.type);
      const guideWithScreenshots = await guideService.addScreenshotsToGuide(blob, guide);

      setGuideData(guideWithScreenshots);
      setAppState('review');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#ffffff'],
      });
    } catch (err: any) {
      console.error('AI Error Details:', err);
      const reason = err?.message?.includes('GEMINI_API_KEY')
        ? 'Video đã được lưu về local. Chưa có GEMINI_API_KEY nên app hiển thị bản review fallback thay vì chặn kết quả.'
        : `Video đã được lưu về local. AI guide chưa tạo được: ${err?.message ?? 'lỗi không xác định'}.`;
      await showFallbackReview(result, reason);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">
                SCREEN<span className="text-orange-500">GUIDE</span>
              </span>
              <div className="h-0.5 w-full bg-orange-500/30 mt-0.5 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold border border-zinc-700 transition-all">
              v3.0.0
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
        {notice && (
          <div className="mb-8 px-6 py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-200 text-sm max-w-3xl mx-auto text-center">
            {notice}
          </div>
        )}

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
                <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                  CREATE YOUR <span className="text-orange-500">USER GUIDE</span>
                </h1>
                <p className="text-zinc-500 max-w-xl mx-auto">
                  Record desktop app hoặc toàn bộ màn hình, sau đó tạo user guide có table of contents, video gốc và ảnh chụp theo từng bước.
                </p>
              </div>
              <RecordingSetup onStart={startRecordingFlow} />
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
                onGuideChange={setGuideData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-zinc-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 grayscale opacity-30">
            <Zap className="w-5 h-5 text-zinc-500" />
            <span className="text-sm font-bold tracking-tighter text-zinc-500 uppercase">
              Screen Guide AI v3.0
            </span>
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
