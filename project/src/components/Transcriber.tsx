import React, { useState, useEffect } from 'react';
import { Download, Loader2, X } from 'lucide-react';
// Remove the old ConversionStatus import if no longer used directly
// import type { ConversionStatus } from '../models/TranscriptionResult';

// Backend API base URL - configurable based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://entirely-apt-tadpole.ngrok-free.app';

// Add a debug log to help troubleshoot connection issues
console.log('Using API endpoint:', API_BASE_URL);

// Add shared fetch options for CORS handling
const fetchOptions = {
  mode: 'cors' as RequestMode,
  credentials: 'omit' as RequestCredentials,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
};

// Separate options for JSON requests
const jsonFetchOptions = {
  ...fetchOptions,
  headers: {
    ...fetchOptions.headers,
    'Content-Type': 'application/json',
  },
};

// Separate options for FormData requests (don't set Content-Type, let browser handle it)
const formDataFetchOptions = {
  ...fetchOptions,
  headers: {
    ...fetchOptions.headers,
  },
};

// Define expected job status shape from backend
interface ConversionJobStatus {
  status: 'pending' | 'downloading' | 'converting' | 'completed' | 'failed';
  download_url?: string; // Will be a full URL now
  error?: string;
}

function Transcriber() {
  const [videoUrl, setVideoUrl] = useState('');
  // Replace old status state with new job-related states
  // const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null); // Full URL for download
  const [progress, setProgress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Function to handle download click (similar to Reverberate)
  const handleDownload = () => {
    if (!downloadUrl) return;
    // Trigger download using the full URL stored in state
    window.location.href = downloadUrl;
    // Optionally reset after download starts
    // resetForm();
  };

  const checkJobStatus = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/convert/status/${id}`,
        jsonFetchOptions
      );

      if (!response.ok) {
        // Try to get error detail from response
        let errorDetail = `Failed to check status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          // Use the specific detail from FastAPI error response if available
          errorDetail = errorData.detail
            ? `${errorDetail} - ${errorData.detail}`
            : errorDetail;
        } catch (parseError) {
          // If parsing fails, log it but stick with the statusText
          console.warn('Could not parse error response body:', parseError);
        }
        // Log the specific error before throwing
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
            // Use the full URL directly from the backend
            setDownloadUrl(data.download_url);
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
            setProcessing(false);
          } else {
            // This case should ideally not happen based on backend logic
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
          // Handle unexpected status
          setProgress('Unknown Status');
          setStatusMessage(`Unknown job status received: ${data.status}`);
          setError(`Unexpected status: ${data.status}`);
          if (pollInterval) clearInterval(pollInterval);
          setProcessing(false);
      }
    } catch (err) {
      // Log the raw error for better debugging
      console.error('Raw status check error:', err);
      // Display a more informative error message
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while checking job status. Check console for details.';
      setError(errorMessage);
      setProgress('Error');
      setStatusMessage('Error checking job status.'); // Keep simple message for UI
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
    // Poll more frequently initially, e.g., every 10 seconds
    const interval = setInterval(() => checkJobStatus(id), 10000);
    setPollInterval(interval);
    // Add a small delay before first check to avoid race condition
    setTimeout(() => checkJobStatus(id), 1000); // Wait 1 second before first check
  };

  // Renamed from handleConversion to handleSubmit
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
    setDownloadUrl(null); // Clear previous download URL

    try {
      // Create form data for the initial request
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
      <h1 className="text-2xl font-bold mb-6">Transcriber Helper</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          {/* Remove the redundant progress indicator that was circled in red */}
          <div className="text-sm text-gray-500">
            {/* Progress indicator removed */}
          </div>
          {/* Reset Button */}
          {(videoUrl || jobId || error || downloadUrl) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={processing && !downloadUrl} // Allow reset if processing but download is ready
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="video-url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Video URL
            </label>
            <input
              type="url"
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter any video URL (e.g., YouTube, Vimeo, direct link)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={processing || !!downloadUrl} // Disable if processing or already complete
            />
          </div>

          {/* Submit Button - Show if not processing and no download URL */}
          {!processing && !downloadUrl && (
            <button
              onClick={handleSubmit} // Changed from handleConversion
              disabled={!videoUrl || processing} // Keep disabled check
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Start Conversion
            </button>
          )}

          {/* Status Message Area */}
          {statusMessage && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                error
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : downloadUrl
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <div className="flex items-center">
                {/* Show spinner if processing and not yet downloadable/failed */}
                {processing && !downloadUrl && !error && (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                )}
                {/* Show X icon on error */}
                {error && <X className="w-5 h-5 mr-2 text-red-600" />}
                {/* Show Download icon when complete */}
                {downloadUrl && (
                  <Download className="w-5 h-5 mr-2 text-green-600" />
                )}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Error Display Area (redundant? statusMessage shows error too) */}
          {/* error && !statusMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          ) */}

          {/* Download and NotebookLM Buttons - Show when downloadUrl is ready */}
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

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
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
