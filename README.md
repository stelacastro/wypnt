# TON NFT Hub — Telegram Mini App

Agregador de NFTs (com foco em "Gifts" colecionáveis) do ecossistema TON,
unificando dados de múltiplas origens (Getgems, TON API / Fragment) em uma
única interface de Telegram Mini App, com conexão de carteira via TON Connect
e simulação de listagem/compra.

## 1. Arquitetura do projeto

Dois pacotes independentes, cada um com seu próprio `package.json`:

```
ton-nft-hub/
├── frontend/                      # Telegram Mini App (React + Vite + TS + Tailwind)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx                # Bootstrap: TonConnectUIProvider + Telegram WebApp init
│       ├── App.tsx                 # Shell: bottom nav + routed views
│       ├── index.css                # Tailwind layers + design tokens
│       ├── types/
│       │   └── nft.ts               # Unified NFT/domain types
│       ├── services/
│       │   └── nftService.ts        # API client — normalizes Getgems/TonAPI payloads
│       ├── hooks/
│       │   └── useTelegramTheme.ts   # Syncs Tailwind theme with Telegram's theme params
│       └── components/
│           ├── BottomNav.tsx
│           ├── PlatformBadge.tsx
│           ├── NFTCard.tsx
│           ├── NFTGrid.tsx
│           ├── WalletConnect.tsx
│           ├── FilterBar.tsx
│           └── views/
│               ├── MarketView.tsx
│               ├── WalletView.tsx
│               └── ActivityView.tsx
│
└── backend/                       # Node.js (TypeScript) cache/aggregation API
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                 # Express app entrypoint
        ├── types.ts                  # Shared server-side types
        ├── routes/
        │   └── nfts.ts               # GET /api/nfts, GET /api/nfts/:collection
        └── services/
            ├── cache.ts              # In-memory TTL cache (swap for Redis in prod)
            └── providers/
                ├── getgems.ts        # Getgems GraphQL adapter (stubbed/documented)
                └── tonapi.ts         # tonapi.io REST adapter (stubbed/documented)
```

**Por que um backend separado?** O Telegram Mini App roda dentro do
WebView do Telegram, então chamadas diretas a GraphQL/REST de terceiros a
partir do navegador esbarram em CORS e em rate limits agressivos quando
multiplicados por milhares de usuários simultâneos. O backend:

1. Centraliza e cacheia (TTL curto, ex. 30–60s) as respostas de cada
   marketplace, reduzindo custo de API e latência percebida;
2. Normaliza os formatos de cada provedor no mesmo contrato
   (`UnifiedNFT`) antes de entregar ao frontend;
3. Esconde chaves de API (TonAPI, Getgems) do cliente.

Em desenvolvimento local, o `nftService.ts` do frontend pode apontar
direto para os mocks (sem backend) — ver `USE_MOCK` em
`services/nftService.ts`.

## 2. Rodando localmente

```bash
# Backend
cd backend
npm install
npm run dev        # http://localhost:8787

# Frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Para testar como Mini App real, exponha o frontend via HTTPS (ex. `ngrok
http 5173` ou Cloudflare Tunnel) e registre a URL no BotFather
(`/newapp`).
