import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, HelpCircle, ChevronRight, AlertTriangle, CheckCircle, Search, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const API_BASE_URL = 'https://entirely-apt-tadpole.ngrok-free.app';

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

interface PersonSummary {
  subject: string;
  summary: string;
}

interface AnalysisJobStatus {
  analysis_job_id?: string;
  original_job_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: AnalysisResult;
  error?: string;
}

interface AnalysisResult {
  meta: {
    job_id: string;
    original_job_id: string;
    processed_at: string;
    chunks_processed: number;
    total_files_analyzed: number;
  };
  person_summaries: PersonSummary[];
  errors: string[];
}

interface Category {
  id: string;
  label: string;
  keywords: string[];
  tooltip: string;
}

const categories: Category[] = [
  {
    id: 'antisemite',
    label: 'Antisemite',
    keywords: ['Jews', 'Zionists', 'Zios', 'Jewish', 'Holocaust'],
    tooltip: 'Searches for: Jews, Zionists, Zios, Jewish, Holocaust'
  },
  {
    id: 'anti-israel',
    label: 'Anti-Israel',
    keywords: ['Hamas', 'Bibi', 'Netanyahu', 'Genocide', 'Gaza'],
    tooltip: 'Searches for: Hamas, Bibi, Netanyahu, Genocide, Gaza'
  },
  {
    id: 'criminal',
    label: 'Criminal',
    keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'],
    tooltip: 'Searches for: Arrest, Convicted, Prison, Jail, Crime'
  },
  {
    id: 'far-left',
    label: 'Far Left',
    keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'],
    tooltip: 'Searches for: Communist, Marxist, Socialist, Revolution, Radical'
  },
  {
    id: 'far-right',
    label: 'Far Right',
    keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'],
    tooltip: 'Searches for: Nationalist, Fascist, Nazi, White supremacy, Alt-right'
  },
  {
    id: 'sexual',
    label: 'Sexual',
    keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'],
    tooltip: 'Searches for: Harassment, Assault, Abuse, Misconduct, Inappropriate'
  }
];

function Reverberate() {
  const { user } = useAuth();
  const [names, setNames] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [analysisPollInterval, setAnalysisPollInterval] = useState<number | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const downloadResults = async () => {
    if (!downloadUrl) return;
    window.location.href = `${API_BASE_URL}${downloadUrl}`;
  };

  const downloadAnalysisResults = async () => {
    if (!analysisJobId || analysisStatus !== 'completed') return;
    window.location.href = `${API_BASE_URL}/reverberate/analysis/download/${analysisJobId}`;
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
            setProcessing(false);
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
          if (analysisPollInterval) {
            clearInterval(analysisPollInterval);
            setAnalysisPollInterval(null);
          }
          setAnalysisProgress('Analysis complete!');
          if (data.results) {
            setAnalysisResult(data.results);
          } else {
            if (!analysisResult) {
              await fetchAnalysisResults();
            }
            if (!analysisResult && !data.results) {
              setAnalysisError('Analysis completed but no results were returned or could be fetched.');
            }
          }
          setShowAnalysis(true);
          break;
        case 'failed':
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
      if (analysisPollInterval) {
        clearInterval(analysisPollInterval);
        setAnalysisPollInterval(null);
      }
    }
  };

  const startPolling = (id: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    const interval = window.setInterval(() => checkJobStatus(id), 30000);
    setPollInterval(interval);
    checkJobStatus(id);
  };

  const startAnalysisPolling = (id: string) => {
    if (analysisPollInterval) {
      clearInterval(analysisPollInterval);
    }
    const interval = window.setInterval(() => checkAnalysisJobStatus(id), 30000);
    setAnalysisPollInterval(interval);
    checkAnalysisJobStatus(id);
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

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
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
    setSelectedCategories([]);
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
    setProgress('Submitting...');
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('names', names);
      formData.append('categories', JSON.stringify(selectedCategories));

      const submitOptions = {
        ...fetchOptions,
        method: 'POST',
        body: formData,
      };

      const response = await fetch(`${API_BASE_URL}/reverberate/`, submitOptions);

      if (response.status === 202) {
        const data = await response.json();
        if (data.job_id) {
          setJobId(data.job_id);
          setStatusMessage('Job submitted successfully! Starting processing...');
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
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred during submission');
      setStatusMessage('Error submitting job.');
      setProgress('Error');
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

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const { person_summaries, errors, meta } = analysisResult;
    
    return (
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">AI Analysis Results</h2>
        
        {meta && (
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Analyzed {meta.total_files_analyzed} files across {meta.chunks_processed} chunks</p>
            <p>Processed at: {new Date(meta.processed_at).toLocaleString()}</p>
          </div>
        )}
        
        {person_summaries && person_summaries.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Person Summaries</h3>
            <div className="space-y-4">
              {person_summaries.map((personSummary, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{personSummary.subject}</h4>
                  <p className={`text-gray-700 dark:text-gray-300 mb-2 ${personSummary.summary.includes('No compromising') ? 'italic' : ''}`}>
                    {personSummary.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          (!errors || errors.length === 0) && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 text-center mb-6">
              <p className="text-gray-700 dark:text-gray-300">No analysis summaries were generated.</p>
            </div>
          )
        )}
        
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
        
        <div className="mt-6">
          <button
            onClick={downloadAnalysisResults}
            disabled={!analysisJobId || analysisStatus !== 'completed'}
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
          {(names || selectedCategories.length > 0 || processing) && (
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <label
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      disabled={processing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category.label}</span>
                    <Info className="w-4 h-4 text-gray-400" />
                  </label>
                  {hoveredCategory === category.id && (
                    <div className="absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-900 text-white rounded shadow-lg">
                      {category.tooltip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
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

              {!processing && !downloadUrl && (
                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Process Names
                </button>
              )}
            </div>
            
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
          
          {analysisJobId && analysisProgress && (
            <>
              {analysisStatus !== 'completed' && !analysisError && (
                <div className="flex justify-center items-center h-12 mt-4">
                  <DotLottieReact
                    src="https://lottie.host/8c2cd1b3-4156-40a5-a8e1-48642a7e3be0/0jDm14ND1X.lottie"
                    loop
                    autoplay
                    style={{ width: '500px', height: '500px' }}
                  />
                </div>
              )}

              {analysisStatus === 'completed' && !analysisError && (
                 <div className="mt-4 p-4 rounded-lg border bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200">
                   <div className="flex items-center">
                     <CheckCircle className="w-5 h-5 mr-2" />
                     <span>{analysisProgress}</span>
                   </div>
                 </div>
              )}

              {analysisError && (
                 <div className="mt-4 p-4 rounded-lg border bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200">
                   <div className="flex items-center">
                     <AlertTriangle className="w-5 h-5 mr-2" />
                     <span>{analysisProgress}</span>
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
      
      {showAnalysis && renderAnalysisResults()}
    </div>
  );
}

export default Reverberate;