import { AppSettings, RecordingSettings, RecordingResult } from '../models';
import { recordingService } from '../services/RecordingService';

export class RecordingPage {
  private settings: AppSettings | null;
  private isRecording: boolean;
  private duration: number;
  private recorderSettings: RecordingSettings;
  private showSettings: boolean;

  constructor() {
    this.settings = null;
    this.isRecording = false;
    this.duration = 0;
    this.recorderSettings = {
      quality: 'high',
      format: 'webm',
      includeAudio: true,
      frameRate: 30
    };
    this.showSettings = false;
  }

  initialize(settings: AppSettings | null): void {
    this.settings = settings;
    this.recorderSettings.includeAudio = settings?.useMicrophone ?? true;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getDuration(): number {
    return this.duration;
  }

  getRecorderSettings(): RecordingSettings {
    return { ...this.recorderSettings };
  }

  shouldShowSettings(): boolean {
    return this.showSettings;
  }

  updateRecorderSettings(newSettings: Partial<RecordingSettings>): void {
    this.recorderSettings = { ...this.recorderSettings, ...newSettings };
  }

  toggleSettingsPanel(): void {
    this.showSettings = !this.showSettings;
  }

  async startRecording(videoPreview: HTMLVideoElement | null): Promise<void> {
    try {
      await recordingService.startRecording(this.recorderSettings, videoPreview);
      this.isRecording = true;
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Không thể bắt đầu quay màn hình. Vui lòng cấp quyền truy cập.");
      throw err;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    const result = await recordingService.stopRecording();
    this.isRecording = false;
    return result;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  incrementDuration(): void {
    this.duration += 1;
  }

  resetDuration(): void {
    this.duration = 0;
  }

  cleanup(): void {
    recordingService.cleanup();
    this.isRecording = false;
    this.duration = 0;
  }
}

export const recordingPage = new RecordingPage();