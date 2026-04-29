import {
  AppSettings,
  DesktopHelperAction,
  DesktopHelperDebugStatus,
  DesktopHelperStatus,
  DesktopHelperVideoUploadResult,
  RecordedAction,
} from '../models';

const HELPER_URL = 'http://127.0.0.1:55231';
export class DesktopHelperService {
  async getStatus(): Promise<DesktopHelperStatus | null> {
    return this.request<DesktopHelperStatus>('/health', { method: 'GET' });
  }

  async getDebugStatus(): Promise<DesktopHelperDebugStatus | null> {
    return this.request<DesktopHelperDebugStatus>('/session/debug', { method: 'GET' });
  }

  async start(settings: AppSettings): Promise<boolean> {
    const status = await this.request<DesktopHelperStatus>('/session/start', {
      method: 'POST',
      body: JSON.stringify({
        storageRoot: settings.storageRoot,
        recordName: this.sanitizeRecordName(settings.fileName),
      }),
    });
    return Boolean(status?.ok);
  }

  async stop(): Promise<RecordedAction[]> {
    const actions = await this.request<DesktopHelperAction[]>('/session/stop', { method: 'POST' });
    return (actions ?? []).map(action => this.toRecordedAction(action));
  }

  async uploadVideo(blob: Blob, fileName: string): Promise<DesktopHelperVideoUploadResult | null> {
    try {
      const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('video', blob, `${this.sanitizeRecordName(fileName)}.${extension}`);
      const response = await fetch(`${HELPER_URL}/session/video`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) return null;
      return await response.json() as DesktopHelperVideoUploadResult;
    } catch {
      return null;
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(`${HELPER_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });

      if (!response.ok) return null;
      return await response.json() as T;
    } catch {
      return null;
    }
  }

  private toRecordedAction(action: DesktopHelperAction): RecordedAction {
    const screenWidth = action.screenWidth || 1920;
    const screenHeight = action.screenHeight || 1080;
    const widthPercent = (action.width / screenWidth) * 100;
    const heightPercent = (action.height / screenHeight) * 100;
    const xPercent = ((action.screenX - (action.screenLeft || 0)) / screenWidth) * 100;
    const yPercent = ((action.screenY - (action.screenTop || 0)) / screenHeight) * 100;

    return {
      timestamp: action.timestamp,
      action: action.type,
      label: action.label,
      x: this.clamp(xPercent, 0, 100 - widthPercent),
      y: this.clamp(yPercent, 0, 100 - heightPercent),
      width: this.clamp(widthPercent, 4, 35),
      height: this.clamp(heightPercent, 4, 20),
      screenshot: action.screenshot,
      screenshotPath: action.screenshotPath,
      target: action.elementName || action.controlType || 'desktop screen',
      controlType: action.controlType,
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private sanitizeRecordName(value: string) {
    return value.replace(/[<>:"/\\|?*]/g, '_').trim() || `Record_${Date.now()}`;
  }
}

export const desktopHelperService = new DesktopHelperService();
