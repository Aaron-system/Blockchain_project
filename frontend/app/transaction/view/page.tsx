'use client';

import { useState } from 'react';
import { Search, Copy, Check, Loader2, X } from 'lucide-react';
import { getChain } from '@/lib/api';
import { useNode } from '@/contexts/NodeContext';
import { useAddressBook } from '@/contexts/AddressBookContext';
import type { Transaction, Block } from '@/lib/types';

const MINING_SENDER = 'THE BLOCKCHAIN';

function truncate(s: string, n = 14) {
  if (!s || s.length <= n * 2) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

function AddressCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { getLabel } = useAddressBook();
  const label = getLabel(value);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
      {label ? (
        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 text-xs font-sans">{label}</span>
      ) : (
        <span title={value}>{value === MINING_SENDER ? '🔨 Network' : truncate(value)}</span>
      )}
      <button onClick={copy} className="text-slate-600 hover:text-slate-300 transition-colors">
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </span>
  );
}

interface FlatTx extends Transaction {
  timestamp: number;
  block_number: number;
}

export default function ViewTransactionPage() {
  const { activeNode } = useNode();
  const [nodeUrl, setNodeUrl] = useState(activeNode);
  const [allTxs, setAllTxs] = useState<FlatTx[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleView = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChain(nodeUrl);
      const flat: FlatTx[] = [];
      for (const block of data.chain as Block[]) {
        for (const tx of block.transactions) {
          flat.push({ ...tx, timestamp: block.timestamp, block_number: block.block_number });
        }
      }
      setAllTxs(flat);
      setFetched(true);
      setSearch('');
    } catch {
      setError(`Failed to connect to node at ${nodeUrl}`);
    } finally {
      setLoading(false);
    }
  };

  const q = search.toLowerCase();
  const filtered = allTxs.filter(
    (tx) =>
      !q ||
      tx.sender_public_key.toLowerCase().includes(q) ||
      tx.recipient_public_key.toLowerCase().includes(q) ||
      String(tx.amount).includes(q),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Transaction Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">Browse confirmed transactions on any node</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Node URL</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={nodeUrl}
            onChange={(e) => setNodeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleView()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            onClick={handleView}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? 'Loading…' : 'Fetch'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      </section>

      {fetched && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-100">Results</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} of {allTxs.length} transaction{allTxs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by address or amount…"
                className="pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 w-64 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 w-10">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Sender</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Recipient</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Timestamp</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 text-sm">No matching transactions</td></tr>
                ) : (
                  filtered.map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                      <td className="px-4 py-3"><AddressCell value={tx.sender_public_key} /></td>
                      <td className="px-4 py-3"><AddressCell value={tx.recipient_public_key} /></td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-sky-400">{tx.amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-sky-500/10 text-sky-400 font-mono">
                          #{tx.block_number}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
