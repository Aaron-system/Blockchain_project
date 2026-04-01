const NODE_URL = process.env.NEXT_PUBLIC_NODE_URL ?? 'http://127.0.0.1:5001';
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://127.0.0.1:8081';

export { NODE_URL, CLIENT_URL };

async function post(url: string, data: Record<string, string>) {
  const body = new URLSearchParams(data);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Node API ────────────────────────────────────────────────────────────────

export async function getChain(nodeUrl = NODE_URL) {
  const res = await fetch(`${nodeUrl}/chain`);
  if (!res.ok) throw new Error('Failed to fetch chain');
  return res.json();
}

export async function getMempool(nodeUrl = NODE_URL) {
  const res = await fetch(`${nodeUrl}/transactions/get`);
  if (!res.ok) throw new Error('Failed to fetch mempool');
  return res.json();
}

export async function mine(nodeUrl = NODE_URL) {
  const res = await fetch(`${nodeUrl}/mine`);
  if (!res.ok) throw new Error('Mining failed');
  return res.json();
}

export async function getNodes(nodeUrl = NODE_URL) {
  const res = await fetch(`${nodeUrl}/nodes/get`);
  if (!res.ok) throw new Error('Failed to fetch nodes');
  return res.json();
}

export async function registerNodes(nodes: string, nodeUrl = NODE_URL) {
  return post(`${nodeUrl}/nodes/register`, { nodes });
}

export async function resolveConflicts(nodeUrl = NODE_URL) {
  const res = await fetch(`${nodeUrl}/nodes/resolve`);
  if (!res.ok) throw new Error('Failed to resolve conflicts');
  return res.json();
}

// ─── Wallet Client API ───────────────────────────────────────────────────────

export async function generateWallet() {
  const res = await fetch(`${CLIENT_URL}/wallet/new`);
  if (!res.ok) throw new Error('Failed to generate wallet');
  return res.json();
}

export async function generateTransaction(data: {
  sender_public_key: string;
  sender_private_key: string;
  recipient_public_key: string;
  amount: string;
}) {
  return post(`${CLIENT_URL}/generate/transaction`, data);
}

export async function submitTransaction(
  data: {
    confirmation_sender_public_key: string;
    confirmation_recipient_public_key: string;
    confirmation_amount: string;
    transaction_signature: string;
  },
  nodeUrl = NODE_URL,
) {
  return post(`${nodeUrl}/transactions/new`, data);
}
