# Deployment Guide

Deploys to `aaronk.tech` via the shared Caddy on the VPS.

## Subdomains

| Service | Domain | Container:Port |
|---------|--------|---------------|
| Frontend (Next.js) | `blockchain.aaronk.tech` | `blockchain-frontend:3000` |
| Node API (Flask) | `blockchain-node.aaronk.tech` | `blockchain-node:5001` |
| Wallet API (Flask) | `blockchain-wallet.aaronk.tech` | `blockchain-wallet:8081` |

All DNS is covered by the existing `*.aaronk.tech` wildcard A record — no new DNS entries needed.

---

## Step 1 — Clone on the VPS

```bash
ssh root@204.168.177.22
cd /opt
git clone https://github.com/YOUR_ORG/pythonProject29.git blockchain
cd blockchain
```

---

## Step 2 — Start the containers

```bash
docker compose up -d --build
```

The three containers will join `proxy-net` automatically so Caddy can reach them by service name.

---

## Step 3 — Add routes to EventHorizon's Caddyfile

```bash
nano /opt/eventHorizon/Caddyfile
```

Add these three blocks at the bottom:

```caddyfile
# ── Blockchain App ──────────────────────────────────────────────────────────
blockchain.aaronk.tech {
    reverse_proxy blockchain-frontend:3000
}

blockchain-node.aaronk.tech {
    reverse_proxy blockchain-node:5001
}

blockchain-wallet.aaronk.tech {
    reverse_proxy blockchain-wallet:8081
}
```

---

## Step 4 — Reload Caddy (zero-downtime)

```bash
cd /opt/eventHorizon
docker compose -f docker-compose.yml -f docker-compose.proxy-net.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy will immediately issue SSL certs for all three subdomains.

---

## Step 5 — Verify

```bash
curl -sI https://blockchain.aaronk.tech       # expect 200
curl -sI https://blockchain-node.aaronk.tech/chain    # expect 200 + JSON
curl -sI https://blockchain-wallet.aaronk.tech/wallet/new  # expect 200 + JSON

# Check all three containers are on proxy-net
docker network inspect proxy-net | grep '"Name"'
```

---

## Updating the app

```bash
cd /opt/blockchain
git pull
docker compose up -d --build
```

No Caddy changes needed unless service names or ports change.
