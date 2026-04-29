import { AppSettings } from '../models';

export class SetupPage {
  private settings: AppSettings;
  private micPermission: 'prompt' | 'granted' | 'denied';

  constructor() {
    this.settings = {
      fileName: `Record_${new Date().toLocaleDateString().replace(/\//g, '-')}_${new Date().toLocaleTimeString().replace(/:/g, '-')}`,
      useMicrophone: false,
      saveToLocal: true,
    };
    this.micPermission = 'prompt';
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getMicPermission(): 'prompt' | 'granted' | 'denied' {
    return this.micPermission;
  }

  setSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  async toggleMicrophone(): Promise<boolean> {
    if (!this.settings.useMicrophone) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micPermission = 'granted';
        this.settings.useMicrophone = true;
        return true;
      } catch {
        this.micPermission = 'denied';
        alert("Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.");
        return false;
      }
    } else {
      this.settings.useMicrophone = false;
      return true;
    }
  }

  onStart(onStartCallback: (settings: AppSettings) => void): void {
    onStartCallback(this.settings);
  }
}

export const setupPage = new SetupPage();