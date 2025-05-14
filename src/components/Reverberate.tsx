import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Plus, Minus, HelpCircle, ChevronRight, AlertTriangle, CheckCircle, Search } from 'lucide-react';
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

interface AnalysisJobStatus extends JobStatus {
  analysis_job_id?: string;
  original_job_id?: string;
}

interface Finding {
  quote: string;
  source: string;
  category: string;
  reason: string;
}

interface Summary {
  subject: string;
  summary: string;
  significance: string;
}

interface AnalysisResult {
  meta: {
    job_id: string;
    original_job_id: string;
    processed_at: string;
    chunks_processed: number;
    total_files_analyzed: number;
  };
  findings: Finding[];
  summaries: Summary[];
  errors: string[];
}

function Reverberate() {
  const { user } = useAuth();
  const [names, setNames] = useState('');
  const [keywords, setKeywords] = useState(['']);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Original reverberate job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  // Analysis job state
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [analysisPollInterval, setAnalysisPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (analysisPollInterval) {
        clearInterval(analysisPollInterval);
      }
    };
  }, [pollInterval, analysisPollInterval]);

  const downloadResults = async () => {
    if (!downloadUrl) return;
    
    try {
      // Construct full URL
      const fullUrl = `${API_BASE_URL}${downloadUrl}`;
      
      // Trigger download
      window.location.href = fullUrl;
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download results. Please try again.");
    }
  };

  const downloadAnalysisResults = async () => {
    if (!analysisJobId || analysisStatus !== 'completed') return;
    
    try {
      const downloadUrl = `${API_BASE_URL}/reverberate/analyze/download/${analysisJobId}`;
      window.location.href = downloadUrl;
    } catch (err) {
      console.error("Analysis download error:", err);
      setAnalysisError("Failed to download analysis results. Please try again.");
    }
  };

  const fetchAnalysisResults = async () => {
    if (!analysisJobId || analysisStatus !== 'completed') return;
    
    try {
      const downloadUrl = `${API_BASE_URL}/reverberate/analyze/download/${analysisJobId}`;
      const response = await fetch(downloadUrl, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis results: ${response.status} ${response.statusText}`);
      }
      
      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis fetch error:", err);
      setAnalysisError(err instanceof Error ? err.message : "Failed to fetch analysis results");
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
            setStatusMessage('Processing complete! Download your results or run AI analysis.');
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

  const checkAnalysisJobStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reverberate/analyze/status/${id}`, fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to check analysis status: ${response.status} ${response.statusText}`);
      }
      
      const data: AnalysisJobStatus = await response.json();
      setAnalysisStatus(data.status);
      
      switch (data.status) {
        case 'pending':
          setAnalysisProgress('Initializing analysis...');
          break;
        case 'processing':
          setAnalysisProgress('Analyzing search results...');
          break;
        case 'completed':
          setAnalysisProgress('Analysis complete!');
          if (analysisPollInterval) {
            clearInterval(analysisPollInterval);
            setAnalysisPollInterval(null);
          }
          // Fetch the analysis results
          await fetchAnalysisResults();
          setShowAnalysis(true);
          break;
        case 'failed':
          setAnalysisProgress('Analysis failed');
          setAnalysisError(data.error || 'An unknown error occurred during analysis');
          if (analysisPollInterval) {
            clearInterval(analysisPollInterval);
            setAnalysisPollInterval(null);
          }
          break;
      }
    } catch (err) {
      console.error("Analysis status check error:", err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to check analysis status');
      setAnalysisProgress('Error');
      if (analysisPollInterval) {
        clearInterval(analysisPollInterval);
        setAnalysisPollInterval(null);
      }
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

  const startAnalysisPolling = (id: string) => {
    // Clear any existing polling
    if (analysisPollInterval) {
      clearInterval(analysisPollInterval);
    }
    
    // Start polling every 30 seconds
    const interval = setInterval(() => checkAnalysisJobStatus(id), 30000);
    setAnalysisPollInterval(interval);
    
    // Do an immediate check
    checkAnalysisJobStatus(id);
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
    
    // Reset analysis state
    setAnalysisJobId(null);
    setAnalysisStatus(null);
    setAnalysisProgress('');
    setAnalysisError(null);
    setAnalysisResult(null);
    setShowAnalysis(false);
    if (analysisPollInterval) {
      clearInterval(analysisPollInterval);
      setAnalysisPollInterval(null);
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

  const handleStartAnalysis = async () => {
    if (!jobId || !downloadUrl) {
      setAnalysisError('No completed job available to analyze');
      return;
    }

    setAnalysisError(null);
    setAnalysisProgress('Submitting analysis job...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/reverberate/analyze/${jobId}`, {
        ...fetchOptions,
        method: 'POST',
      });

      if (response.status === 202) {
        const data = await response.json();
        setAnalysisJobId(data.analysis_job_id);
        startAnalysisPolling(data.analysis_job_id);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to start analysis: ${response.status} ${response.statusText}. ${errorText}`);
      }
    } catch (err) {
      console.error("Analysis submission error:", err);
      setAnalysisError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysisProgress('Error submitting analysis job.');
    }
  };

  // Function to render the analysis results
  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const { findings, summaries, errors } = analysisResult;
    
    return (
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">AI Analysis Results</h2>
        
        {/* Meta information */}
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Analyzed {analysisResult.meta.total_files_analyzed} files across {analysisResult.meta.chunks_processed} chunks</p>
          <p>Processed at: {new Date(analysisResult.meta.processed_at).toLocaleString()}</p>
        </div>
        
        {/* Analysis Summaries */}
        {summaries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Summaries</h3>
            <div className="space-y-4">
              {summaries.map((summary, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{summary.subject}</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{summary.summary}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Significance:</strong> {summary.significance}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Analysis Findings */}
        {findings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Findings ({findings.length})</h3>
            <div className="space-y-4">
              {findings.map((finding, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start mb-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded mr-2 ${
                      finding.category.includes('violence') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      finding.category.includes('hate') ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      finding.category.includes('extremism') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {finding.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{finding.source}</span>
                  </div>
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-500 pl-4 italic mb-2 text-gray-700 dark:text-gray-300">
                    "{finding.quote}"
                  </blockquote>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Reason:</strong> {finding.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No findings message */}
        {findings.length === 0 && summaries.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 text-center">
            <p className="text-gray-700 dark:text-gray-300">No concerning content was identified in the analyzed search results.</p>
          </div>
        )}
        
        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Processing Errors</h3>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
              <ul className="list-disc list-inside text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Download button for analysis results */}
        <div className="mt-6">
          <button
            onClick={downloadAnalysisResults}
            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Analysis JSON
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reverberate</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {progress && (
              <span className="flex items-center gap-2">
                {processing && !downloadUrl && <Loader2 className="w-4 h-4 animate-spin" />}
                {progress}
              </span>
            )}
          </div>
          {(names || keywords.length > 1 || keywords[0] || processing) && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={processing && !downloadUrl}
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Names
              </label>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              disabled={processing}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Keywords (max 10)
              </label>
              {keywords.length < 10 && (
                <button
                  onClick={handleAddKeyword}
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={processing}
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2"
                    disabled={processing}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className={`p-4 rounded-lg border ${
              error ? 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200' :
              downloadUrl ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200' :
              'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200'
            }`}>
              <div className="flex items-center">
                {processing && !downloadUrl && !error && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {error && <X className="w-5 h-5 mr-2" />}
                {downloadUrl && <CheckCircle className="w-5 h-5 mr-2" />}
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons and Results */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Main action button */}
            <div className="flex-1 w-full">
              {!processing && !downloadUrl && (
                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Process Names
                </button>
              )}
            </div>
            
            {/* Secondary action buttons (when a job is complete) */}
            {downloadUrl && (
              <div className="flex flex-col gap-3 md:w-auto w-full">
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center whitespace-nowrap"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Results
                </button>
                
                {!analysisJobId && (
                  <button
                    onClick={handleStartAnalysis}
                    className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center justify-center whitespace-nowrap"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Run AI Analysis
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Analysis status message */}
          {analysisJobId && analysisProgress && (
            <div className={`mt-4 p-4 rounded-lg border ${
              analysisError ? 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200' :
              analysisStatus === 'completed' ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200' :
              'bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-200'
            }`}>
              <div className="flex items-center">
                {analysisStatus !== 'completed' && !analysisError && (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                )}
                {analysisError && <AlertTriangle className="w-5 h-5 mr-2" />}
                {analysisStatus === 'completed' && <CheckCircle className="w-5 h-5 mr-2" />}
                <span>{analysisProgress}</span>
              </div>
              
              {analysisError && (
                <p className="mt-2 text-red-700 dark:text-red-300">{analysisError}</p>
              )}
            </div>
          )}

          {showHelp && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Valid name formats:
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <div>
                  <div className="font-medium mb-1">✓ One name per line:</div>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">
                    John Doe
                    Jane Smith
                    Bob Johnson</pre>
                </div>
                <div>
                  <div className="font-medium mb-1">✓ Comma-separated:</div>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">John Doe, Jane Smith, Bob Johnson</pre>
                </div>
                <div>
                  <div className="font-medium mb-1">✓ Mixed format:</div>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">
                    John Doe, Jane Smith
                    Bob Johnson</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Analysis Results Section */}
      {showAnalysis && renderAnalysisResults()}
    </div>
  );
}

export default Reverberate;