import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock,
  Download,
  FileText,
  List,
  MousePointer2,
  Play,
  Scroll,
  Share2,
  Trash2,
  Type,
} from 'lucide-react';
import { UserGuide } from '../models';
import { reviewPage } from '../pages/ReviewPage';
import { getStepFocus } from '../services/ActionFocusService';
import { guideEditorService } from '../services/GuideEditorService';
import FocusEditor, { defaultFocus } from './FocusEditor';

interface GuideReviewProps {
  guide: UserGuide;
  fileName: string;
  videoBlob?: Blob;
  onGuideChange?: (guide: UserGuide) => void;
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'click':
      return <MousePointer2 className="w-4 h-4" />;
    case 'type':
      return <Type className="w-4 h-4" />;
    case 'scroll':
      return <Scroll className="w-4 h-4" />;
    default:
      return <ChevronRight className="w-4 h-4" />;
  }
};

export default function GuideReview({ guide, fileName, videoBlob, onGuideChange }: GuideReviewProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    reviewPage.initialize(guide, fileName);
  }, [guide, fileName]);

  useEffect(() => {
    if (!videoBlob) {
      setVideoUrl(null);
      return;
    }

    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [videoBlob]);

  const updateGuide = (nextGuide: UserGuide) => {
    reviewPage.initialize(nextGuide, fileName);
    onGuideChange?.(nextGuide);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await reviewPage.exportToPDF('full-guide-content');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await reviewPage.exportToWord();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWordWithFocus = async () => {
    setIsExporting(true);
    try {
      await reviewPage.exportToWord(true);
    } finally {
      setIsExporting(false);
    }
  };

  const jumpToStepInVideo = (timestamp: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(timestamp, 0);
    videoRef.current.play().catch(() => undefined);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto items-start">
      <aside className="w-full lg:w-72 glass-panel p-6 sticky top-24 shrink-0">
        <div className="flex items-center gap-2 mb-8 ml-2">
          <List className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Table of Contents</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => {
              reviewPage.setActiveStep(null);
              setActiveStep(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeStep === null ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:bg-zinc-900 group'
            }`}
          >
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Video & Intro</span>
          </button>

          {guide.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveStep(idx);
                reviewPage.scrollToStep(idx);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeStep === idx ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:bg-zinc-900 group'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                activeStep === idx ? 'border-white/30 bg-white/10' : 'border-zinc-800 bg-zinc-950'
              }`}>
                <span className="text-[9px]">{idx + 1}</span>
              </div>
              <span className="truncate">{step.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 space-y-10 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 italic font-black text-white">
              V3
            </div>
            <div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">{guide.title}</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Generated with AI Screen-to-Guide</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => videoBlob && reviewPage.downloadVideo(videoBlob)}
              disabled={!videoBlob}
              title="Download original video"
              className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-orange-500 rounded-xl border border-zinc-800 transition-all disabled:opacity-30"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 rounded-xl border border-zinc-800 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-50 text-zinc-200 rounded-xl text-sm font-black uppercase tracking-widest border border-zinc-800 transition-all active:scale-95"
            >
              {isExporting ? <div className="w-4 h-4 border-2 border-zinc-500/30 border-t-zinc-100 rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              Word
            </button>
            <button
              onClick={handleExportWordWithFocus}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-50 text-orange-300 rounded-xl text-sm font-black uppercase tracking-widest border border-orange-500/30 transition-all active:scale-95"
            >
              {isExporting ? <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-200 rounded-full animate-spin" /> : <MousePointer2 className="w-4 h-4" />}
              Word + Focus
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 active:scale-95"
            >
              {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
          </div>
        </div>

        <div id="full-guide-content" className="space-y-14 bg-white text-zinc-950 rounded-[2rem] p-8">
          <section className="bg-white border border-zinc-200 rounded-[1.5rem] p-8 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] items-center font-black uppercase tracking-widest text-orange-600 px-3 py-1 bg-orange-50 rounded-full border border-orange-200">Introduction</span>
            </div>
            <input
              value={guide.title}
              onChange={(event) => updateGuide(guideEditorService.updateGuide(guide, { title: event.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-2xl font-black text-zinc-950 outline-none focus:border-orange-400"
            />
            <textarea
              value={guide.introduction}
              onChange={(event) => updateGuide(guideEditorService.updateGuide(guide, { introduction: event.target.value }))}
              className="min-h-28 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-700 outline-none focus:border-orange-400"
            />
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full rounded-3xl border border-zinc-800 bg-black"
              />
            )}
          </section>

          <div className="space-y-12">
            {guide.steps.map((step, idx) => (
              <motion.section
                key={idx}
                id={`step-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative pl-24 group opacity-100"
              >
                <div className="absolute left-0 top-0 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl border-4 shadow-2xl bg-orange-500 border-orange-300 text-white">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <div className="w-px h-24 bg-gradient-to-b from-zinc-300 to-transparent" />
                </div>

                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      value={step.title}
                      onChange={(event) => updateGuide(guideEditorService.updateStep(guide, idx, { title: event.target.value }))}
                      className="min-w-72 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xl font-black uppercase italic tracking-tight text-zinc-950 outline-none focus:border-orange-400"
                    />
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200">
                      {getActionIcon(step.action)}
                      <select
                        value={step.action}
                        onChange={(event) => updateGuide(guideEditorService.updateStep(guide, idx, { action: event.target.value }))}
                        className="bg-transparent text-[10px] font-bold uppercase text-zinc-600 tracking-wider outline-none"
                      >
                        <option value="click">click</option>
                        <option value="type">type</option>
                        <option value="scroll">scroll</option>
                        <option value="navigate">navigate</option>
                        <option value="review">review</option>
                        <option value="export">export</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] font-mono text-zinc-600">{step.timestamp.toFixed(1)}s</span>
                    </div>
                    {videoUrl && (
                      <button
                        onClick={() => jumpToStepInVideo(step.timestamp)}
                        className="text-xs font-bold text-orange-600 underline underline-offset-4 hover:text-orange-700"
                      >
                        Jump to this step in video
                      </button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => updateGuide(guideEditorService.moveStep(guide, idx, -1))}
                        className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:text-orange-600"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateGuide(guideEditorService.moveStep(guide, idx, 1))}
                        className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:text-orange-600"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateGuide(guideEditorService.deleteStep(guide, idx))}
                        className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-600"
                        title="Delete step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-4 shadow-sm">
                    <textarea
                      value={step.description}
                      onChange={(event) => updateGuide(guideEditorService.updateStep(guide, idx, { description: event.target.value }))}
                      className="min-h-24 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-700 outline-none focus:border-orange-400"
                    />
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Focus editor</span>
                        <div className="flex items-center gap-2">
                          {!step.focus && (
                            <button
                              type="button"
                              onClick={() => updateGuide(guideEditorService.updateStepFocus(guide, idx, defaultFocus))}
                              className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-orange-600"
                            >
                              Add focus
                            </button>
                          )}
                          {step.focus && (
                            <button
                              type="button"
                              onClick={() => updateGuide(guideEditorService.deleteStepFocus(guide, idx))}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50"
                            >
                              Delete focus
                            </button>
                          )}
                        </div>
                      </div>

                      {step.focus && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                          <input
                            value={step.focus.label ?? ''}
                            onChange={(event) => updateGuide(guideEditorService.updateStepFocus(guide, idx, { label: event.target.value }))}
                            className="md:col-span-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 outline-none focus:border-orange-400"
                            placeholder="Focus label"
                          />
                          {(['x', 'y', 'width', 'height'] as const).map((field) => (
                            <label key={field} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold uppercase text-zinc-500">
                              {field}
                              <input
                                type="number"
                                min={field === 'width' || field === 'height' ? 3 : 0}
                                max={100}
                                step={0.5}
                                value={Number(step.focus?.[field] ?? 0).toFixed(1)}
                                onChange={(event) => updateGuide(guideEditorService.updateStepFocus(guide, idx, {
                                  [field]: Number(event.target.value),
                                }))}
                                className="min-w-0 flex-1 bg-transparent text-right font-mono text-zinc-800 outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                      {step.focus && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {(['labelX', 'labelY', 'labelWidth'] as const).map((field) => (
                            <label key={field} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold uppercase text-zinc-500">
                              {field.replace('label', 'label ')}
                              <input
                                type="number"
                                min={field === 'labelWidth' ? 8 : 0}
                                max={100}
                                step={0.5}
                                value={Number(step.focus?.[field] ?? 0).toFixed(1)}
                                onChange={(event) => updateGuide(guideEditorService.updateStepFocus(guide, idx, {
                                  [field]: Number(event.target.value),
                                }))}
                                className="min-w-0 flex-1 bg-transparent text-right font-mono text-zinc-800 outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-200 flex items-center justify-center overflow-hidden relative">
                      {step.screenshot ? (
                        <img src={step.screenshot} className="w-full h-full object-contain" alt={step.title} />
                      ) : (
                        <div className="flex flex-col items-center gap-4 opacity-70">
                          <Play className="w-12 h-12 text-zinc-800" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Video Capture Segment</span>
                        </div>
                      )}

                      <FocusEditor
                        focus={step.focus ? getStepFocus(step, idx) : undefined}
                        onAdd={() => updateGuide(guideEditorService.updateStepFocus(guide, idx, defaultFocus))}
                        onDelete={() => updateGuide(guideEditorService.deleteStepFocus(guide, idx))}
                        onChange={(focus) => updateGuide(guideEditorService.updateStepFocus(guide, idx, focus))}
                      />
                    </div>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
