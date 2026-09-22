/**
 * Port of the TimeProvider convention (CLAUDE.md section 5): services take a
 * Clock, never `new Date()` / `Date.now()` directly, so time can be
 * controlled in tests.
 */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Test double — port of tests/.../FakeClock.cs. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  set(date: Date): void {
    this.current = date;
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
