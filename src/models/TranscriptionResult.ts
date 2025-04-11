export interface TranscriptionResult {
  message: string;
  full_text: string;
  segments: {
    start: number;
    end: number;
    text: string;
  }[];
}

export interface StreamUpdate {
  status: 'starting' | 'downloading' | 'processing' | 'transcribing' | 'moving' | 'moved' | 'transcribed' | 'complete' | 'error';
  message: string;
  progress?: number;
  downloaded_mb?: number;
  total_mb?: number;
  file_path?: string;
  url?: string;
  full_text?: string;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
}