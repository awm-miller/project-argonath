import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Plus, Minus, HelpCircle, ChevronRight, AlertTriangle, CheckCircle, Search, Info } from 'lucide-react';
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

interface UnifiedJobStatus {
  job_id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: 'queued' | 'reverberating_setup' | 'reverberating' | 'analyzing_setup' | 'analyzing' | 'completed' | 'reverberation_failed' | 'analysis_failed';
  current_person_reverberating?: string | null;
  current_person_analyzing?: string | null;
  results?: AnalysisResult;
  error?: string | null;
  start_time: number;
  end_time?: number;
  raw_results_zip_path?: string | null;
  reverberation_errors?: string[];
}

interface PersonReport {
  subject: string;
  overall_summary: string;
  categories: {
    [key: string]: string;
  };
  no_data_found?: boolean;
  error_processing_analysis?: boolean;
}

interface AnalysisResult {
  meta: {
    job_id: string;
    original_job_id: string;
    processed_at: string;
    names_processed: number;
    reports_generated: number;
  };
  people: PersonReport[];
  errors: string[];
}

interface Category {
  id: string;
  label: string;
  keywords: string[];
  tooltip: string;
}

const categories: Category[] = [
  { id: 'antisemite', label: 'Antisemite', keywords: ['Jews', 'Zionists', 'Zios', 'Jewish', 'Holocaust'], tooltip: 'Searches for antisemitism-related concerns' },
  { id: 'anti-israel', label: 'Anti-Israel', keywords: ['Hamas', 'Bibi', 'Netanyahu', 'Genocide', 'Gaza'], tooltip: 'Searches for anti-Israel views and concerns' },
  { id: 'criminal', label: 'Criminal', keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'], tooltip: 'Searches for potential criminal concerns' },
  { id: 'far-left', label: 'Far Left', keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'], tooltip: 'Searches for evidence of links to the far left' },
  { id: 'far-right', label: 'Far Right', keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'], tooltip: 'Searches for evidence of links to the far right' },
  { id: 'sexual', label: 'Sexual', keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'], tooltip: 'Searches for allegations of inappropriate sxual behaviour' }
];

function Reverberate() {
  const { user } = useAuth();
  const [names, setNames] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>(['']);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [currentJobStatus, setCurrentJobStatus] = useState<UnifiedJobStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [tooltipTimer, setTooltipTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (tooltipTimer) clearTimeout(tooltipTimer);
    };
  }, [pollInterval, tooltipTimer]);

  const handleMouseEnter = (categoryId: string) => {
    const timer = setTimeout(() => setHoveredCategory(categoryId), 500);
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    if (tooltipTimer) clearTimeout(tooltipTimer);
    setHoveredCategory(null);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };

  const handleAddKeyword = () => setCustomKeywords(prev => prev.length < 10 ? [...prev, ''] : prev);
  const handleRemoveKeyword = (index: number) => setCustomKeywords(prev => prev.filter((_, i) => i !== index));
  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...customKeywords];
    newKeywords[index] = value;
    setCustomKeywords(newKeywords);
  };

  const checkJobStatus = async (currentJobId: string) => {
    if (!currentJobId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/reverberate/status/${currentJobId}`, fetchOptions);
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }
      const data: UnifiedJobStatus = await response.json();
      setCurrentJobStatus(data);

      let detailedProgress = '';
      if (data.stage === 'reverberating' && data.current_person_reverberating) {
        detailedProgress = `Searching target: ${data.current_person_reverberating}`;
      } else if (data.stage === 'analyzing' && data.current_person_analyzing) {
        detailedProgress = `AI analyzing target: ${data.current_person_analyzing}`;
      }
      setProgressMessage(detailedProgress);
      
      switch (data.status) {
        case 'pending':
        case 'processing':
          setStatusMessage(data.stage === 'analyzing' || data.stage === 'analyzing_setup' ? 'AI Analysis in progress...' : 'Reverberation in progress...');
          setProcessing(true);
          break;
        case 'completed':
          setStatusMessage('Job complete! Report generated.');
          setErrorMessage(data.error || null);
          if (pollInterval) clearInterval(pollInterval);
          setPollInterval(null);
          setProcessing(false);
          setShowFullReport(true);
          break;
        case 'failed':
          setStatusMessage('Job failed.');
          setErrorMessage(data.error || 'An unknown error occurred.');
          if (pollInterval) clearInterval(pollInterval);
          setPollInterval(null);
          setProcessing(false);
          break;
      }
    } catch (err) {
      console.error("Status check error:", err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch job status.');
      setStatusMessage('Error fetching status.');
    }
  };

  const startPolling = (idToPoll: string) => {
    if (pollInterval) clearInterval(pollInterval);
    const interval = window.setInterval(() => checkJobStatus(idToPoll), 15000);
    setPollInterval(interval);
    checkJobStatus(idToPoll);
  };

  const handleSubmit = async () => {
    if (!names.trim()) { setErrorMessage('Please enter at least one name.'); return; }
    const nameList = names.split(/[,\n]+/).map(name => name.trim()).filter(Boolean);
    if (nameList.length === 0) { setErrorMessage('Invalid name format or no names provided.'); return; }
    if (selectedCategories.length === 0 && customKeywords.every(k => !k.trim())) { setErrorMessage('Please select at least one category or add a custom keyword.'); return; }
    if (!user?.email) { setErrorMessage('You must be logged in.'); return; }

    resetFormState(false);
    setProcessing(true);
    setStatusMessage('Submitting job...');
    setProgressMessage('Preparing your request...');

    try {
      const formData = new FormData();
      formData.append('names', nameList.join('\n'));
      formData.append('categories', JSON.stringify(selectedCategories));
      formData.append('customKeywords', JSON.stringify(customKeywords.filter(k => k.trim())));

      const response = await fetch(`${API_BASE_URL}/reverberate/`, {
        ...fetchOptions,
        method: 'POST',
        body: formData,
      });

      if (response.status === 202) {
        const data = await response.json();
        if (data.job_id) {
          setJobId(data.job_id);
          setStatusMessage('Job submitted! Processing...');
          startPolling(data.job_id);
        } else {
          throw new Error('Submission successful, but no Job ID received.');
        }
      } else {
        let errorText = `Failed to start job: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorText = errorData.detail || errorText; } catch {}
        throw new Error(errorText);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(err instanceof Error ? err.message : 'Submission error.');
      setStatusMessage('Error submitting job.');
      setProcessing(false);
    }
  };

  const resetFormState = (fullReset = true) => {
    if (fullReset) {
      setNames('');
      setSelectedCategories([]);
      setCustomKeywords(['']);
    }
    setProcessing(false);
    setStatusMessage('');
    setProgressMessage('');
    setErrorMessage(null);
    setJobId(null);
    setCurrentJobStatus(null);
    setShowFullReport(false);
    if (pollInterval) clearInterval(pollInterval);
    setPollInterval(null);
  };

  const renderLottieAnimation = () => {
    if (!processing || currentJobStatus?.status === 'completed' || currentJobStatus?.status === 'failed') return null;

    const isAnalyzing = currentJobStatus?.stage === 'analyzing' || currentJobStatus?.stage === 'analyzing_setup';
    const lottieSrc = isAnalyzing 
      ? "https://lottie.host/8c2cd1b3-4156-40a5-a8e1-48642a7e3be0/0jDm14ND1X.lottie"
      : "https://lottie.host/2b4bf80c-5198-4240-b65d-1449b2cb3eb9/XBMTs9wqjt.lottie";

    return (
      <div className="flex flex-col justify-center items-center my-4">
        <DotLottieReact src={lottieSrc} loop autoplay style={{ width: '250px', height: '250px' }} />
        {progressMessage && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progressMessage}</p>}
      </div>
    );
  };

  const renderAnalysisResults = () => {
    const analysisResult = currentJobStatus?.results;
    if (!showFullReport || !analysisResult) return null;

    const { people, errors, meta } = analysisResult;
    
    return (
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Analysis Report</h2>
        </div>
        
        {meta && (
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Analyzed {meta.names_processed} names. Generated {meta.reports_generated} reports.</p>
            <p>Processed at: {new Date(meta.processed_at).toLocaleString()}</p>
          </div>
        )}
        
        {people && people.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Person Summaries</h3>
            <div className="space-y-4">
              {people.map((personReport, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{personReport.subject}</h4>
                    {currentJobStatus?.raw_results_zip_path && (
                      <a 
                        href={`${API_BASE_URL}/reverberate/downloadzip/${currentJobStatus.job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download Raw Search Data (Zip)"
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className={`text-gray-700 dark:text-gray-300 mb-4 ${personReport.overall_summary.includes('No compromising') || personReport.no_data_found ? 'italic' : ''}`}>
                    {personReport.overall_summary}
                  </p>
                  {personReport.error_processing_analysis && <p className='text-red-500 text-xs italic mb-2'>An error occurred during the AI analysis for this person.</p>}

                  {personReport.categories && Object.keys(personReport.categories).length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            {Object.keys(personReport.categories).map((catKey, idx) => (
                              <th key={idx} className="px-3 py-2 font-semibold border border-gray-200 dark:border-gray-600 capitalize">
                                {catKey.replace(/_/g, ' ').replace(/^custom$/, 'Custom Keywords')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {Object.entries(personReport.categories).map(([catKey, catSummary], idx) => (
                              <td key={idx} className="px-3 py-2 border border-gray-200 dark:border-gray-600 align-top">
                                {(catSummary as string).includes('No compromising') || (catSummary as string).includes('No information found') ? <em>{catSummary as string}</em> : catSummary as string}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          (!errors || errors.length === 0) && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 text-center mb-6">
              <p className="text-gray-700 dark:text-gray-300">No analysis summaries were generated for any person.</p>
            </div>
          )
        )}
        
        {errors && errors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">Overall Processing Errors Encountered</h3>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {currentJobStatus?.reverberation_errors && currentJobStatus.reverberation_errors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-orange-800 dark:text-orange-300">Reverberation Phase Notices</h3>
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 dark:text-orange-300">
                {currentJobStatus.reverberation_errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reverberate</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {!jobId || currentJobStatus?.status === 'failed' || currentJobStatus?.status === 'completed' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="names-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Names</label>
                <button type="button" onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600" aria-label="Show input format help">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <textarea 
                id="names-input" 
                value={names} 
                onChange={(e) => setNames(e.target.value)} 
                placeholder="Enter names, one per line or separated by commas" 
                rows={3} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-500 dark:focus:border-transparent transition-colors" 
                disabled={processing} 
              />
              {showHelp && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-xs text-blue-700 dark:text-blue-300">
                  <h4 className="font-semibold mb-1">Valid name formats:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>One name per line: e.g., <pre className="inline bg-gray-200 dark:bg-gray-700 p-0.5 rounded">John Doe\nJane Smith</pre></li>
                    <li>Comma-separated: e.g., <pre className="inline bg-gray-200 dark:bg-gray-700 p-0.5 rounded">John Doe, Jane Smith</pre></li>
                    <li>Mixed: e.g., <pre className="inline bg-gray-200 dark:bg-gray-700 p-0.5 rounded">John Doe, Jane Smith\nBob Johnson</pre></li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(category => (
                  <div key={category.id} className="relative" onMouseEnter={() => handleMouseEnter(category.id)} onMouseLeave={handleMouseLeave}>
                    <label className="flex items-center space-x-2 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleCategory(category.id)} disabled={processing} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-grow truncate">{category.label}</span>
                      <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </label>
                    {hoveredCategory === category.id && <div className="absolute z-20 w-52 p-2 mt-1 text-xs bg-gray-800 text-white rounded shadow-lg" role="tooltip">{category.tooltip}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Keywords (max 10)</label>
                {customKeywords.length < 10 && (
                  <button type="button" onClick={handleAddKeyword} className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" disabled={processing}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </button>
                )}
              </div>
              {customKeywords.map((keyword, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={keyword} 
                    onChange={(e) => handleKeywordChange(index, e.target.value)} 
                    placeholder={`Custom keyword ${index + 1}`} 
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-500 dark:focus:border-transparent transition-colors" 
                    disabled={processing} 
                  />
                  {customKeywords.length > 1 && (
                    <button type="button" onClick={() => handleRemoveKeyword(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5" disabled={processing} aria-label="Remove keyword">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
                <AlertTriangle className="w-5 h-5 inline mr-2" /> {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full px-4 py-2.5 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base font-medium transition-colors duration-150 ease-in-out"
              disabled={processing}
            >
              <Search className="w-5 h-5 mr-2" /> Process Names
            </button>
          </form>
        ) : (
          renderLottieAnimation()
        )}
      </div>
      
      {showFullReport && renderAnalysisResults()}
    </div>
  );
}

export default Reverberate;