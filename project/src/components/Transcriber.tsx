import React, { useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import type { ConversionStatus } from '../models/TranscriptionResult';

function Transcriber() {
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConversion = async () => {
    if (!videoUrl) {
      setError('Please enter a valid video URL');
      return;
    }

    setError(null);
    setStatus({ status: 'converting' });

    try {
      const response = await fetch(`https://entirely-apt-tadpole.ngrok-free.app/convert?url=${encodeURIComponent(videoUrl)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to convert video');
      }

      // Get the blob from the response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setStatus({
        status: 'complete',
        url
      });

      // Open NotebookLM in a new tab
      window.open('https://notebooklm.google.com', '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
      setStatus({ status: 'error' });
    }
  };

  const resetForm = () => {
    setVideoUrl('');
    setStatus(null);
    setError(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transcriber Helper</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-end mb-4">
          {(videoUrl || status || error) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <input
              type="url"
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter any video URL to quickly transcribe from anywhere"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={status?.status === 'converting'}
            />
          </div>

          <button
            onClick={handleConversion}
            disabled={!videoUrl || status?.status === 'converting'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status?.status === 'converting' ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Converting...
              </span>
            ) : (
              'Start Conversion'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {status?.status === 'complete' && (
          <div className="mt-6">
            <div className="flex gap-4">
              <a
                href={status.url}
                download="audio.mp3"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Download className="w-6 h-6 mr-2" />
                Download MP3
              </a>
              <a
                href="https://notebooklm.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open NotebookLM
              </a>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Instructions:</h3>
              <img 
                src="https://i.imgur.com/w2hHB5e.png" 
                alt="Instructions for using NotebookLM" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transcriber;