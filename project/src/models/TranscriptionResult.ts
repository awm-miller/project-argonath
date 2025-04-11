export interface ConversionStatus {
  status: 'converting' | 'complete' | 'error';
  message?: string;
  url?: string;
}