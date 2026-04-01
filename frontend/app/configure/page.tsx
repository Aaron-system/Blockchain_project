'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Server, Loader2, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { getNodes, registerNodes } from '@/lib/api';
import { useNode } from '@/contexts/NodeContext';

interface NodeStatus {
  url: string;
  online: boolean;
  latency: number | null;
  checking: boolean;
}

async function pingNode(url: string): Promise<{ online: boolean; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`http://${url}/chain`, { signal: AbortSignal.timeout(4000) });
    return { online: res.ok, latency: Date.now() - start };
  } catch {
    return { online: false, latency: Date.now() - start };
  }
}

export default function ConfigurePage() {
  const { activeNode } = useNode();
  const [nodeInput, setNodeInput] = useState('');
  const [statuses, setStatuses] = useState<NodeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const checkHealth = useCallback(async (nodes: string[]) => {
    setStatuses(nodes.map((url) => ({ url, online: false, latency: null, checking: true })));
    const results = await Promise.all(nodes.map((url) => pingNode(url)));
    setStatuses(nodes.map((url, i) => ({ url, ...results[i], checking: false })));
  }, []);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNodes(activeNode);
      const nodes: string[] = data.nodes ?? [];
      await checkHealth(nodes);
    } catch {
      showToast('Failed to fetch nodes', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeNode, checkHealth]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const handleAdd = async () => {
    const trimmed = nodeInput.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await registerNodes(trimmed, activeNode);
      setNodeInput('');
      showToast('Node(s) registered successfully');
      await fetchNodes();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add nodes', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configure Nodes</h1>
        <p className="text-slate-400 text-sm mt-1">Register peer nodes for consensus on {activeNode}</p>
      </div>

      {/* Add Nodes */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-100">Add Nodes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter one or more addresses (e.g. <code className="font-mono text-slate-400">127.0.0.1:5002</code>), separated by commas.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nodeInput}
            onChange={(e) => setNodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="127.0.0.1:5002, 127.0.0.1:5003"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors font-mono"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !nodeInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
      </section>

      {/* Node List */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-100">Peer Nodes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {statuses.length} peer{statuses.length !== 1 ? 's' : ''} ·{' '}
              {statuses.filter((s) => s.online).length} online
            </p>
          </div>
          <button
            onClick={fetchNodes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            <Loader2 size={12} className={loading ? 'animate-spin' : 'hidden'} />
            Re-check
          </button>
        </div>

        {loading && statuses.length === 0 ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={20} className="animate-spin text-slate-600" />
          </div>
        ) : statuses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Server size={32} className="mx-auto mb-3 opacity-30" />
            No peer nodes registered yet
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/50">
            {statuses.map((s) => (
              <li key={s.url} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  {s.checking ? (
                    <Loader2 size={14} className="animate-spin text-slate-500 shrink-0" />
                  ) : s.online ? (
                    <Wifi size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <WifiOff size={14} className="text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-mono text-sm text-slate-300">{s.url}</p>
                    {!s.checking && (
                      <p className={`text-xs mt-0.5 ${s.online ? 'text-emerald-500' : 'text-red-500'}`}>
                        {s.online ? `Online · ${s.latency}ms` : 'Offline'}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={`http://${s.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-sky-400 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
