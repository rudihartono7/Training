import express, { Express } from 'express';
import cors from 'cors';
import { InMemoryTransactionStore } from './infrastructure/transactionStore.js';
import { InMemoryAuditLog } from './infrastructure/auditLog.js';
import { Clock, SystemClock } from './infrastructure/clock.js';
import { seedTransactions } from './infrastructure/seedData.js';
import { RefundService } from './services/refundService.js';
import { transactionEndpoints } from './endpoints/transactionEndpoints.js';
import { refundEndpoints } from './endpoints/refundEndpoints.js';
import { auditEndpoints } from './endpoints/auditEndpoints.js';

/**
 * Port of Program.cs. Builds the app with DI wired by hand (constructor
 * injection convention preserved, no framework-magic container) and CORS
 * open to the frontend dev server on localhost:5173, same as the .NET
 * original.
 */
export function buildApp(clock: Clock = new SystemClock()): Express {
  const store = new InMemoryTransactionStore();
  const auditLog = new InMemoryAuditLog();
  const refundService = new RefundService(store, auditLog, clock);

  store.seed(seedTransactions(clock.now()));

  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.use(transactionEndpoints(store));
  app.use(refundEndpoints(refundService));
  app.use(auditEndpoints(auditLog));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}
