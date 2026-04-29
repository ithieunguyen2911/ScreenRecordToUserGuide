export interface GuideStep {
  timestamp: number;
  title: string;
  description: string;
  action: string;
  screenshot?: string;
  focus?: ActionFocus;
}

export interface ActionFocus {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelWidth?: number;
}

export interface UserGuide {
  title: string;
  introduction: string;
  steps: GuideStep[];
  importantNotes: string[];
}

export interface AppSettings {
  fileName: string;
  useMicrophone: boolean;
  saveToLocal: boolean;
  storageRoot: string;
}

export interface RecordingSettings {
  quality: 'high' | 'medium' | 'low';
  format: 'webm' | 'mp4';
  includeAudio: boolean;
  frameRate: number;
}

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  duration: number;
  actions?: RecordedAction[];
  localVideoPath?: string;
  sessionFolder?: string;
}

export interface RecordedAction {
  timestamp: number;
  action: 'click' | 'type' | 'scroll' | 'select' | 'hotkey' | 'navigate';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target?: string;
  screenshot?: string;
  screenshotPath?: string;
  controlType?: string;
}

export interface DesktopHelperStatus {
  ok: boolean;
  isRecording: boolean;
  actionCount: number;
}

export interface DesktopHelperDebugStatus {
  isHookInstalled: boolean;
  lastEventAt?: string;
  actionCount: number;
  hookThreadState: string;
  sessionFolder?: string;
}

export interface DesktopHelperAction {
  timestamp: number;
  type: 'click' | 'type' | 'scroll' | 'select' | 'hotkey' | 'navigate';
  screenX: number;
  screenY: number;
  width: number;
  height: number;
  screenLeft: number;
  screenTop: number;
  screenWidth: number;
  screenHeight: number;
  label: string;
  elementName?: string;
  controlType?: string;
  screenshot: string;
  screenshotPath?: string;
  capturedAt: string;
}

export interface DesktopHelperVideoUploadResult {
  saved: boolean;
  videoPath?: string;
}
