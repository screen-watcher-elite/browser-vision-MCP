/**
 * Expedition Guard & Domain Boundary Enforcement
 * Pins agent goals and prevents unauthorized cross-domain navigation and destructive actions.
 */

export class ExpeditionGuard {
  private currentGoal: string | null = null;
  private allowedDomains: Set<string> = new Set();
  private strictMode: boolean = false;
  private blockedNavigationCount: number = 0;
  private blockedDestructiveCount: number = 0;

  private static DESTRUCTIVE_KEYWORDS = [
    'delete',
    'remove',
    'wipe',
    'destroy',
    'terminate',
    'drop table',
    'cancel subscription',
    'revoke',
    'purge',
    'format disk',
    'uninstall',
  ];

  /**
   * Pins an active goal and whitelists domains.
   */
  public setExpedition(
    goal: string,
    allowedDomains: string[],
    strictMode: boolean = true
  ): { currentGoal: string; allowedDomains: string[]; strictMode: boolean } {
    this.currentGoal = goal;
    this.strictMode = strictMode;
    this.allowedDomains = new Set(
      allowedDomains.map((d) => d.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0])
    );

    return {
      currentGoal: this.currentGoal,
      allowedDomains: Array.from(this.allowedDomains),
      strictMode: this.strictMode,
    };
  }

  public clearExpedition(): void {
    this.currentGoal = null;
    this.allowedDomains.clear();
    this.strictMode = false;
  }

  /**
   * Verifies if target URL is allowed within the active expedition boundary.
   */
  public checkNavigation(targetUrl: string): { allowed: boolean; reason?: string } {
    // If no active expedition or allowed domains, allow navigation
    if (this.allowedDomains.size === 0 || !this.strictMode) {
      return { allowed: true };
    }

    try {
      const parsed = new URL(targetUrl);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

      // Check exact match or subdomain match
      let matched = false;
      for (const allowed of this.allowedDomains) {
        if (hostname === allowed || hostname.endsWith(`.${allowed}`)) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        this.blockedNavigationCount++;
        return {
          allowed: false,
          reason: `[SECURITY BLOCKED] Navigation to "${targetUrl}" (host: "${hostname}") is outside the allowed expedition domains: [${Array.from(
            this.allowedDomains
          ).join(', ')}]. Pinned Goal: "${this.currentGoal}".`,
        };
      }

      return { allowed: true };
    } catch {
      // Local files or relative paths
      if (targetUrl.startsWith('file:///') || targetUrl.startsWith('/')) {
        return { allowed: true };
      }
      this.blockedNavigationCount++;
      return { allowed: false, reason: `Invalid or untrusted URL format: "${targetUrl}"` };
    }
  }

  /**
   * Detects if an element triggers a destructive irreversible action.
   */
  public checkDestructiveAction(
    elementText: string,
    ariaLabel?: string | null
  ): { isDestructive: boolean; keyword?: string } {
    const combined = `${elementText || ''} ${ariaLabel || ''}`.toLowerCase();

    for (const kw of ExpeditionGuard.DESTRUCTIVE_KEYWORDS) {
      // Word boundary match to avoid false positives (e.g. "delegate" matching "delete")
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        this.blockedDestructiveCount++;
        return { isDestructive: true, keyword: kw };
      }
    }

    return { isDestructive: false };
  }

  public getTelemetry() {
    return {
      currentGoal: this.currentGoal,
      allowedDomains: Array.from(this.allowedDomains),
      strictMode: this.strictMode,
      blockedNavigationCount: this.blockedNavigationCount,
      blockedDestructiveCount: this.blockedDestructiveCount,
    };
  }
}
