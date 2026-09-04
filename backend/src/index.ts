import express from "express";
import cors from "cors";
import { nftsRouter } from "./routes/nfts.js";
import { collectionsRouter } from "./routes/collections.js";

const app = express();
const PORT = process.env.PORT ?? 8787;

// Em produção, defina FRONTEND_ORIGIN (ex.: https://seu-app.vercel.app)
// para restringir quem pode chamar a API. Sem a env var, libera geral —
// útil em dev, mas troque antes de ir ao ar.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors(FRONTEND_ORIGIN ? { origin: FRONTEND_ORIGIN } : undefined));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/nfts", nftsRouter);
app.use("/api/collections", collectionsRouter);

app.listen(PORT, () => {
  console.log(`TON NFT Hub backend rodando em http://localhost:${PORT}`);
});
