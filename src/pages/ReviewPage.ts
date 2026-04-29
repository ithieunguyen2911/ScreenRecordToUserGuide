import { UserGuide } from '../models';
import { exportService } from '../services/ExportService';

export class ReviewPage {
  private guide: UserGuide | null;
  private fileName: string;
  private activeStep: number | null;
  private isExporting: boolean;

  constructor() {
    this.guide = null;
    this.fileName = '';
    this.activeStep = null;
    this.isExporting = false;
  }

  initialize(guide: UserGuide, fileName: string): void {
    this.guide = guide;
    this.fileName = fileName;
    this.activeStep = null;
  }

  getGuide(): UserGuide | null {
    return this.guide;
  }

  getFileName(): string {
    return this.fileName;
  }

  getActiveStep(): number | null {
    return this.activeStep;
  }

  setActiveStep(step: number | null): void {
    this.activeStep = step;
  }

  scrollToStep(idx: number): void {
    this.activeStep = idx;
    const el = document.getElementById(`step-${idx}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  downloadVideo(videoBlob: Blob): void {
    if (videoBlob) {
      exportService.downloadBlob(videoBlob, `${this.fileName}.webm`);
    }
  }

  async exportToPDF(elementId: string): Promise<void> {
    this.isExporting = true;
    try {
      await exportService.exportToMultiPagePDF(elementId, this.fileName);
    } finally {
      this.isExporting = false;
    }
  }

  async exportToWord(): Promise<void> {
    if (!this.guide) {
      throw new Error('No guide available to export');
    }
    await exportService.exportGuideToWord(this.guide, this.fileName);
  }

  isCurrentlyExporting(): boolean {
    return this.isExporting;
  }

  reset(): void {
    this.guide = null;
    this.activeStep = null;
    this.isExporting = false;
  }
}

export const reviewPage = new ReviewPage();
