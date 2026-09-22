/**
 * Port of Infrastructure/AuditLog.cs.
 *
 * Hard rule (CLAUDE.md section 4, R2/R4): never put a full PAN, CVV,
 * NIK/KTP number, cardholder name, token or credential into an audit
 * entry. `details` carries only non-sensitive keys such as refundId,
 * merchantId, amount, feeReversed, reason, idempotencyKey.
 */
export interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, string | number>;
  recordedAt: Date;
}

export interface AuditLog {
  record(action: string, details: Record<string, string | number>, recordedAt: Date): AuditEntry;
  all(): AuditEntry[];
}

export class InMemoryAuditLog implements AuditLog {
  private entries: AuditEntry[] = [];
  private seq = 0;

  record(action: string, details: Record<string, string | number>, recordedAt: Date): AuditEntry {
    this.seq += 1;
    const entry: AuditEntry = {
      id: `audit_${this.seq}`,
      action,
      details,
      recordedAt
    };
    this.entries.push(entry);
    return entry;
  }

  all(): AuditEntry[] {
    return [...this.entries];
  }
}
