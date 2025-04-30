import React, { useState, useEffect } from 'react';
import { Download, Loader2, X } from 'lucide-react';

// Backend API base URL
const API_BASE_URL = 'https://entirely-apt-tadpole.ngrok-free.app';

// Add shared fetch options for CORS handling
const fetchOptions = {
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials,
  headers: {
    Accept: 'application/json',
  },
};

// Define expected job status shape from backend
interface ArchiveJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}

function InternetArchive() {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkJobStatus = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/internet-archive/status/${id}`,
        fetchOptions
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

      const data: ArchiveJobStatus = await response.json();

      switch (data.status) {
        case 'pending':
          setProgress('Initializing...');
          setStatusMessage('Job is pending...');
          break;
        case 'processing':
          setProgress('Processing archive data...');
          setStatusMessage(
            'Searching and analyzing Internet Archive snapshots...'
          );
          break;
        case 'completed':
          if (data.download_url) {
            setProgress('Complete!');
            setStatusMessage(
              'Processing complete! Click below to download your results.'
            );
            setDownloadUrl(`${API_BASE_URL}${data.download_url}`);
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
            setProcessing(false);
          } else {
            setProgress('No Results');
            setStatusMessage('Processing complete, but no results were found.');
            setError(data.error || 'No archive data found for your URL.');
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
            setProcessing(false);
          }
          break;
        case 'failed':
          setProgress('Failed');
          setStatusMessage('Job failed.');
          setError(data.error || 'An unknown error occurred during processing');
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
    // Poll every 10 seconds
    const interval = setInterval(() => checkJobStatus(id), 10000);
    setPollInterval(interval);
    checkJobStatus(id); // Initial check
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    window.location.href = downloadUrl;
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setProgress('Submitting...');
    setStatusMessage('Submitting job...');
    setProcessing(true);
    setDownloadUrl(null);

    try {
      // Create a modified version of fetchOptions with Content-Type header
      const postOptions = {
        ...fetchOptions,
        method: 'POST',
        headers: {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      };

      const response = await fetch(
        `${API_BASE_URL}/internet-archive`,
        postOptions
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process URL');
      }

      const data = await response.json();
      if (data.job_id) {
        setJobId(data.job_id);
        setStatusMessage('Job submitted successfully! Starting analysis...');
        startPolling(data.job_id);
      } else {
        throw new Error('Submission successful, but no Job ID received.');
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
    setUrl('');
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
      <h1 className="text-2xl font-bold mb-6">
        Internet Archive Search [BETA]
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {/* Progress indicator removed (like in Transcriber) */}
          </div>
          {(url || jobId || error || downloadUrl) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={processing && !downloadUrl}
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to search in Internet Archive"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={processing || !!downloadUrl}
            />
          </div>

          {/* Submit Button - Show if not processing and no download URL */}
          {!processing && !downloadUrl && (
            <button
              onClick={handleSubmit}
              disabled={!url || processing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Search Archive
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
                {processing && !downloadUrl && !error && (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                )}
                {error && <X className="w-5 h-5 mr-2 text-red-600" />}
                {downloadUrl && (
                  <Download className="w-5 h-5 mr-2 text-green-600" />
                )}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Download Button - Show when downloadUrl is ready */}
          {downloadUrl && (
            <button
              onClick={handleDownload}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InternetArchive;
