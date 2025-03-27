import React, { useState, useRef } from 'react';
import { Upload, Loader2, X, Copy, CheckCircle } from 'lucide-react';
import type { TranscriptionResult } from '../models/TranscriptionResult';
import { supabase } from '../lib/supabase';

function Transcriber() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid audio or video file (MP3, WAV, M4A, MP4, WebM)');
      return;
    }

    // Validate file size (100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    try {
      setIsUploading(true);

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transcriptions')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create transcription job
      const { data: jobData, error: jobError } = await supabase
        .from('transcription_jobs')
        .insert({
          source_type: 'file',
          file_path: uploadData.path
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Start transcription
      const response = await fetch('https://entirely-apt-tadpole.ngrok-free.app/transcribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobData.id,
          file_url: `${supabase.storageUrl}/object/public/transcriptions/${uploadData.path}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data: TranscriptionResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoTranscription = async () => {
    if (!videoUrl) {
      setError('Please enter a valid video URL');
      return;
    }

    setError(null);
    setResult(null);
    setIsUploading(true);

    try {
      // Create transcription job
      const { data: jobData, error: jobError } = await supabase
        .from('transcription_jobs')
        .insert({
          source_type: 'youtube', // The backend will determine the actual source
          source_url: videoUrl
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Start transcription
      const response = await fetch('https://entirely-apt-tadpole.ngrok-free.app/transcribe/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobData.id,
          url: videoUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe video');
      }

      const data: TranscriptionResult = await response.json();
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
    setCopied(false);
    setVideoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyText = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Audio Transcriber</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Audio/Video File</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              id="audio-upload"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label
              htmlFor="audio-upload"
              className={`flex flex-col items-center ${!isUploading && 'cursor-pointer'}`}
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <span className="text-gray-600 font-medium">
                {isUploading ? 'Transcribing...' : 'Click to upload an audio/video file'}
              </span>
              <span className="text-gray-400 text-sm mt-1">
                MP3, WAV, M4A, MP4, or WebM up to 100MB
              </span>
            </label>
          </div>
        </div>

        {/* Video URL Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Online Video</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube, Facebook, or Twitter video URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleVideoTranscription}
              disabled={!videoUrl || isUploading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Transcribing...
                </span>
              ) : (
                'Start Transcription'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {(file || videoUrl) && !error && !isUploading && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium text-gray-700">
                {file ? file.name : 'Online video'}
              </span>
              {file && (
                <span className="ml-2 text-sm text-gray-500">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transcription Result</h2>
            <button
              onClick={handleCopyText}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Text
                </>
              )}
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="whitespace-pre-wrap text-gray-700">{result.full_text}</p>
            
            {result.segments && result.segments.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium mb-4">Segments</h3>
                <div className="space-y-4">
                  {result.segments.map((segment, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-sm text-gray-500 w-24">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                      <p className="flex-1 text-gray-700">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default Transcriber;