export interface GuideStep {
  timestamp: number;
  title: string;
  description: string;
  action: string;
  screenshot?: string; // base64
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
