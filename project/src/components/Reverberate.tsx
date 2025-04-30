import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Plus, Minus, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Backend API base URL
const API_BASE_URL = 'https://entirely-apt-tadpole.ngrok-free.app';

// Common fetch options for all API calls
const fetchOptions = {
  mode: 'cors' as RequestMode,
  credentials: 'omit' as RequestCredentials,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  }
};

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}

function Reverberate() {
  const { user } = useAuth();
  const [names, setNames] = useState('');
  const [keywords, setKeywords] = useState(['']);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const downloadResults = async () => {
    if (!downloadUrl) return;
    
    try {
      // Construct full URL
      const fullUrl = `${API_BASE_URL}${downloadUrl}`;
      
      // Trigger download
      window.location.href = fullUrl;
      
      // Reset form after successful download
      resetForm();
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download results. Please try again.");
    }
  };

  const checkJobStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reverberate/status/${id}`, fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.status} ${response.statusText}`);
      }
      
      const data: JobStatus = await response.json();
      
      switch (data.status) {
        case 'pending':
          setProgress('Initializing...');
          setStatusMessage('Job is pending...');
          break;
        case 'processing':
          setProgress('Processing names...');
          setStatusMessage('Processing your request...');
          break;
        case 'completed':
          if (data.download_url) {
            setProgress('Complete!');
            setStatusMessage('Processing complete! Click below to download your results.');
            setDownloadUrl(data.download_url);
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
          } else {
            setProgress('No Results');
            setStatusMessage('Processing complete, but no results were found.');
            setError(data.error || 'No results found for your search.');
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
          setError(data.error || 'An unknown error occurred');
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          setProcessing(false);
          break;
      }
    } catch (err) {
      console.error("Status check error:", err);
      setError(err instanceof Error ? err.message : 'Failed to check job status');
      setProgress('Error');
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setProcessing(false);
    }
  };

  const startPolling = (id: string) => {
    // Clear any existing polling
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    // Start polling every 30 seconds
    const interval = setInterval(() => checkJobStatus(id), 30000);
    setPollInterval(interval);
    
    // Do an immediate check
    checkJobStatus(id);
  };

  const handleAddKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, '']);
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const validateInput = () => {
    if (!names.trim()) {
      setError('Please enter at least one name');
      return false;
    }

    const nameList = names.split(',').map(name => name.trim());
    if (nameList.some(name => !name)) {
      setError('Invalid name format. Please check your input');
      return false;
    }

    if (keywords.some(keyword => !keyword.trim())) {
      setError('Please fill in all keyword fields or remove empty ones');
      return false;
    }

    if (!user?.email) {
      setError('You must be logged in to use this feature');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setNames('');
    setKeywords(['']);
    setProcessing(false);
    setStatusMessage('');
    setError(null);
    setShowHelp(false);
    setJobId(null);
    setDownloadUrl(null);
    setProgress('');
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }

    setError(null);
    setProcessing(true);
    setStatusMessage('Submitting job...');

    try {
      // Create CSV content
      const nameList = names.split(',').map(name => name.trim()).filter(Boolean);
      if (nameList.length === 0) {
        throw new Error("No valid names provided after trimming.");
      }
      const csvContent = nameList.join('\n');

      // Create form data
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'names.csv');
      
      // Join all keywords with commas and send as a single field
      const keywordsString = keywords
        .map(k => k.trim())
        .filter(k => k)
        .join(',');
      if (!keywordsString) {
        throw new Error("Keywords cannot be empty.");
      }
      formData.append('keywords', keywordsString);

      // Submit job
      const response = await fetch(`${API_BASE_URL}/reverberate/`, {
        ...fetchOptions,
        method: 'POST',
        body: formData,
      });

      if (response.status === 202) {
        const data = await response.json();
        setJobId(data.job_id);
        setStatusMessage('Job submitted successfully! Starting processing...');
        startPolling(data.job_id);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to start job: ${response.status} ${response.statusText}. ${errorText}`);
      }

    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatusMessage('Error submitting job.');
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reverberate</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {progress && (
              <span className="flex items-center gap-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                {progress}
              </span>
            )}
          </div>
          {(names || keywords.length > 1 || keywords[0] || processing) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={processing && !downloadUrl} // Allow reset after download is ready
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Names
              </label>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Show input format help"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Enter names, one per line or separated by commas"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={processing}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Keywords (max 10)
              </label>
              {keywords.length < 10 && (
                <button
                  onClick={handleAddKeyword}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  disabled={processing}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Keyword
                </button>
              )}
            </div>
            {keywords.map((keyword, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder={`Keyword ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={processing}
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                    disabled={processing}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className={`p-4 rounded-lg border ${
              error ? 'bg-red-50 border-red-200 text-red-700' :
              downloadUrl ? 'bg-green-50 border-green-200 text-green-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center">
                {processing && !downloadUrl && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {error && <X className="w-5 h-5 mr-2 text-red-600" />}
                {downloadUrl && <Download className="w-5 h-5 mr-2 text-green-600" />}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {downloadUrl ? (
            <button
              onClick={downloadResults}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Results
            </button>
          ) : !processing ? (
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Process Names
            </button>
          ) : null}

          {showHelp && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Valid name formats:
              </h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div>
                  <div className="font-medium mb-1">✓ One name per line:</div>
                  <pre className="bg-white p-2 rounded border border-blue-100">
                    John Doe
                    Jane Smith
                    Bob Johnson</pre>
                </div>
                <div>
                  <div className="font-medium mb-1">✓ Comma-separated:</div>
                  <pre className="bg-white p-2 rounded border border-blue-100">John Doe, Jane Smith, Bob Johnson</pre>
                </div>
                <div>
                  <div className="font-medium mb-1">✓ Mixed format:</div>
                  <pre className="bg-white p-2 rounded border border-blue-100">
                    John Doe, Jane Smith
                    Bob Johnson</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reverberate;