'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, Tag, Check, X, TrendingUp, TrendingDown, Minus, Copy } from 'lucide-react';
import { getChain } from '@/lib/api';
import { useNode } from '@/contexts/NodeContext';
import { useAddressBook } from '@/contexts/AddressBookContext';
import type { Block, Transaction } from '@/lib/types';

const MINING_SENDER = 'THE BLOCKCHAIN';

function truncate(s: string, n = 16) {
  if (!s || s.length <= n * 2) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

interface BalanceEntry {
  address: string;
  received: number;
  sent: number;
  balance: number;
}

interface TxEntry extends Transaction {
  timestamp: number;
  block_number: number;
  direction: 'in' | 'out' | 'mine';
}

function computeBalances(chain: Block[]): Map<string, BalanceEntry> {
  const map = new Map<string, BalanceEntry>();
  const get = (addr: string) => map.get(addr) ?? { address: addr, received: 0, sent: 0, balance: 0 };

  for (const block of chain) {
    for (const tx of block.transactions) {
      const amt = Number(tx.amount);
      if (tx.sender_public_key !== MINING_SENDER) {
        const s = get(tx.sender_public_key);
        s.sent += amt;
        s.balance -= amt;
        map.set(tx.sender_public_key, s);
      }
      const r = get(tx.recipient_public_key);
      r.received += amt;
      r.balance += amt;
      map.set(tx.recipient_public_key, r);
    }
  }
  return map;
}

function LabelEditor({ address }: { address: string }) {
  const { getLabel, setLabel, removeLabel } = useAddressBook();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const label = getLabel(address);

  const save = () => {
    if (input.trim()) setLabel(address, input.trim());
    setEditing(false);
  };
  const startEdit = () => { setInput(label ?? ''); setEditing(true); };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="text-xs bg-slate-800 border border-sky-500/50 rounded px-2 py-0.5 text-slate-100 w-28 focus:outline-none"
        />
        <button onClick={save} className="text-emerald-400 hover:text-emerald-300"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300"><X size={12} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 text-xs">{label}</span>
      )}
      <button onClick={startEdit} className="text-slate-600 hover:text-slate-300 transition-colors" title="Label this address">
        <Tag size={12} />
      </button>
      {label && (
        <button onClick={() => removeLabel(address)} className="text-slate-700 hover:text-red-400 transition-colors" title="Remove label">
          <X size={11} />
        </button>
      )}
    </div>
  );
}

export default function BalancePage() {
  const { activeNode } = useNode();
  const { getLabel } = useAddressBook();
  const [query, setQuery] = useState('');
  const [allBalances, setAllBalances] = useState<BalanceEntry[]>([]);
  const [history, setHistory] = useState<TxEntry[]>([]);
  const [focusedAddr, setFocusedAddr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChain(activeNode);
      const balMap = computeBalances(data.chain as Block[]);
      setAllBalances(Array.from(balMap.values()).sort((a, b) => b.balance - a.balance));
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, [activeNode]);

  const lookupAddress = (addr: string) => {
    setFocusedAddr(addr);
    setQuery(addr);
  };

  const fetchHistory = useCallback(async (addr: string) => {
    try {
      const data = await getChain(activeNode);
      const txs: TxEntry[] = [];
      for (const block of data.chain as Block[]) {
        for (const tx of block.transactions) {
          if (tx.sender_public_key === addr || tx.recipient_public_key === addr) {
            txs.push({
              ...tx,
              timestamp: block.timestamp,
              block_number: block.block_number,
              direction: tx.sender_public_key === MINING_SENDER ? 'mine' : tx.recipient_public_key === addr ? 'in' : 'out',
            });
          }
        }
      }
      setHistory(txs);
    } catch { /* silent */ }
  }, [activeNode]);

  const handleSearch = async () => {
    if (!fetched) await load();
    if (query.trim()) {
      setFocusedAddr(query.trim());
      await fetchHistory(query.trim());
    }
  };

  const focused = focusedAddr ? allBalances.find((b) => b.address === focusedAddr) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Balance Calculator</h1>
        <p className="text-slate-400 text-sm mt-1">Look up any address or view all wallet balances</p>
      </div>

      {/* Search */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Address Lookup</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Paste a public key (hex) or click an address below"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Look Up
          </button>
        </div>
      </section>

      {/* Focused address result */}
      {focused && (
        <section className="bg-slate-900 border border-sky-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-slate-400 truncate">{truncate(focused.address, 20)}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(focused.address); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="text-slate-600 hover:text-slate-300"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <LabelEditor address={focused.address} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${focused.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {focused.balance.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 rounded-lg p-3 text-center">
              <TrendingDown size={14} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Received</p>
              <p className="text-base font-bold text-emerald-400">+{focused.received}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 text-center">
              <TrendingUp size={14} className="text-red-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Sent</p>
              <p className="text-base font-bold text-red-400">-{focused.sent}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 text-center">
              <Minus size={14} className="text-sky-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Net Balance</p>
              <p className={`text-base font-bold ${focused.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {focused.balance}
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Transaction History ({history.length})</p>
              {history.map((tx, i) => (
                <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg text-xs ${
                  tx.direction === 'in' ? 'bg-emerald-500/5 border border-emerald-500/10'
                  : tx.direction === 'mine' ? 'bg-amber-500/5 border border-amber-500/10'
                  : 'bg-red-500/5 border border-red-500/10'
                }`}>
                  <span className={`shrink-0 font-medium w-8 ${
                    tx.direction === 'in' ? 'text-emerald-400' : tx.direction === 'mine' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {tx.direction === 'in' ? '+' : tx.direction === 'mine' ? '⛏' : '-'}{tx.amount}
                  </span>
                  <span className="text-slate-500 flex-1 truncate">
                    {tx.direction === 'out' ? `→ ${truncate(tx.recipient_public_key)}` : `← ${tx.direction === 'mine' ? 'Coinbase reward' : truncate(tx.sender_public_key)}`}
                  </span>
                  <span className="text-slate-600 shrink-0">Block #{tx.block_number}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Leaderboard */}
      {fetched && allBalances.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-slate-100">All Wallets</h2>
            <p className="text-xs text-slate-500 mt-0.5">{allBalances.length} addresses found on-chain</p>
          </div>
          <div className="divide-y divide-slate-800/50">
            {allBalances.map((entry, i) => {
              const label = getLabel(entry.address);
              return (
                <div
                  key={entry.address}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => lookupAddress(entry.address)}
                >
                  <span className="text-xs text-slate-600 w-6 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {label ? (
                      <p className="text-sm font-medium text-sky-400">{label}</p>
                    ) : null}
                    <p className="font-mono text-xs text-slate-500 truncate">{entry.address === MINING_SENDER ? 'THE BLOCKCHAIN' : truncate(entry.address)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${entry.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.balance}
                    </p>
                    <p className="text-xs text-slate-600">+{entry.received} / -{entry.sent}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!fetched && (
        <div className="text-center py-16 text-slate-500 text-sm">
          Enter a public key or click &quot;Look Up&quot; to load all balances from {activeNode}
        </div>
      )}
    </div>
  );
}
