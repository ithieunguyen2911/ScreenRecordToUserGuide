import React, { useEffect } from 'react';
import { UserGuide } from '../models';
import { motion } from 'motion/react';
import { List, Download, Share2, ChevronRight, Play, Bookmark, Clock, MousePointer2, Type, Scroll, Info } from 'lucide-react';
import { reviewPage } from '../pages/ReviewPage';

interface GuideReviewProps {
  guide: UserGuide;
  fileName: string;
  videoBlob?: Blob;
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'click': return <MousePointer2 className="w-4 h-4" />;
    case 'type': return <Type className="w-4 h-4" />;
    case 'scroll': return <Scroll className="w-4 h-4" />;
    default: return <ChevronRight className="w-4 h-4" />;
  }
};

export default function GuideReview({ guide, fileName, videoBlob }: GuideReviewProps) {
  useEffect(() => {
    reviewPage.initialize(guide, fileName);
  }, [guide, fileName]);

  const handleScrollToStep = (idx: number) => {
    reviewPage.scrollToStep(idx);
  };

  const handleDownloadVideo = () => {
    if (videoBlob) {
      reviewPage.downloadVideo(videoBlob);
    }
  };

  const handleExportPDF = async () => {
    await reviewPage.exportToPDF('full-guide-content');
  };

  const activeStep = reviewPage.getActiveStep();
  const isExporting = reviewPage.isCurrentlyExporting();

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
              onClick={() => handleScrollToStep(idx)}
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
              onClick={handleDownloadVideo}
              disabled={!videoBlob}
              className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-orange-500 rounded-xl border border-zinc-800 transition-all title='Tải video gốc' disabled:opacity-30"
             >
                <Play className="w-4 h-4 fill-current" />
             </button>
             <button className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 rounded-xl border border-zinc-800 transition-all">
                <Share2 className="w-4 h-4" />
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

        <div id="full-guide-content" className="space-y-16">
          <section className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] items-center font-black uppercase tracking-widest text-orange-500 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">Introduction</span>
            </div>
            <p className="text-zinc-400 text-lg leading-relaxed">{guide.introduction}</p>
          </section>

          <div className="space-y-12">
            {guide.steps.map((step, idx) => (
              <motion.section
                key={idx}
                id={`step-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative pl-24 group ${activeStep === idx ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
              >
                <div className="absolute left-0 top-0 flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl transition-all border-4 shadow-2xl ${
                    activeStep === idx
                    ? 'bg-orange-500 border-orange-500/50 scale-110 shadow-orange-500/40'
                    : 'bg-zinc-950 border-zinc-900 group-hover:border-zinc-800'
                  }`}>
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <div className="w-px h-24 bg-gradient-to-b from-zinc-500/20 to-transparent" />
                </div>

                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">{step.title}</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                      {getActionIcon(step.action)}
                      <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider transition-colors group-hover:text-zinc-300">{step.action}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span className="text-[10px] font-mono text-zinc-500">{step.timestamp.toFixed(1)}s</span>
                    </div>
                  </div>

                  <div className="glass-panel p-8 space-y-4">
                    <p className="text-zinc-400 leading-relaxed font-medium">{step.description}</p>

                    <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-900 flex items-center justify-center group overflow-hidden relative">
                      {step.screenshot ? (
                        <img src={step.screenshot} className="w-full h-full object-cover" alt={step.title} />
                      ) : (
                        <div className="flex flex-col items-center gap-4 opacity-50 group-hover:opacity-80 transition-opacity">
                          <Play className="w-12 h-12 text-zinc-800" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Video Capture Segment</span>
                        </div>
                      )}

                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-orange-500 animate-ping absolute inset-0" />
                            <div className="w-12 h-12 rounded-full border-4 border-orange-500 flex items-center justify-center bg-orange-500/20 backdrop-blur-sm">
                               {getActionIcon(step.action)}
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <section className="bg-orange-500/5 border border-orange-500/10 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center rotate-12">
                <Info className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Lưu ý quan trọng</h2>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guide.importantNotes.map((note, idx) => (
                <li key={idx} className="flex gap-4 p-6 bg-zinc-950 rounded-3xl border border-zinc-900 group hover:border-orange-500/30 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-orange-500 shrink-0 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Bookmark className="w-3 h-3 text-white fill-current" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">{note}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}