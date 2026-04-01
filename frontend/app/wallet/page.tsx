'use client';

import { useState } from 'react';
import { Wallet, Copy, Check, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { generateWallet } from '@/lib/api';
import type { WalletResponse } from '@/lib/types';

function KeyField({ label, value, sensitive }: { label: string; value: string; sensitive?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!sensitive);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="relative bg-slate-800 border border-slate-700 rounded-lg">
        <textarea
          readOnly
          rows={4}
          value={visible ? value : '•'.repeat(Math.min(value.length, 80))}
          className="w-full bg-transparent px-3 py-2.5 pr-16 text-xs font-mono text-slate-300 resize-none focus:outline-none leading-relaxed"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {sensitive && (
            <button
              onClick={() => setVisible(!visible)}
              className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
              title={visible ? 'Hide' : 'Show'}
            >
              {visible ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
          <button
            onClick={copy}
            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateWallet();
      setWallet(data);
    } catch {
      setError('Failed to generate wallet. Is the wallet server running on port 8081?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Wallet Generator</h1>
        <p className="text-slate-400 text-sm mt-1">Generate a new RSA keypair for your blockchain wallet</p>
      </div>

      {/* Generate button */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Wallet size={24} className="text-sky-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">
              {wallet ? 'Wallet Generated' : 'Generate Your Wallet'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {wallet
                ? 'A new RSA-1024 keypair has been created. Save it somewhere safe!'
                : 'Click the button below to generate a new public/private key pair.'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {wallet ? 'Generate New Wallet' : 'Generate Wallet'}
          </button>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Keys */}
      {wallet && (
        <>
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <KeyField label="Public Key" value={wallet.public_key} />
            <KeyField label="Private Key" value={wallet.private_key} sensitive />
          </section>

          {/* Warning */}
          <div className="flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-300 space-y-1">
              <p className="font-semibold">Important — Save your keys now!</p>
              <ul className="text-amber-400/80 space-y-0.5 text-xs list-disc list-inside">
                <li>These keys cannot be recovered once you leave this page.</li>
                <li>Never share your private key with anyone.</li>
                <li>Your public key is your wallet address for receiving coins.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
