import React, { useState, useRef, useCallback } from 'react';
import api from '../api/axios';
import LoadingSpinner from './LoadingSpinner';
import { getApiError } from '../utils/apiError';
import { buildScanPayload } from '../utils/receiptScan';

const SCAN_STEPS = [
  'Uploading image...',
  'Enhancing image for OCR...',
  'Reading text from bill...',
  'Analyzing amounts & merchant...',
  'Building report...',
];

const ReceiptScanner = ({ onExtracted, onCancel }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const processFile = useCallback((selectedFile) => {
    if (!selectedFile?.type?.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }
    setError('');
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) processFile(dropped);
    },
    [processFile]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setError('Camera access denied. Use file upload or gallery instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          processFile(new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' }));
          stopCamera();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const scanReceipt = async () => {
    if (!file) {
      setError('Please upload or capture a receipt image first');
      return;
    }

    setScanning(true);
    setError('');
    setScanStep(0);

    const stepTimer = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1));
    }, 8000);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const { data } = await api.post('/receipts/scan', formData, {
        timeout: 300000,
        validateStatus: (status) => status < 500,
      });

      if (!data) {
        setError('Empty response from server. Run npm start from the project folder.');
        return;
      }

      const payload = buildScanPayload(data, preview);
      onExtracted?.(payload);
    } catch (err) {
      const res = err.response?.data;
      if (res?.extracted) {
        onExtracted?.(buildScanPayload(res, preview));
      } else {
        setError(
          getApiError(
            err,
            'Receipt scan failed. Run npm start in the project folder and ensure you are logged in.'
          )
        );
      }
    } finally {
      clearInterval(stepTimer);
      setScanning(false);
      setScanStep(0);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    setError('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-primary-500/10 p-4 border border-primary-200/50 dark:border-primary-800/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-primary-600 text-2xl text-white shadow-lg">
          ✨
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">AI Bill Scanner</h3>
          <p className="text-sm text-slate-500">
            Upload a receipt or bill — we read it with OCR and show a clear analysis of what happened
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!preview && !showCamera && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <div className="text-5xl mb-3">📄</div>
          <p className="font-medium text-slate-700 dark:text-slate-300">Drag & drop your bill here</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary">📁 File</button>
            <button type="button" onClick={() => galleryInputRef.current?.click()} className="btn-secondary">🖼️ Gallery</button>
            <button type="button" onClick={startCamera} className="btn-secondary">📷 Camera</button>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-80 object-cover bg-black" />
          <div className="flex gap-3 p-4 bg-slate-900">
            <button type="button" onClick={capturePhoto} className="btn-primary flex-1">Capture</button>
            <button type="button" onClick={stopCamera} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {preview && !showCamera && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <img src={preview} alt="Bill preview" className="max-h-72 w-full object-contain mx-auto bg-slate-100 dark:bg-slate-800" />
            <button type="button" onClick={clearImage} className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">Remove</button>
          </div>

          {scanning && (
            <div className="glass-card text-center py-6">
              <LoadingSpinner size="lg" className="mx-auto" />
              <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">{SCAN_STEPS[scanStep]}</p>
              <p className="mt-1 text-xs text-slate-500">This may take 30–90 seconds on first scan</p>
            </div>
          )}

          <button type="button" onClick={scanReceipt} disabled={scanning} className="btn-primary w-full py-3 text-base">
            {scanning ? 'Analyzing bill...' : '🔍 Analyze Bill'}
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />

      {onCancel && (
        <button type="button" onClick={onCancel} className="btn-secondary w-full">Cancel</button>
      )}
    </div>
  );
};

export default ReceiptScanner;
