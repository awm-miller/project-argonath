import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Plus, Minus, HelpCircle, ChevronRight, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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

// Interface for the overall job status
interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}

// Interface for a single person's summary (UPDATED)
interface PersonSummary {
  subject: string;
  summary: string;
}

// Interface for the Analysis job status and result
interface AnalysisJobStatus {
  analysis_job_id?: string;
  original_job_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: AnalysisResult; // Contains the detailed results on completion
  error?: string;
}

// Interface for the overall analysis result structure (UPDATED)
interface AnalysisResult {
  meta: {
    job_id: string;
    original_job_id: string;
    processed_at: string;
    chunks_processed: number;
    total_files_analyzed: number;
  };
  person_summaries: PersonSummary[]; // Changed from findings/summaries
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
  // Fix linter error: Use `number` for setInterval return type in browsers
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  // Analysis job state
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  // Fix linter error: Use `number` for setInterval return type in browsers
  const [analysisPollInterval, setAnalysisPollInterval] = useState<number | null>(null);
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
      const downloadUrl = `${API_BASE_URL}/reverberate/analysis/download/${analysisJobId}`;
      window.location.href = downloadUrl;
    } catch (err) {
      console.error("Analysis download error:", err);
      setAnalysisError("Failed to download analysis results. Please try again.");
    }
  };

  const fetchAnalysisResults = async () => {
    if (!analysisJobId || analysisStatus !== 'completed') return;
    
    try {
      const viewUrl = `${API_BASE_URL}/reverberate/analysis/view/${analysisJobId}`;
      const response = await fetch(viewUrl, fetchOptions);
      
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
      const response = await fetch(`${API_BASE_URL}/reverberate/analysis/status/${id}`, fetchOptions);
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
          // Clear interval immediately upon completion
          if (analysisPollInterval) {
            clearInterval(analysisPollInterval);
            setAnalysisPollInterval(null);
          }
          setAnalysisProgress('Analysis complete!');
          // Set the analysis results from the status response
          if (data.results) {
            setAnalysisResult(data.results);
          } else {
            // If results aren't in the status response, try fetching them separately
            // This covers cases where the status might update slightly before results are attached
            // We might already have results from a previous poll, so check first
            if (!analysisResult) {
              fetchAnalysisResults(); // Attempt to fetch if not already set
              // If fetchAnalysisResults is async and might error, consider setting a fallback error
              // setAnalysisError('Analysis completed but results could not be loaded immediately.');
            } else {
               // We already have the results, likely from a previous poll
               // Frontend state is likely already updated by setAnalysisResult
            }
             // Fallback error if results are persistently missing after fetch attempt fails silently
             // This might indicate an issue fetching or results truly missing
             if (!analysisResult && !data.results) { 
               setAnalysisError('Analysis completed but no results were returned or could be fetched.');
             }
          }
          setShowAnalysis(true);
          break;
        case 'failed':
          // Clear interval immediately on failure
          if (analysisPollInterval) {
            clearInterval(analysisPollInterval);
            setAnalysisPollInterval(null);
          }
          setAnalysisProgress('Analysis failed');
          setAnalysisError(data.error || 'An unknown error occurred during analysis');
          break;
      }
    } catch (err) {
      console.error("Analysis status check error:", err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to check analysis status');
      setAnalysisProgress('Error');
      // Also clear interval on fetch error
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

  // Function to render the analysis results (UPDATED)
  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    // Use the updated field name and structure
    const { person_summaries, errors, meta } = analysisResult;
    
    return (
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">AI Analysis Results</h2>
        
        {/* Meta information */} 
        {meta && (
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Analyzed {meta.total_files_analyzed} files across {meta.chunks_processed} chunks</p>
            <p>Processed at: {new Date(meta.processed_at).toLocaleString()}</p>
          </div>
        )}
        
        {/* Person Summaries Section */}
        {person_summaries && person_summaries.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Person Summaries</h3>
            <div className="space-y-4">
              {person_summaries.map((personSummary, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{personSummary.subject}</h4>
                  {/* Apply italic style if summary indicates no findings */} 
                  <p className={`text-gray-700 dark:text-gray-300 mb-2 ${personSummary.summary.includes('No compromising') ? 'italic' : ''}`}>
                    {personSummary.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Show message only if there are no summaries AND no errors
          (!errors || errors.length === 0) && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 text-center mb-6">
              <p className="text-gray-700 dark:text-gray-300">No analysis summaries were generated.</p>
            </div>
          )
        )}
        
        {/* Removed the detailed Findings section */}
        
        {/* Errors Section */} 
        {errors && errors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">Processing Errors Encountered</h3>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
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
            disabled={!analysisJobId || analysisStatus !== 'completed'} // Ensure button is enabled only when appropriate
            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                {processing && !downloadUrl && !error && <Loader2 className="w-4 h-4 animate-spin" />}
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

          {/* Action Buttons and Results */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Main action/loading area */}
            <div className="flex-1 w-full">
              {/* Show Lottie when processing */}
              {processing && !downloadUrl && !error && (
                <div className="flex justify-center items-center h-12">
                  <DotLottieReact
                    src="https://lottie.host/2b4bf80c-5198-4240-b65d-1449b2cb3eb9/XBMTs9wqjt.lottie"
                    loop
                    autoplay
                    style={{ width: '500px', height: '500px' }}
                  />
                </div>
              )}

              {/* Show Process button when not processing and no results */}
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
          
          {/* Analysis Status/Loading/Error Section */}
          {analysisJobId && analysisProgress && (
            <>
              {/* Show Lottie when analysis is processing */}
              {analysisStatus !== 'completed' && !analysisError && (
                <div className="flex justify-center items-center h-12 mt-4"> {/* Centering div */}
                  <DotLottieReact
                    src="https://lottie.host/8c2cd1b3-4156-40a5-a8e1-48642a7e3be0/0jDm14ND1X.lottie"
                    loop
                    autoplay
                    style={{ width: '500px', height: '500px' }} // Use size similar to initial loader
                  />
                </div>
              )}

              {/* Show success message when completed */}
              {analysisStatus === 'completed' && !analysisError && (
                 <div className="mt-4 p-4 rounded-lg border bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200">
                   <div className="flex items-center">
                     <CheckCircle className="w-5 h-5 mr-2" />
                     <span>{analysisProgress}</span> {/* Display final "Analysis complete!" message */}
                   </div>
                 </div>
              )}

              {/* Show error message on failure */}
              {analysisError && (
                 <div className="mt-4 p-4 rounded-lg border bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200">
                   <div className="flex items-center">
                     <AlertTriangle className="w-5 h-5 mr-2" />
                     <span>{analysisProgress}</span> {/* Display "Analysis failed" or similar */}
                   </div>
                   <p className="mt-2 text-red-700 dark:text-red-300">{analysisError}</p>
                 </div>
              )}
            </>
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