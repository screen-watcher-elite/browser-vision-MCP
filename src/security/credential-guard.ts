/**
 * Deterministic Credential & Secret Scanner
 * Prevents accidental leaking of API keys, tokens, or private keys into untrusted web fields.
 */

export interface CredentialCheckResult {
  isSensitive: boolean;
  reason?: string;
  matchedPattern?: string;
}

const SENSITIVE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_\-]{20,}/i },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{32,}/i },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'GitHub Personal Token', regex: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,})/ },
  { name: 'AWS Access Key ID', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA|OPENSSH|EC|PGP|DSA)? ?PRIVATE KEY-----/i },
  { name: 'Generic Bearer Token', regex: /bearer\s+[a-zA-Z0-9\-_.~+/]{40,}/i },
];

export class CredentialGuard {
  private blockedAttemptsCount = 0;

  /**
   * Scans text for high-risk secret patterns.
   */
  public scan(text: string): CredentialCheckResult {
    if (!text || typeof text !== 'string') {
      return { isSensitive: false };
    }

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.regex.test(text)) {
        this.blockedAttemptsCount++;
        return {
          isSensitive: true,
          reason: `Input contains a detected ${pattern.name}. Blocked to prevent credential leakage.`,
          matchedPattern: pattern.name,
        };
      }
    }

    return { isSensitive: false };
  }

  public getBlockedCount(): number {
    return this.blockedAttemptsCount;
  }
}
