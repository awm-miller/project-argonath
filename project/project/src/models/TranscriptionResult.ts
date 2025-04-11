export interface TranscriptionResult {
  message: string;
  full_text: string;
  segments: {
    start: number;
    end: number;
    text: string;
  }[];
}