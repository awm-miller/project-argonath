import React, { useState } from 'react';
import { Download, Loader2, X, Plus, Minus, HelpCircle } from 'lucide-react';

function Reverberate() {
  const [names, setNames] = useState('');
  const [keywords, setKeywords] = useState(['']);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      // Create CSV content
      const nameList = names.split(',').map(name => name.trim());
      const csvContent = nameList.join('\n');

      // Create form data
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'names.csv');
      
      // Join all keywords with commas and send as a single field
      const keywordsString = keywords
        .filter(k => k.trim())  // Remove empty keywords
        .join(',');             // Join with commas
      formData.append('keywords', keywordsString);

      const response = await fetch('https://entirely-apt-tadpole.ngrok-free.app/reverberate/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      // Get the blob from the response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reverberate-results.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reverberate</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-end mb-4">
          {(names || keywords.length > 1 || keywords[0]) && (
            <button
              onClick={() => {
                setNames('');
                setKeywords(['']);
                setError(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
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
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={processing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Download className="w-5 h-5 mr-2" />
                Process Names
              </span>
            )}
          </button>

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