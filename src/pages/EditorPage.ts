import { exportService } from '../services/ExportService';

export class EditorPage {
  private content: string;
  private isEditing: boolean;
  private isExporting: boolean;

  constructor() {
    this.content = '';
    this.isEditing = false;
    this.isExporting = false;
  }

  initialize(initialContent: string): void {
    this.content = initialContent;
    this.isEditing = false;
    this.isExporting = false;
  }

  getContent(): string {
    return this.content;
  }

  setContent(newContent: string): void {
    this.content = newContent;
  }

  isEditMode(): boolean {
    return this.isEditing;
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  finishEditing(): void {
    this.isEditing = false;
  }

  async copyToClipboard(): Promise<void> {
    await exportService.copyToClipboard(this.content);
  }

  async exportToPDF(elementId: string, fileName: string = 'User_Guide'): Promise<void> {
    this.isExporting = true;
    try {
      await exportService.exportToMultiPagePDF(elementId, fileName);
    } finally {
      this.isExporting = false;
    }
  }

  isCurrentlyExporting(): boolean {
    return this.isExporting;
  }
}

export const editorPage = new EditorPage();