'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, X } from 'lucide-react';
import { getChain } from '@/lib/api';
import { useNode } from '@/contexts/NodeContext';
import type { Block } from '@/lib/types';

const MINING_SENDER = 'THE BLOCKCHAIN';

function truncate(s: string, n = 8) {
  if (!s || s.length <= n * 2) return s;
  return `${s.slice(0, n)}…${s.slice(-4)}`;
}

function BlockNode({
  block,
  isLatest,
  isSelected,
  onClick,
  index,
}: {
  block: Block;
  isLatest: boolean;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const userTxs = block.transactions.filter((tx) => tx.sender_public_key !== MINING_SENDER);
  const hasCoinbase = block.transactions.some((tx) => tx.sender_public_key === MINING_SENDER);

  return (
    <div
      className="shrink-0 flex flex-col items-center"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={onClick}
        className={`w-44 rounded-2xl border-2 p-4 transition-all duration-200 text-left group ${
          isSelected
            ? 'border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/10 scale-105'
            : isLatest
            ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10'
            : 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/60'
        }`}
      >
        {/* Block number */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-lg font-bold ${isSelected ? 'text-sky-400' : isLatest ? 'text-emerald-400' : 'text-slate-300'}`}>
            #{block.block_number}
          </span>
          {isLatest && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              HEAD
            </span>
          )}
        </div>

        {/* Transactions count */}
        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Txns</span>
            <span className="text-slate-300 font-medium">{block.transactions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Nonce</span>
            <span className="font-mono text-slate-400">{block.nonce.toLocaleString()}</span>
          </div>
          {hasCoinbase && (
            <div className="flex items-center gap-1 text-emerald-600 mt-1">
              <span>⛏</span>
              <span className="text-xs">coinbase</span>
            </div>
          )}
          {userTxs.length > 0 && (
            <div className="text-slate-600 text-xs">{userTxs.length} user tx{userTxs.length !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Previous hash */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 mb-0.5">prev</p>
          <p className="font-mono text-xs text-slate-600 truncate">{truncate(block.previous_hash)}</p>
        </div>
      </button>
    </div>
  );
}

function Arrow({ highlight }: { highlight: boolean }) {
  return (
    <div className="shrink-0 flex items-center self-center -mx-1">
      <div className={`h-px w-8 transition-colors ${highlight ? 'bg-sky-500' : 'bg-slate-700'}`} />
      <div
        className={`border-t-4 border-b-4 border-l-8 border-transparent transition-colors ${
          highlight ? 'border-l-sky-500' : 'border-l-slate-700'
        }`}
        style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
      />
    </div>
  );
}

export default function VisualizePage() {
  const { activeNode } = useNode();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChain(activeNode);
      setBlocks(data.chain);
      setSelected(null);
    } catch {
      setError('Failed to fetch chain');
    } finally {
      setLoading(false);
    }
  }, [activeNode]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const selectedBlock = selected !== null ? blocks[selected] : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Chain Visualizer</h1>
          <p className="text-slate-400 text-sm mt-1">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} · click any block to inspect
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

      {/* Chain diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-sm">{error}</div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">No blocks yet</div>
        ) : (
          <div className="flex items-stretch gap-0 pb-2 min-w-max">
            {blocks.map((block, i) => (
              <div key={block.block_number} className="flex items-center">
                {i > 0 && <Arrow highlight={selected !== null && (selected === i || selected === i - 1)} />}
                <BlockNode
                  block={block}
                  isLatest={i === blocks.length - 1}
                  isSelected={selected === i}
                  onClick={() => setSelected(selected === i ? null : i)}
                  index={i}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-emerald-500/50 bg-emerald-500/5" />
          Latest block (HEAD)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-slate-700 bg-slate-900" />
          Confirmed block
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-sky-400 bg-sky-500/10" />
          Selected
        </div>
      </div>

      {/* Block detail panel */}
      {selectedBlock && (
        <section className="bg-slate-900 border border-sky-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Block #{selectedBlock.block_number}</h2>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Block #', value: selectedBlock.block_number },
              { label: 'Nonce', value: selectedBlock.nonce.toLocaleString() },
              { label: 'Transactions', value: selectedBlock.transactions.length },
              { label: 'Timestamp', value: new Date(selectedBlock.timestamp * 1000).toLocaleTimeString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/60 rounded-xl p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Hashes */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-slate-800/40 rounded-lg px-3 py-2.5">
              <span className="text-xs text-slate-500 shrink-0 w-20">Prev Hash</span>
              <span className="font-mono text-xs text-slate-400 break-all">{selectedBlock.previous_hash}</span>
            </div>
          </div>

          {/* Transactions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">
              Transactions ({selectedBlock.transactions.length})
            </p>
            {selectedBlock.transactions.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">No transactions</p>
            ) : (
              selectedBlock.transactions.map((tx, i) => {
                const isMining = tx.sender_public_key === MINING_SENDER;
                return (
                  <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs ${isMining ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-slate-800/40'}`}>
                    <span className={`shrink-0 ${isMining ? 'text-amber-400' : 'text-slate-500'}`}>
                      {isMining ? '⛏' : `${i + 1}.`}
                    </span>
                    <span className="font-mono text-slate-500 flex-1 truncate">
                      {isMining ? 'Coinbase Reward' : truncate(tx.sender_public_key, 14)}
                    </span>
                    <span className="text-slate-600 shrink-0">→</span>
                    <span className="font-mono text-slate-400 flex-1 truncate">{truncate(tx.recipient_public_key, 14)}</span>
                    <span className="font-mono text-sky-400 font-medium shrink-0">{tx.amount}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
