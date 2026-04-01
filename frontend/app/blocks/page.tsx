'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, ChevronDown, ChevronUp, Copy, Check, Hash } from 'lucide-react';
import { getChain } from '@/lib/api';
import { useNode } from '@/contexts/NodeContext';
import type { Block, Transaction } from '@/lib/types';

const MINING_SENDER = 'THE BLOCKCHAIN';

function truncate(s: string, n = 10) {
  if (!s || s.length <= n * 2) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="ml-1 text-slate-600 hover:text-slate-300 transition-colors">
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const isMining = tx.sender_public_key === MINING_SENDER;
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg text-xs ${isMining ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-slate-800/40'}`}>
      {isMining && <span className="text-emerald-500 shrink-0">⛏</span>}
      <span className="font-mono text-slate-500 truncate flex-1" title={tx.sender_public_key}>
        {isMining ? 'COINBASE' : truncate(tx.sender_public_key)}
      </span>
      <span className="text-slate-600">→</span>
      <span className="font-mono text-slate-400 truncate flex-1" title={tx.recipient_public_key}>
        {truncate(tx.recipient_public_key)}
      </span>
      <span className="font-mono text-sky-400 shrink-0 font-medium">{tx.amount}</span>
    </div>
  );
}

function BlockCard({ block, isLatest }: { block: Block; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
      isLatest ? 'border-sky-500/40' : 'border-slate-800'
    }`}>
      {/* Header */}
      <div
        className="px-5 py-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
              isLatest ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
            }`}>
              #{block.block_number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">Block {block.block_number}</span>
                {isLatest && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium">Latest</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{new Date(block.timestamp * 1000).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right shrink-0">
            <div>
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="text-sm font-semibold text-slate-200">{block.transactions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nonce</p>
              <p className="text-sm font-semibold text-slate-200 font-mono">{block.nonce.toLocaleString()}</p>
            </div>
            {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </div>

        {/* Hash info */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Hash size={11} className="text-slate-600 shrink-0" />
            <span className="text-slate-600">Prev:</span>
            <span className="font-mono text-slate-500 truncate">{truncate(block.previous_hash, 16)}</span>
            <CopyBtn value={block.previous_hash} />
          </div>
        </div>
      </div>

      {/* Expanded transactions */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-800 space-y-2 pt-4">
          <p className="text-xs font-medium text-slate-500 mb-3">
            {block.transactions.length} transaction{block.transactions.length !== 1 ? 's' : ''}
          </p>
          {block.transactions.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-4">No transactions in this block</p>
          ) : (
            block.transactions.map((tx, i) => <TxRow key={i} tx={tx} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function BlocksPage() {
  const { activeNode } = useNode();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChain(activeNode);
      setBlocks([...data.chain].reverse()); // latest first
    } catch {
      setError('Failed to fetch chain data');
    } finally {
      setLoading(false);
    }
  }, [activeNode]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Block Explorer</h1>
          <p className="text-slate-400 text-sm mt-1">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} on {activeNode}
          </p>
        </div>
        <button
          onClick={fetchBlocks}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-600" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 text-sm">{error}</div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, i) => (
            <BlockCard key={block.block_number} block={block} isLatest={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
