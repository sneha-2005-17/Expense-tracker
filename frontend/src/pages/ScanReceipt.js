import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReceiptScanner from '../components/ReceiptScanner';
import ReceiptAnalysisPanel from '../components/ReceiptAnalysisPanel';
import TransactionForm from '../components/TransactionForm';

const ScanReceipt = () => {
  const [scanResult, setScanResult] = useState(null);
  const [step, setStep] = useState('scan'); // scan | analysis | form
  const navigate = useNavigate();

  const handleExtracted = (data) => {
    setScanResult(data);
    setStep('analysis');
  };

  const handleSuccess = () => {
    navigate('/transactions');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 page-enter">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Bill Scanner</h2>
          <p className="text-slate-500">
            {step === 'scan' && 'Upload your bill to analyze it'}
            {step === 'analysis' && 'Review what was detected on your bill'}
            {step === 'form' && 'Edit details and save as expense'}
          </p>
        </div>
        {step !== 'scan' && (
          <button
            type="button"
            onClick={() => { setStep('scan'); setScanResult(null); }}
            className="btn-secondary text-sm shrink-0"
          >
            ← New scan
          </button>
        )}
      </div>

      {step === 'scan' && (
        <div className="glass-card">
          <ReceiptScanner
            onExtracted={handleExtracted}
            onCancel={() => navigate('/transactions')}
          />
        </div>
      )}

      {step === 'analysis' && scanResult && (
        <ReceiptAnalysisPanel
          scanResult={scanResult}
          onContinue={() => setStep('form')}
          onRescan={() => { setStep('scan'); setScanResult(null); }}
        />
      )}

      {step === 'form' && scanResult && (
        <div className="glass-card">
          <h3 className="mb-4 text-lg font-bold">Save expense</h3>
          <TransactionForm
            scanData={scanResult.extracted ? { ...scanResult.extracted, receiptImage: scanResult.receiptImage, previewUrl: scanResult.previewUrl } : scanResult}
            onSuccess={handleSuccess}
            onCancel={() => setStep('analysis')}
          />
        </div>
      )}
    </div>
  );
};

export default ScanReceipt;
