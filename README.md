# ⛓ Blockchain App

A proof-of-work blockchain built from scratch in Python, with a modern Next.js TypeScript frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (localhost:3000)                │
│              Next.js 16 · TypeScript · Tailwind         │
│                                                         │
│  Dashboard  │  Blocks  │  Wallet  │  Send  │  Explorer │
│  Balance    │  Visualize          │  Configure          │
└────────┬────────────────────────┬────────────────────────┘
         │ REST API               │ REST API
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐
│  Blockchain Node│    │   Wallet Client     │
│  Flask · :5001  │    │   Flask · :8081     │
│                 │    │                     │
│  - PoW mining   │    │  - RSA key gen      │
│  - Mempool      │    │  - Tx signing       │
│  - Consensus    │    │                     │
└─────────────────┘    └─────────────────────┘
```

## Quick Start

You need **three terminals** running simultaneously:

### Terminal 1 — Blockchain Node
```powershell
conda activate blockchain
cd blockchain
python blockchain_test.py          # runs on :5001
# optional: python blockchain_test.py -p 5002  (second node)
```

### Terminal 2 — Wallet Client
```powershell
conda activate blockchain
cd blockchain_client
python blockchain_client_test.py   # runs on :8081
```

### Terminal 3 — Frontend
```powershell
cd frontend
npm run dev                        # runs on :3000
```

Open **http://localhost:3000** in your browser.

## Features

### Frontend Pages
| Route | Description |
|-------|-------------|
| `/` | **Dashboard** — live mempool, full chain, mine blocks, auto-refresh, stats |
| `/blocks` | **Block Explorer** — expandable block cards with transaction details |
| `/configure` | **Node Config** — register peers, live health/latency pings |
| `/wallet` | **Wallet Generator** — generate RSA-1024 keypairs, show/hide private key |
| `/transaction/make` | **Send** — sign & submit transactions with confirmation modal |
| `/transaction/view` | **Explorer** — browse & search transactions on any node |
| `/balance` | **Balance** — compute wallet balances from chain, address book labels |
| `/visualize` | **Visualizer** — interactive chain diagram, click blocks to inspect |

### Backend APIs
**Node** (`blockchain_test.py` · `:5001`):
- `GET /chain` — full blockchain
- `GET /transactions/get` — pending mempool
- `GET /mine` — run PoW and mint a block
- `POST /transactions/new` — submit a signed transaction
- `GET /nodes/get` — list peers
- `POST /nodes/register` — add peer nodes
- `GET /nodes/resolve` — longest-chain consensus

**Wallet Client** (`blockchain_client_test.py` · `:8081`):
- `GET /wallet/new` — generate RSA keypair
- `POST /generate/transaction` — sign a transaction

## Setup from Scratch

### Prerequisites
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- [Node.js 18+](https://nodejs.org)

### Install
```powershell
# 1. Create conda environment
conda env create -f environment.yml
conda activate blockchain

# 2. Install frontend dependencies
cd frontend
npm install
```

### Configure
The frontend reads backend URLs from `frontend/.env.local`:
```
NEXT_PUBLIC_NODE_URL=http://127.0.0.1:5001
NEXT_PUBLIC_CLIENT_URL=http://127.0.0.1:8081
```

## Running Multiple Nodes (Peer Consensus)

Start a second node on a different port:
```powershell
conda activate blockchain
cd blockchain
python blockchain_test.py -p 5002
```

Then in the UI:
1. Go to `/configure` on node `:5001`
2. Add `127.0.0.1:5002` as a peer
3. Mine blocks on each node
4. Use **Resolve Conflicts** on the Dashboard to sync to the longest chain

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Icons | Lucide React |
| Node backend | Python 3.11, Flask, flask-cors |
| Wallet backend | Python 3.11, Flask, PyCryptodome (RSA + SHA-1) |
| Consensus | Nakamoto longest-chain rule |
| Proof of Work | SHA-256, difficulty = 2 leading zeros |
| Key format | RSA-1024, DER-encoded, hex-serialized |

## Project Structure

```
pythonProject29/
├── blockchain/
│   ├── blockchain_test.py      # Node server (Flask API + PoW chain)
│   └── templates/              # Old Jinja2 UI (replaced by Next.js)
├── blockchain_client/
│   ├── blockchain_client_test.py  # Wallet server (Flask API + RSA)
│   └── templates/              # Old Jinja2 UI (replaced by Next.js)
├── frontend/                   # Next.js TypeScript app
│   ├── app/                    # App Router pages
│   ├── components/             # Navbar
│   ├── contexts/               # Theme, Node, AddressBook
│   └── lib/                    # API client, TypeScript types
├── environment.yml             # Conda environment spec
├── requirements.txt            # Pip packages
└── README.md
```
