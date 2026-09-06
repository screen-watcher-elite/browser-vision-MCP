/**
 * Action Loop & Hallucination Circuit-Breaker
 * Prevents small local models from entering infinite action loops or flooding websites.
 */

interface ActionHistoryEntry {
  hash: string;
  timestamp: number;
}

export class CircuitBreaker {
  private history: ActionHistoryEntry[] = [];
  private maxHistory: number;
  private repeatThreshold: number;
  private timeWindowMs: number;

  constructor(repeatThreshold = 4, timeWindowMs = 15000, maxHistory = 15) {
    this.repeatThreshold = repeatThreshold;
    this.timeWindowMs = timeWindowMs;
    this.maxHistory = maxHistory;
  }

  /**
   * Records an action and checks if the model is trapped in an infinite loop.
   */
  public recordAndCheck(actionName: string, targetStr: string): { isTripped: boolean; message?: string } {
    const now = Date.now();
    const hash = `${actionName}:${targetStr}`;

    this.history.push({ hash, timestamp: now });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Filter recent actions within sliding window
    const recent = this.history.filter((e) => now - e.timestamp < this.timeWindowMs);

    // Count frequency of this identical action
    const identicalCount = recent.filter((e) => e.hash === hash).length;

    if (identicalCount >= this.repeatThreshold) {
      return {
        isTripped: true,
        message: `[CIRCUIT BREAKER TRIPPED] Action "${actionName}" on "${targetStr}" repeated ${identicalCount} times in <15s. Execution paused to prevent infinite loop / resource exhaustion.`,
      };
    }

    return { isTripped: false };
  }

  public reset(): void {
    this.history = [];
  }
}
