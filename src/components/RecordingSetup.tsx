import React, { useState } from 'react';
import { Monitor, Mic, MicOff, Folder, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings } from '../models';
import { setupPage } from '../pages/SetupPage';

interface RecordingSetupProps {
  onStart: (settings: AppSettings) => void;
}

export default function RecordingSetup({ onStart }: RecordingSetupProps) {
  const [settings, setSettings] = useState(setupPage.getSettings());
  const [micPermission, setMicPermission] = useState(setupPage.getMicPermission());

  const handleMicToggle = async () => {
    await setupPage.toggleMicrophone();
    setSettings(setupPage.getSettings());
    setMicPermission(setupPage.getMicPermission());
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setupPage.setSettings(newSettings);
    setSettings(setupPage.getSettings());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-panel p-10 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-white italic">CẤU HÌNH GHI HÌNH</h2>
          <p className="text-zinc-500 text-sm italic">Thiết lập tên file, microphone và cách lưu video trước khi record</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-black block ml-1">Tên file record</label>
            <div className="relative group">
              <input
                type="text"
                value={settings.fileName}
                onChange={(e) => updateSettings({ fileName: e.target.value })}
                className="w-full bg-zinc-950/50 border-2 border-zinc-900 focus:border-orange-500/50 text-white rounded-2xl px-6 py-4 outline-none transition-all font-bold placeholder:text-zinc-700"
                placeholder="VD: Huong_dan_su_dung_app"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50">
                <span className="text-[10px] font-black text-zinc-500">.WEBM</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-black block ml-1">Thư mục lưu local</label>
            <div className="relative group">
              <input
                type="text"
                value={settings.storageRoot}
                onChange={(e) => updateSettings({ storageRoot: e.target.value })}
                className="w-full bg-zinc-950/50 border-2 border-zinc-900 focus:border-orange-500/50 text-white rounded-2xl px-6 py-4 outline-none transition-all font-bold placeholder:text-zinc-700"
                placeholder="C:\Users\HUU HIEU\Downloads\Temp"
              />
              <Folder className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium ml-1">
              Desktop Helper sẽ tạo folder Record_* và lưu video/screenshot từng thao tác tại đây.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleMicToggle}
              className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-start gap-4 text-left group ${
                settings.useMicrophone
                ? 'bg-orange-500/10 border-orange-500/50 ring-4 ring-orange-500/10'
                : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-800'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                settings.useMicrophone ? 'bg-orange-500 shadow-lg shadow-orange-500/40' : 'bg-zinc-900 group-hover:bg-zinc-800'
              }`}>
                {settings.useMicrophone ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-zinc-500" />}
              </div>
              <div>
                <h4 className={`font-bold ${settings.useMicrophone ? 'text-white' : 'text-zinc-400'}`}>Ghi âm microphone</h4>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Xin quyền khi bật mic</p>
                {micPermission === 'denied' && (
                  <p className="text-[10px] text-red-400 mt-2 font-bold">Microphone bị từ chối</p>
                )}
              </div>
              {settings.useMicrophone && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                </div>
              )}
            </button>

            <button
              onClick={() => updateSettings({ saveToLocal: !settings.saveToLocal })}
              className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-start gap-4 text-left group ${
                settings.saveToLocal
                ? 'bg-orange-500/10 border-orange-500/50 ring-4 ring-orange-500/10'
                : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-800'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                settings.saveToLocal ? 'bg-orange-500 shadow-lg shadow-orange-500/40' : 'bg-zinc-900 group-hover:bg-zinc-800'
              }`}>
                <Folder className={`w-6 h-6 ${settings.saveToLocal ? 'text-white' : 'text-zinc-500'}`} />
              </div>
              <div>
                <h4 className={`font-bold ${settings.saveToLocal ? 'text-white' : 'text-zinc-400'}`}>Lưu video local</h4>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Tải về thư mục Downloads</p>
              </div>
              {settings.saveToLocal && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                </div>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setupPage.onStart(onStart)}
          className="w-full py-6 bg-white text-black hover:bg-orange-500 hover:text-white rounded-3xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-2xl hover:shadow-orange-500/30 active:scale-[0.98]"
        >
          <Play className="w-6 h-6 fill-current" />
          BẮT ĐẦU RECORD
        </button>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6 opacity-30 italic">
        <div className="flex flex-col items-center gap-2">
          <Monitor className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-widest text-center">Capture Window</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-center">Track Actions</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-zinc-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-center">Review Guide</span>
        </div>
      </div>
    </motion.div>
  );
}
