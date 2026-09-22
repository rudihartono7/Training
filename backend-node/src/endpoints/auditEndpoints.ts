import { Router } from 'express';
import { AuditLog } from '../infrastructure/auditLog.js';

export function auditEndpoints(auditLog: AuditLog): Router {
  const router = Router();

  router.get('/api/audit', (_req, res) => {
    res.json(auditLog.all());
  });

  return router;
}
