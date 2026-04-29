import { RecordingSettings, RecordingResult } from '../models';

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private displayStream: MediaStream | null = null;
  private microphoneStream: MediaStream | null = null;
  private recordingStream: MediaStream | null = null;
  private startedAt = 0;

  async startRecording(settings: RecordingSettings, videoPreview: HTMLVideoElement | null): Promise<void> {
    this.chunks = [];
    this.cleanup();

    this.displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: settings.frameRate,
        width: settings.quality === 'high' ? 1920 : settings.quality === 'medium' ? 1280 : 854,
        cursor: 'always',
      },
      audio: false
    } as DisplayMediaStreamOptions);

    if (settings.includeAudio) {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const tracks = [
      ...this.displayStream.getVideoTracks(),
      ...(this.microphoneStream?.getAudioTracks() ?? [])
    ];
    this.recordingStream = new MediaStream(tracks);

    if (videoPreview) {
      videoPreview.srcObject = this.displayStream;
    }

    const mimeType = settings.format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';
    this.mediaRecorder = new MediaRecorder(this.recordingStream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.startedAt = Date.now();
    this.mediaRecorder.start();
  }

  stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      const recorder = this.mediaRecorder;
      let settled = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);

        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const duration = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;

        this.stopStreams();
        this.mediaRecorder = null;

        resolve({
          blob,
          mimeType,
          duration
        });
      };

      this.mediaRecorder.onstop = () => {
        finish();
      };

      this.mediaRecorder.onerror = () => {
        finish();
      };

      fallbackTimer = setTimeout(finish, 500);

      try {
        if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
          this.mediaRecorder.requestData?.();
          this.mediaRecorder.stop();
        } else {
          finish();
        }
      } catch {
        finish();
      } finally {
        this.stopStreams();
      }
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getState(): RecordingState | undefined {
    return this.mediaRecorder?.state;
  }

  cleanup(): void {
    this.stopStreams();
    this.mediaRecorder = null;
    this.chunks = [];
    this.startedAt = 0;
  }

  private stopStreams(): void {
    this.displayStream?.getTracks().forEach(track => track.stop());
    this.microphoneStream?.getTracks().forEach(track => track.stop());
    this.recordingStream?.getTracks().forEach(track => track.stop());
    this.displayStream = null;
    this.microphoneStream = null;
    this.recordingStream = null;
  }
}

export const recordingService = new RecordingService();
