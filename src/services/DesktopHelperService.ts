import { DesktopHelperAction, DesktopHelperStatus, RecordedAction } from '../models';

const HELPER_URL = 'http://127.0.0.1:55231';
export class DesktopHelperService {
  async getStatus(): Promise<DesktopHelperStatus | null> {
    return this.request<DesktopHelperStatus>('/health', { method: 'GET' });
  }

  async start(): Promise<boolean> {
    const status = await this.request<DesktopHelperStatus>('/session/start', { method: 'POST' });
    return Boolean(status?.ok);
  }

  async stop(): Promise<RecordedAction[]> {
    const actions = await this.request<DesktopHelperAction[]>('/session/stop', { method: 'POST' });
    return (actions ?? []).map(action => this.toRecordedAction(action));
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
    const xPercent = ((action.screenX - (action.screenLeft || 0)) / screenWidth) * 100 - widthPercent / 2;
    const yPercent = ((action.screenY - (action.screenTop || 0)) / screenHeight) * 100 - heightPercent / 2;

    return {
      timestamp: action.timestamp,
      action: action.type,
      label: action.label,
      x: this.clamp(xPercent, 0, 100 - widthPercent),
      y: this.clamp(yPercent, 0, 100 - heightPercent),
      width: this.clamp(widthPercent, 4, 35),
      height: this.clamp(heightPercent, 4, 20),
      screenshot: action.screenshot,
      target: 'desktop screen',
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}

export const desktopHelperService = new DesktopHelperService();
