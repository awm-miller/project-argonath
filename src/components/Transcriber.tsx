import React, { useState, useEffect } from 'react';
import { Download, Loader2, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://entirely-apt-tadpole.ngrok-free.app';

console.log('Using API endpoint:', API_BASE_URL);

const fetchOptions = {
  mode: 'cors' as RequestMode,
  credentials: 'omit' as RequestCredentials,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
};

const jsonFetchOptions = {
  ...fetchOptions,
  headers: {
    ...fetchOptions.headers,
    'Content-Type': 'application/json',
  },
};

const formDataFetchOptions = {
  ...fetchOptions,
  headers: {
    ...fetchOptions.headers,
  },
};

interface ConversionJobStatus {
  status: 'pending' | 'downloading' | 'converting' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}

function Transcriber() {
  const [videoUrl, setVideoUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    window.location.href = downloadUrl;
  };

  const checkJobStatus = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/convert/status/${id}`,
        jsonFetchOptions
      );

      if (!response.ok) {
        let errorDetail = `Failed to check status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail
            ? `${errorDetail} - ${errorData.detail}`
            : errorDetail;
        } catch (parseError) {
          console.warn('Could not parse error response body:', parseError);
        }
        console.error(
          'Status check failed:',
          errorDetail,
          'Response:',
          response
        );
        throw new Error(errorDetail);
      }

      const data: ConversionJobStatus = await response.json();

      switch (data.status) {
        case 'pending':
          setProgress('Initializing...');
          setStatusMessage('Job is pending...');
          break;
        case 'downloading':
          setProgress('Downloading media...');
          setStatusMessage('Downloading media file...');
          break;
        case 'converting':
          setProgress('Converting to MP3...');
          setStatusMessage('Converting file to MP3 format...');
          break;
        case 'completed':
          if (data.download_url) {
            setProgress('Complete!');
            setStatusMessage(
              'Conversion complete! Click below to download your MP3.'
            );
            setDownloadUrl(`${API_BASE_URL}${data.download_url}`);
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
            setProcessing(false);
          } else {
            setProgress('Error');
            setStatusMessage('Processing complete, but download URL missing.');
            setError(
              data.error || 'An unknown error occurred after completion.'
            );
            if (pollInterval) clearInterval(pollInterval);
            setProcessing(false);
          }
          break;
        case 'failed':
          setProgress('Failed');
          setStatusMessage('Job failed.');
          setError(data.error || 'An unknown error occurred during conversion');
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          setProcessing(false);
          break;
        default:
          setProgress('Unknown Status');
          setStatusMessage(`Unknown job status received: ${data.status}`);
          setError(`Unexpected status: ${data.status}`);
          if (pollInterval) clearInterval(pollInterval);
          setProcessing(false);
      }
    } catch (err) {
      console.error('Raw status check error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while checking job status';
      setError(errorMessage);
      setProgress('Error');
      setStatusMessage('Error checking job status.');
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setProcessing(false);
    }
  };

  const startPolling = (id: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    const interval = setInterval(() => checkJobStatus(id), 10000);
    setPollInterval(interval);
    setTimeout(() => checkJobStatus(id), 1000);
  };

  const handleSubmit = async () => {
    if (!videoUrl || !videoUrl.trim().match(/^https?:\/\//)) {
      setError(
        'Please enter a valid video URL starting with http:// or https://'
      );
      return;
    }

    setError(null);
    setProcessing(true);
    setStatusMessage('Submitting conversion job...');
    setProgress('Submitting...');
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('url', videoUrl);

      const submitOptions = {
        ...formDataFetchOptions,
        method: 'POST',
        body: formData,
      };

      const response = await fetch(`${API_BASE_URL}/convert`, submitOptions);

      if (response.status === 202) {
        const data = await response.json();
        if (data.job_id) {
          setJobId(data.job_id);
          setStatusMessage(
            'Job submitted successfully! Starting conversion...'
          );
          startPolling(data.job_id);
        } else {
          throw new Error('Submission successful, but no Job ID received.');
        }
      } else {
        let errorText = `Failed to start job: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorText = errorData.detail || errorText;
        } catch {}
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred during submission';
      setError(errorMessage);
      setStatusMessage('Error submitting job.');
      setProgress('Error');
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setVideoUrl('');
    setJobId(null);
    if (pollInterval) clearInterval(pollInterval);
    setPollInterval(null);
    setDownloadUrl(null);
    setProgress('');
    setStatusMessage('');
    setProcessing(false);
    setError(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Transcriber Helper</h1>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400">
            {progress && (
              <span className="flex items-center gap-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                {progress}
              </span>
            )}
          </div>
          {(videoUrl || jobId || error || downloadUrl) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-400 hover:text-gray-300"
              disabled={processing && !downloadUrl}
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="video-url"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Video URL
            </label>
            <input
              type="url"
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter any video URL (e.g., YouTube, Vimeo, direct link)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              disabled={processing || !!downloadUrl}
            />
          </div>

          {!processing && !downloadUrl && (
            <button
              onClick={handleSubmit}
              disabled={!videoUrl || processing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Start Conversion
            </button>
          )}

          {statusMessage && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                error
                  ? 'bg-red-900/50 border-red-800 text-red-200'
                  : downloadUrl
                  ? 'bg-green-900/50 border-green-800 text-green-200'
                  : 'bg-blue-900/50 border-blue-800 text-blue-200'
              }`}
            >
              <div className="flex items-center">
                {processing && !downloadUrl && !error && (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                )}
                {error && <X className="w-5 h-5 mr-2" />}
                {downloadUrl && <Download className="w-5 h-5 mr-2" />}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Download className="w-6 h-6 mr-2" />
                  Download MP3
                </button>
                <a
                  href="https://notebooklm.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open NotebookLM
                </a>
              </div>

              <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Instructions:
                </h3>
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
    </div>
  );
}

export default Transcriber;