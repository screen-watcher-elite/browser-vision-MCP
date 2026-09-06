/**
 * Homograph & Punycode Phishing Guard
 * Detects lookalike Unicode domain spoofing designed to deceive vision models and human operators.
 */

export interface PhishingCheckResult {
  isSafe: boolean;
  reason?: string;
  isPunycode?: boolean;
}

export class PhishingGuard {
  private static HIGH_VALUE_BRANDS = [
    'google',
    'github',
    'microsoft',
    'anthropic',
    'openai',
    'apple',
    'amazon',
    'paypal',
    'stripe',
    'walchand',
  ];

  /**
   * Scans a target URL for punycode or homograph lookalike spoofing.
   */
  public static check(targetUrl: string): PhishingCheckResult {
    try {
      if (targetUrl.startsWith('file:///')) return { isSafe: true };

      const parsed = new URL(targetUrl);
      const host = parsed.hostname.toLowerCase();

      // 1. Detect Punycode prefix
      if (host.includes('xn--')) {
        return {
          isSafe: false,
          isPunycode: true,
          reason: `[PHISHING BLOCKED] Domain "${host}" uses Punycode (IDN). Potential homograph spoofing attempt.`,
        };
      }

      // 2. Detect character substitutions (e.g., 0 for o, 1 for l/i, 3 for e) mimicking high-value brands
      const normalizedHost = host
        .replace(/0/g, 'o')
        .replace(/1/g, 'l')
        .replace(/@/g, 'a')
        .replace(/3/g, 'e')
        .replace(/vv/g, 'w');

      for (const brand of PhishingGuard.HIGH_VALUE_BRANDS) {
        // Character substitution spoofing: e.g. g00gle.com
        if (normalizedHost.includes(brand) && !host.includes(brand)) {
          return {
            isSafe: false,
            reason: `[PHISHING BLOCKED] Domain "${host}" uses character substitution spoofing to impersonate "${brand}".`,
          };
        }

        // Deceptive typosquatting / suspicious TLD: e.g. google-verify.xyz
        if (host.includes(brand) && !host.endsWith(`.${brand}.com`) && !host.endsWith(`${brand}.com`) && !host.endsWith(`.${brand}.io`)) {
          if (host.endsWith('.xyz') || host.endsWith('.top') || host.endsWith('.tk') || host.endsWith('.click')) {
            return {
              isSafe: false,
              reason: `[PHISHING BLOCKED] Domain "${host}" matches known typosquatting heuristic for "${brand}".`,
            };
          }
        }
      }

      return { isSafe: true };
    } catch {
      return { isSafe: true };
    }
  }
}
