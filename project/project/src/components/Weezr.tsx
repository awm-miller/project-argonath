import React, { useState, useRef } from 'react';
import { Upload, Loader2, X, Clock, Percent, Download } from 'lucide-react';

interface WeezrMatch {
  video_name: string;
  timestamp: string;
  confidence: number;
  frame_index: number;
  frame_image: string;
}

interface WeezrResponse {
  status: string;
  matches: WeezrMatch[];
  total_matches: number;
}

function Weezr() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeezrResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Send to weezr-search endpoint
      const response = await fetch('https://entirely-apt-tadpole.ngrok-free.app/weezr-search', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data: WeezrResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('Failed to process image');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadImage = (imageData: string, videoName: string, timestamp: string) => {
    // Convert base64 to blob
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Create filename: video_name-timestamp.jpg
    const filename = `${videoName.replace(/\.[^/.]+$/, '')}-${timestamp.replace(/:/g, '-')}.jpg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Group matches by video name
  const groupedMatches = result?.matches.reduce<Record<string, WeezrMatch[]>>((acc, match) => {
    if (!acc[match.video_name]) {
      acc[match.video_name] = [];
    }
    acc[match.video_name].push(match);
    return acc;
  }, {}) || {};

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Weezr Face Search</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="image-upload"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center ${!isUploading && 'cursor-pointer'}`}
          >
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
            )}
            <span className="text-gray-600 font-medium">
              {isUploading ? 'Processing...' : 'Click to upload an image'}
            </span>
            <span className="text-gray-400 text-sm mt-1">
              JPEG, PNG, or WebP up to 10MB
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {file && !error && !isUploading && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-gray-700">
                  {file.name}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={resetUpload}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600">Total Matches</div>
                  <div className="text-2xl font-bold text-blue-900">{result.total_matches}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">Videos with Matches</div>
                  <div className="text-2xl font-bold text-blue-900">{Object.keys(groupedMatches).length}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedMatches).map(([videoName, matches]) => (
                <div key={videoName} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">{videoName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg overflow-hidden"
                      >
                        <div className="aspect-video relative group">
                          <img
                            src={match.frame_image}
                            alt={`Match at ${match.timestamp}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleDownloadImage(match.frame_image, videoName, match.timestamp)}
                            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                            title="Download image"
                          >
                            <Download className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">
                                {match.timestamp}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Percent className="w-5 h-5 text-gray-500 mr-1" />
                              <span className="font-medium text-blue-600">
                                {(match.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Frame {match.frame_index}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Weezr;