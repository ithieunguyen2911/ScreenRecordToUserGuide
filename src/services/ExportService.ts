import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { UserGuide } from '../models';

export class ExportService {
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

  exportGuideToWord(guide: UserGuide, fileName: string): void {
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const stepsHtml = guide.steps.map((step, index) => `
      <section style="page-break-inside: avoid; margin: 24px 0;">
        <h2>${String(index + 1).padStart(2, '0')}. ${escapeHtml(step.title)}</h2>
        <p><strong>Action:</strong> ${escapeHtml(step.action)} | <strong>Time:</strong> ${step.timestamp.toFixed(1)}s</p>
        <p>${escapeHtml(step.description)}</p>
        ${step.screenshot ? `<img src="${step.screenshot}" style="width: 100%; border: 1px solid #ddd; border-radius: 8px;" />` : ''}
        ${step.focus ? `<p><strong>Focus:</strong> ${escapeHtml(step.focus.label || 'Action')} (${step.focus.x.toFixed(1)}%, ${step.focus.y.toFixed(1)}%)</p>` : ''}
      </section>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(guide.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #202020; line-height: 1.55; }
            h1 { color: #111111; }
            h2 { color: #f97316; margin-bottom: 4px; }
            p { margin: 6px 0 12px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(guide.title)}</h1>
          <p>${escapeHtml(guide.introduction)}</p>
          <h2>Table of Contents</h2>
          <ol>${guide.steps.map(step => `<li>${escapeHtml(step.title)}</li>`).join('')}</ol>
          ${stepsHtml}
        </body>
      </html>
    `;

    this.downloadBlob(
      new Blob([html], { type: 'application/msword;charset=utf-8' }),
      `${fileName}.doc`
    );
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
