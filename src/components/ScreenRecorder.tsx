import React, { useRef, useEffect } from 'react';
import { Camera, StopCircle, Video, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../models';
import { recordingPage } from '../pages/RecordingPage';

interface ScreenRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
  settings: AppSettings | null;
}

export default function ScreenRecorder({ onRecordingComplete, isProcessing, settings }: ScreenRecorderProps) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    recordingPage.initialize(settings);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordingPage.cleanup();
    };
  }, [settings]);

  useEffect(() => {
    if (recordingPage.isCurrentlyRecording()) {
      timerRef.current = window.setInterval(() => {
        recordingPage.incrementDuration();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recordingPage.resetDuration();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingPage.isCurrentlyRecording()]);

  const handleStartRecording = async () => {
    try {
      await recordingPage.startRecording(videoPreviewRef.current);
      window.location.reload();
    } catch {
      // Error already handled in RecordingPage
    }
  };

  const handleStopRecording = async () => {
    await recordingPage.stopRecording();
    onRecordingComplete(recordingPage.getRecorderSettings() as any);
  };

  const recorderSettings = recordingPage.getRecorderSettings();
  const showSettings = recordingPage.shouldShowSettings();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center justify-center group">
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          className="w-full h-full object-contain"
        />

        {!recordingPage.isCurrentlyRecording() && !isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity group-hover:bg-black/50">
            <div className="p-6 rounded-full bg-white/10 border border-white/20 mb-4 animate-pulse">
              <Video className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Sẵn sàng quay màn hình</h3>
            <p className="text-zinc-400 text-sm max-w-xs text-center">
              Chọn một cửa sổ hoặc toàn bộ màn hình để bắt đầu tạo hướng dẫn.
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-white mt-6 mb-2">Đang phân tích Video...</h3>
            <p className="text-zinc-400 text-sm animate-pulse">AI đang soạn thảo hướng dẫn cho bạn</p>
          </div>
        )}

        {recordingPage.isCurrentlyRecording() && (
          <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-wider">Recording</span>
            <span className="text-xs font-mono text-white border-l border-white/20 pl-3">{recordingPage.formatTime(recordingPage.getDuration())}</span>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {!recordingPage.isCurrentlyRecording() ? (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="group relative px-8 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <Camera className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Bắt đầu quay
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all active:scale-95"
            >
              <StopCircle className="w-5 h-5 text-red-600" />
              Dừng quay
            </button>
          )}

          {!recordingPage.isCurrentlyRecording() && !isProcessing && (
            <button
              onClick={() => recordingPage.toggleSettingsPanel()}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl border border-zinc-700 transition-all"
              title="Cài đặt"
            >
              <SettingsIcon className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Chất lượng</label>
              <select
                value={recorderSettings.quality}
                onChange={(e) => recordingPage.updateRecorderSettings({ quality: e.target.value as any })}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="high">4K/1080p (Rõ nét)</option>
                <option value="medium">720p (Trung bình)</option>
                <option value="low">SD (Tiết kiệm)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Định dạng</label>
              <select
                value={recorderSettings.format}
                onChange={(e) => recordingPage.updateRecorderSettings({ format: e.target.value as any })}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="webm">WebM (Tốt cho Web)</option>
                <option value="mp4">MP4 (Phổ biến)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Âm thanh</label>
              <button
                onClick={() => recordingPage.updateRecorderSettings({ includeAudio: !recorderSettings.includeAudio })}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm border transition-all ${
                  recorderSettings.includeAudio ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                <span>{recorderSettings.includeAudio ? 'Bật micro' : 'Tắt micro'}</span>
                <div className={`w-2 h-2 rounded-full ${recorderSettings.includeAudio ? 'bg-orange-500 animate-pulse' : 'bg-zinc-600'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Tốc độ khung hình</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15" max="60" step="15"
                  value={recorderSettings.frameRate}
                  onChange={(e) => recordingPage.updateRecorderSettings({ frameRate: parseInt(e.target.value) })}
                  className="w-full accent-orange-500"
                />
                <span className="text-sm font-mono text-zinc-300 w-12">{recorderSettings.frameRate}fps</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}