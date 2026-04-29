import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import { Download, Edit3, Eye, FileDigit, Check, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { editorPage } from '../pages/EditorPage';

interface GuideEditorProps {
  initialContent: string;
}

export default function GuideEditor({ initialContent }: GuideEditorProps) {
  useEffect(() => {
    editorPage.initialize(initialContent);
  }, [initialContent]);

  const handleCopy = async () => {
    await editorPage.copyToClipboard();
  };

  const handleToggleEdit = () => {
    editorPage.toggleEditMode();
    window.location.reload();
  };

  const handleExportPDF = async () => {
    await editorPage.exportToPDF('guide-preview', 'User_Guide');
  };

  const content = editorPage.getContent();
  const isEditing = editorPage.isEditMode();
  const isExporting = editorPage.isCurrentlyExporting();

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Hướng dẫn đã tạo</h2>
          <p className="text-zinc-500 text-sm mt-1">Sử dụng AI để tinh chỉnh hoặc tự sửa đổi nội dung.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all"
          >
            <Share2 className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleToggleEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isEditing ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Xong' : 'Sửa hướng dẫn'}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black rounded-xl text-sm font-bold shadow-xl transition-all"
          >
            {isExporting ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Tải PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`col-span-1 border rounded-3xl overflow-hidden bg-zinc-900 border-zinc-800 transition-all ${isEditing ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="px-6 py-3 border-bottom border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Xem trước</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
            </div>
          </div>

          <div
            id="guide-preview"
            className="p-8 md:p-12 prose prose-zinc prose-invert max-w-none text-zinc-300 bg-white"
          >
             <div className="text-black markdown-body">
                <Markdown>{content}</Markdown>
             </div>
          </div>
        </div>

        {isEditing && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 lg:col-span-6 bg-zinc-950 border border-zinc-800 rounded-3xl"
          >
            <div className="px-6 py-3 border-bottom border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
              <FileDigit className="w-4 h-4 text-orange-500" />
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Trình chỉnh sửa Markdown</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => editorPage.setContent(e.target.value)}
              className="w-full h-[600px] p-6 bg-transparent text-zinc-300 font-mono text-sm outline-none resize-none leading-relaxed"
              placeholder="Nhập nội dung hướng dẫn tại đây..."
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}