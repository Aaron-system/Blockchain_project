'use client';

import { useState } from 'react';
import { Send, Loader2, X, CheckCircle } from 'lucide-react';
import { generateTransaction, submitTransaction } from '@/lib/api';
import { NODE_URL } from '@/lib/api';
import type { GeneratedTransaction } from '@/lib/types';

interface FormState {
  sender_public_key: string;
  sender_private_key: string;
  recipient_public_key: string;
  amount: string;
}

const empty: FormState = {
  sender_public_key: '',
  sender_private_key: '',
  recipient_public_key: '',
  amount: '',
};

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (k: keyof FormState, v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
      />
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        readOnly
        value={value}
        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs font-mono text-slate-400"
      />
    </div>
  );
}

export default function MakeTransactionPage() {
  const [form, setForm] = useState<FormState>(empty);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTransaction | null>(null);
  const [nodeUrl, setNodeUrl] = useState(NODE_URL);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    setError(null);
    if (!form.sender_public_key || !form.sender_private_key || !form.recipient_public_key || !form.amount) {
      setError('All fields are required.');
      return;
    }
    setGenerating(true);
    try {
      const data = await generateTransaction(form);
      setGenerated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate transaction');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!generated) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitTransaction(
        {
          confirmation_sender_public_key: generated.transaction.sender_public_key,
          confirmation_recipient_public_key: generated.transaction.recipient_public_key,
          confirmation_amount: generated.transaction.amount,
          transaction_signature: generated.signature,
        },
        nodeUrl,
      );
      setSuccess(true);
      setGenerated(null);
      setForm(empty);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Send Transaction</h1>
        <p className="text-slate-400 text-sm mt-1">Sign and broadcast a transaction to the blockchain</p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Transaction submitted!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              It will be included in the next mined block.
            </p>
          </div>
          <button onClick={() => setSuccess(false)} className="ml-auto text-emerald-600 hover:text-emerald-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Form */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Transaction Details</h2>

        <Field
          label="Sender Public Key"
          name="sender_public_key"
          value={form.sender_public_key}
          onChange={setField}
          placeholder="Paste your public key (hex)"
        />
        <Field
          label="Sender Private Key"
          name="sender_private_key"
          value={form.sender_private_key}
          onChange={setField}
          type="password"
          placeholder="Paste your private key (hex)"
          hint="Your private key is used locally to sign the transaction and is never sent to the node."
        />
        <Field
          label="Recipient Public Key"
          name="recipient_public_key"
          value={form.recipient_public_key}
          onChange={setField}
          placeholder="Paste the recipient's public key (hex)"
        />
        <Field
          label="Amount"
          name="amount"
          value={form.amount}
          onChange={setField}
          placeholder="e.g. 10"
        />

        {error && !generated && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-50 mt-2"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {generating ? 'Signing…' : 'Generate Transaction'}
        </button>
      </section>

      {/* Confirmation Modal */}
      {generated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Confirm Transaction</h3>
              <button
                onClick={() => setGenerated(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Review the details below, choose your node, and confirm.
            </p>

            <div className="space-y-3">
              <ReadonlyField label="Sender Public Key" value={generated.transaction.sender_public_key} />
              <ReadonlyField label="Recipient Public Key" value={generated.transaction.recipient_public_key} />
              <ReadonlyField label="Amount" value={generated.transaction.amount} />
              <ReadonlyField label="Signature" value={generated.signature} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Blockchain Node URL</label>
              <input
                value={nodeUrl}
                onChange={(e) => setNodeUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setGenerated(null); setError(null); }}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Submitting…' : 'Confirm Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
