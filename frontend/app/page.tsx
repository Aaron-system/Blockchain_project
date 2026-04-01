'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pickaxe, RefreshCw, Copy, Check, Loader2, Activity } from 'lucide-react';
import { getChain, getMempool, mine, resolveConflicts } from '@/lib/api';
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
      <button onClick={copy} className="text-slate-600 hover:text-slate-300 transition-colors shrink-0">
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function HomePage() {
  const { activeNode } = useNode();
  const [mempool, setMempool] = useState<Transaction[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [mining, setMining] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loadingChain, setLoadingChain] = useState(true);
  const [loadingMempool, setLoadingMempool] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchChain = useCallback(async () => {
    setLoadingChain(true);
    try {
      const data = await getChain(activeNode);
      setBlocks(data.chain);
      setLastUpdated(new Date());
    } catch {
      showToast('Failed to fetch blockchain', 'error');
    } finally {
      setLoadingChain(false);
    }
  }, [activeNode]);

  const fetchMempool = useCallback(async () => {
    setLoadingMempool(true);
    try {
      const data = await getMempool(activeNode);
      setMempool(data.transactions);
    } finally {
      setLoadingMempool(false);
    }
  }, [activeNode]);

  const fetchAll = useCallback(() => {
    fetchChain();
    fetchMempool();
  }, [fetchChain, fetchMempool]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 10_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchAll]);

  const handleMine = async () => {
    setMining(true);
    try {
      const data = await mine(activeNode);
      showToast(`Block #${data.block_number} mined! Nonce: ${data.nonce}`);
      await fetchAll();
    } catch {
      showToast('Mining failed', 'error');
    } finally {
      setMining(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      const data = await resolveConflicts(activeNode);
      showToast(data.message);
      await fetchChain();
    } catch {
      showToast('Resolve failed', 'error');
    } finally {
      setResolving(false);
    }
  };

  const confirmed: Array<Transaction & { timestamp: number; block_number: number }> = [];
  for (const block of blocks) {
    for (const tx of block.transactions) {
      confirmed.push({ ...tx, timestamp: block.timestamp, block_number: block.block_number });
    }
  }

  const totalRewards = confirmed.filter((tx) => tx.sender_public_key === MINING_SENDER).length;
  const avgNonce =
    blocks.length > 1
      ? Math.round(blocks.slice(1).reduce((s, b) => s + b.nonce, 0) / (blocks.length - 1))
      : 0;

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeNode}
            {lastUpdated && (
              <span className="ml-2 text-slate-600">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            autoRefresh
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={13} className={autoRefresh ? 'animate-pulse' : ''} />
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Chain Height" value={blocks.length} sub="blocks" />
        <StatCard label="Transactions" value={confirmed.length} sub="confirmed" />
        <StatCard label="Rewards Paid" value={totalRewards} sub="mining rewards" />
        <StatCard label="Avg. Nonce" value={avgNonce.toLocaleString()} sub="PoW iterations" />
      </div>

      {/* Mempool */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-slate-100">Mempool</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mempool.length} pending transaction{mempool.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMempool}
              disabled={loadingMempool}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loadingMempool ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleMine}
              disabled={mining}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {mining ? <Loader2 size={12} className="animate-spin" /> : <Pickaxe size={12} />}
              {mining ? 'Mining…' : 'Mine Block'}
            </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loadingMempool ? (
                <tr><td colSpan={4} className="py-10 text-center"><Loader2 size={20} className="animate-spin text-slate-600 mx-auto" /></td></tr>
              ) : mempool.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500 text-sm">No pending transactions</td></tr>
              ) : (
                mempool.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3"><AddressCell value={tx.sender_public_key} /></td>
                    <td className="px-4 py-3"><AddressCell value={tx.recipient_public_key} /></td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-sky-400">{tx.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chain */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-slate-100">Blockchain</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''} · {confirmed.length} confirmed transaction{confirmed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={resolving ? 'animate-spin' : ''} />
            Resolve Conflicts
          </button>
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
              {loadingChain ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={20} className="animate-spin text-slate-600 mx-auto" /></td></tr>
              ) : confirmed.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500 text-sm">No confirmed transactions yet — mine a block!</td></tr>
              ) : (
                confirmed.map((tx, i) => (
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
    </div>
  );
}
