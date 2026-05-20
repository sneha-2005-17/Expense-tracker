import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LoadingSpinner from './LoadingSpinner';
import { getReceiptImageUrl } from '../utils/constants';

const TransactionForm = ({ transaction, scanData, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    merchant: '',
    tax: '',
    paymentMethod: '',
    items: [],
    receiptImage: '',
    source: 'manual',
    ocrConfidence: '',
  });
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiFilled, setAiFilled] = useState(false);

  useEffect(() => {
    api.get('/transactions/categories').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        category: transaction.category,
        amount: String(transaction.amount),
        date: new Date(transaction.date).toISOString().split('T')[0],
        notes: transaction.notes || '',
        merchant: transaction.merchant || '',
        tax: transaction.tax ? String(transaction.tax) : '',
        paymentMethod: transaction.paymentMethod || '',
        items: transaction.items || [],
        receiptImage: transaction.receiptImage || '',
        source: transaction.source || 'manual',
        ocrConfidence: transaction.ocrConfidence ?? '',
      });
      setAiFilled(transaction.source === 'scan');
    }
  }, [transaction]);

  useEffect(() => {
    if (scanData && !transaction) {
      setForm((f) => ({
        ...f,
        type: scanData.type || 'expense',
        category: scanData.category || f.category,
        amount: scanData.amount ? String(scanData.amount) : '',
        date: scanData.date || f.date,
        notes: scanData.notes || '',
        merchant: scanData.merchant || '',
        tax: scanData.tax ? String(scanData.tax) : '',
        paymentMethod: scanData.paymentMethod || '',
        items: scanData.items || [],
        receiptImage: scanData.receiptImage || '',
        source: 'scan',
        ocrConfidence: scanData.confidence ?? '',
      }));
      setAiFilled(true);
    }
  }, [scanData, transaction]);

  useEffect(() => {
    const list = form.type === 'income' ? categories.income : categories.expense;
    if (list.length && !list.includes(form.category)) {
      setForm((f) => ({ ...f, category: list[0] }));
    }
  }, [form.type, categories, form.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!form.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        notes: form.notes,
        merchant: form.merchant,
        tax: form.tax ? Number(form.tax) : 0,
        paymentMethod: form.paymentMethod,
        items: form.items,
        receiptImage: form.receiptImage,
        source: form.source,
        ocrConfidence: form.ocrConfidence !== '' ? Number(form.ocrConfidence) : undefined,
      };

      if (transaction?._id) {
        await api.put(`/transactions/${transaction._id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const categoryList = form.type === 'income' ? categories.income : categories.expense;
  const receiptUrl = form.receiptImage ? getReceiptImageUrl(form.receiptImage) : scanData?.previewUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {aiFilled && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
          <span>✨</span>
          <span>AI extracted data — review and edit before saving</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {receiptUrl && (
        <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
          <p className="mb-2 text-xs font-medium text-slate-500">Receipt preview</p>
          <img src={receiptUrl} alt="Receipt" className="max-h-40 rounded-lg object-contain mx-auto" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="input-field">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="input-field">
            {categoryList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Amount ($) *</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            className="input-field"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="label">Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
      </div>

      {form.type === 'expense' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Merchant / Store</label>
              <input
                type="text"
                name="merchant"
                value={form.merchant}
                onChange={handleChange}
                className="input-field"
                placeholder="Store name"
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <input
                type="text"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="input-field"
                placeholder="Cash, Visa, UPI..."
              />
            </div>
          </div>

          <div>
            <label className="label">Tax ($)</label>
            <input
              type="number"
              name="tax"
              value={form.tax}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {form.items?.length > 0 && (
            <div>
              <label className="label">Purchased Items (from receipt)</label>
              <ul className="rounded-xl border border-slate-200 divide-y dark:border-slate-700">
                {form.items.map((item, i) => (
                  <li key={i} className="flex justify-between px-4 py-2 text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">${Number(item.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="input-field resize-none"
          placeholder="Add a note..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : transaction ? 'Update' : 'Save Transaction'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
