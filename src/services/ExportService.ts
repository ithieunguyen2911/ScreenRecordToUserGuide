import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ActionFocus, UserGuide } from '../models';
import { getStepFocus } from './ActionFocusService';

interface WordExportOptions {
  includeFocusOverlay?: boolean;
}

export class ExportService {
  private readonly wordContentWidth = '6.25in';
  private readonly wordContentWidthPt = '450pt';
  private readonly wordImageDisplayWidthPixels = 600;
  private readonly wordImageSourceMaxWidthPixels = 1800;

  async exportToPDF(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  }

  async exportToMultiPagePDF(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${fileName}.pdf`);
  }

  exportGuideToPDF(guide: UserGuide, fileName: string): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (height: number) => {
      if (y + height <= pageHeight - margin) return;
      pdf.addPage();
      y = margin;
    };

    const addText = (text: string, fontSize = 11, style: 'normal' | 'bold' = 'normal') => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.45;
      ensureSpace(lines.length * lineHeight + 4);
      pdf.text(lines, margin, y);
      y += lines.length * lineHeight + 4;
    };

    pdf.setTextColor(20, 20, 20);
    addText(guide.title, 20, 'bold');
    addText(guide.introduction, 11);

    guide.steps.forEach((step, index) => {
      ensureSpace(35);
      pdf.setFillColor(249, 115, 22);
      pdf.roundedRect(margin, y - 5, 9, 9, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(String(index + 1).padStart(2, '0'), margin + 1.5, y + 1.5);
      pdf.setTextColor(20, 20, 20);
      pdf.setFontSize(14);
      pdf.text(step.title, margin + 13, y);
      pdf.setFontSize(9);
      pdf.setTextColor(95, 95, 95);
      pdf.text(`${step.action.toUpperCase()} - ${step.timestamp.toFixed(1)}s`, margin + 13, y + 6);
      y += 13;

      addText(step.description, 10);

      if (step.screenshot) {
        const imageHeight = contentWidth * 9 / 16;
        ensureSpace(imageHeight + 8);
        pdf.addImage(step.screenshot, 'JPEG', margin, y, contentWidth, imageHeight);

        if (step.focus) {
          const focusX = margin + (step.focus.x / 100) * contentWidth;
          const focusY = y + (step.focus.y / 100) * imageHeight;
          const focusWidth = (step.focus.width / 100) * contentWidth;
          const focusHeight = (step.focus.height / 100) * imageHeight;
          pdf.setDrawColor(249, 115, 22);
          pdf.setLineWidth(1);
          pdf.rect(focusX, focusY, focusWidth, focusHeight);
          pdf.setFillColor(20, 20, 20);
          pdf.roundedRect(focusX, Math.max(y, focusY - 8), 34, 6, 1.5, 1.5, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.text(step.focus.label || 'Action', focusX + 2, Math.max(y + 4, focusY - 4));
          pdf.setTextColor(20, 20, 20);
        }

        y += imageHeight + 8;
      }
    });

    this.downloadBlob(pdf.output('blob'), `${fileName}.pdf`);
  }

  buildWordHtml(guide: UserGuide): string {
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const imageHtml = (src: string, alt: string) => `
      <div class="guide-image-frame">
        <img class="guide-image" src="${src}" alt="${escapeHtml(alt)}" width="${this.wordImageDisplayWidthPixels}" style="width: ${this.wordContentWidthPt}; max-width: ${this.wordContentWidthPt}; height: auto; display: block; border: 1px solid #ddd;" />
      </div>
    `;

    const stepsHtml = guide.steps.map((step, index) => `
      <section style="page-break-inside: avoid; margin: 24px 0;">
        <h2>${String(index + 1).padStart(2, '0')}. ${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.description)}</p>
        ${step.screenshot ? imageHtml(step.screenshot, step.title) : ''}
      </section>
    `).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(guide.title)}</title>
          <style>
            @page WordSection1 { size: 8.5in 11in; margin: 0.7in 0.7in 0.7in 0.7in; }
            div.WordSection1 { page: WordSection1; }
            body { font-family: Arial, sans-serif; color: #202020; line-height: 1.55; margin: 0; }
            .word-body { width: ${this.wordContentWidth}; max-width: ${this.wordContentWidth}; }
            h1 { color: #111111; }
            h2 { color: #f97316; margin-bottom: 4px; }
            p { margin: 6px 0 12px; }
            .guide-image-frame {
              width: ${this.wordContentWidth};
              max-width: ${this.wordContentWidth};
              margin: 10px 0 14px;
              overflow: hidden;
            }
            .guide-image {
              width: ${this.wordContentWidth};
              max-width: ${this.wordContentWidth};
              mso-width-alt: ${this.wordImageDisplayWidthPixels};
              height: auto;
              display: block;
              border: 1px solid #ddd;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="WordSection1">
            <div class="word-body">
              <h1>${escapeHtml(guide.title)}</h1>
              <p>${escapeHtml(guide.introduction)}</p>
              <h2>Table of Contents</h2>
              <ol>${guide.steps.map(step => `<li>${escapeHtml(step.title)}</li>`).join('')}</ol>
              ${stepsHtml}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async prepareGuideForWord(guide: UserGuide, options: WordExportOptions = {}): Promise<UserGuide> {
    const steps = await Promise.all(guide.steps.map(async (step, index) => ({
      ...step,
      screenshot: step.screenshot
        ? await this.prepareWordScreenshot(step.screenshot, step.focus ? getStepFocus(step, index) : undefined, options)
        : step.screenshot,
    })));

    return {
      ...guide,
      steps,
    };
  }

  async exportGuideToWord(guide: UserGuide, fileName: string, options: WordExportOptions = {}): Promise<void> {
    const resizedGuide = await this.prepareGuideForWord(guide, options);
    const html = this.buildWordHtml(resizedGuide);

    this.downloadBlob(
      new Blob([html], { type: 'application/msword;charset=utf-8' }),
      `${fileName}.doc`
    );
  }

  private async prepareWordScreenshot(src: string, focus: ActionFocus | undefined, options: WordExportOptions): Promise<string> {
    if (options.includeFocusOverlay && focus) {
      return this.renderFocusOverlayImage(src, focus, this.wordImageSourceMaxWidthPixels);
    }

    return this.resizeImageDataUrl(src, this.wordImageSourceMaxWidthPixels);
  }

  private renderFocusOverlayImage(src: string, focus: ActionFocus, maxWidth: number): Promise<string> {
    if (!src.startsWith('data:image/') || typeof Image === 'undefined' || typeof document === 'undefined') {
      return Promise.resolve(src);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');

        if (!context) {
          resolve(src);
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.drawFocusOverlay(context, canvas.width, canvas.height, focus);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(src);
      image.src = src;
    });
  }

  private drawFocusOverlay(context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, focus: ActionFocus): void {
    const x = (focus.x / 100) * canvasWidth;
    const y = (focus.y / 100) * canvasHeight;
    const width = (focus.width / 100) * canvasWidth;
    const height = (focus.height / 100) * canvasHeight;
    const labelWidthPercent = focus.labelWidth ?? 18;
    const labelXPercent = focus.labelX ?? Math.min(focus.x + focus.width + 2, 100 - labelWidthPercent);
    const labelYPercent = focus.labelY ?? Math.max(focus.y - 9, 4);
    const labelX = (labelXPercent / 100) * canvasWidth;
    const labelY = (labelYPercent / 100) * canvasHeight;
    const labelWidth = (labelWidthPercent / 100) * canvasWidth;
    const labelHeight = Math.max(34, canvasHeight * 0.045);

    context.save();
    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
    context.fillRect(0, 0, canvasWidth, y);
    context.fillRect(0, y, x, height);
    context.fillRect(x + width, y, canvasWidth - x - width, height);
    context.fillRect(0, y + height, canvasWidth, canvasHeight - y - height);

    context.strokeStyle = '#fb923c';
    context.lineWidth = Math.max(4, canvasWidth * 0.003);
    context.strokeRect(x, y, width, height);

    this.roundRect(context, labelX, labelY, labelWidth, labelHeight, 8);
    context.fillStyle = 'rgba(0, 0, 0, 0.88)';
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = `700 ${Math.max(14, Math.round(canvasWidth * 0.011))}px Arial`;
    context.textBaseline = 'middle';
    context.fillText(focus.label || 'Action', labelX + 14, labelY + labelHeight / 2, labelWidth - 24);
    context.restore();
  }

  private roundRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  private resizeImageDataUrl(src: string, maxWidth: number): Promise<string> {
    if (!src.startsWith('data:image/') || typeof Image === 'undefined' || typeof document === 'undefined') {
      return Promise.resolve(src);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        if (!image.naturalWidth || image.naturalWidth <= maxWidth) {
          resolve(src);
          return;
        }

        const scale = maxWidth / image.naturalWidth;
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');

        if (!context) {
          resolve(src);
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(src);
      image.src = src;
    });
  }

  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}

export const exportService = new ExportService();
