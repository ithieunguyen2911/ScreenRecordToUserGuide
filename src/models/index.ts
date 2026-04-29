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
}

export interface RecordedAction {
  timestamp: number;
  action: 'click' | 'type' | 'scroll';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target?: string;
}
