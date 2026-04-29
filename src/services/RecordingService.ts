import { RecordingSettings, RecordingResult } from '../models';

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private displayStream: MediaStream | null = null;

  async startRecording(settings: RecordingSettings, videoPreview: HTMLVideoElement | null): Promise<void> {
    this.chunks = [];

    this.displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: settings.frameRate,
        width: settings.quality === 'high' ? 1920 : settings.quality === 'medium' ? 1280 : 854,
      },
      audio: settings.includeAudio
    });

    if (videoPreview) {
      videoPreview.srcObject = this.displayStream;
    }

    const mimeType = settings.format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';
    this.mediaRecorder = new MediaRecorder(this.displayStream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
  }

  stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });

        this.displayStream?.getTracks().forEach(track => track.stop());

        resolve({
          blob,
          mimeType,
          duration: 0
        });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getState(): MediaRecorderState | undefined {
    return this.mediaRecorder?.state;
  }

  cleanup(): void {
    this.displayStream?.getTracks().forEach(track => track.stop());
    this.displayStream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

export const recordingService = new RecordingService();