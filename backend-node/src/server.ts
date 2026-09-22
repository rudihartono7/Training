import { buildApp } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5199;

const app = buildApp();
app.listen(PORT, () => {
  console.log(`PaymentLab backend (Node) listening on :${PORT}`);
});
