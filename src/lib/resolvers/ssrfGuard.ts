import dns from 'node:dns/promises';

// List of IP ranges to block (SSRF protection)
const BLOCKED_IP_REGEXES = [
  /^127\./,                 // Loopback 127.0.0.0/8
  /^10\./,                  // Private 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private 172.16.0.0/12
  /^192\.168\./,            // Private 192.168.0.0/16
  /^169\.254\./,            // Link-local / Cloud metadata 169.254.0.0/16
  /^0\./,                   // Current network 0.0.0.0/8
  /^::1$/,                  // IPv6 Loopback
  /^fc00:/i,                // IPv6 Unique local
  /^fe80:/i,                // IPv6 Link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'loopback',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data'
];

export async function validateUrlForSSRF(urlStr: string): Promise<{ valid: boolean; url?: URL; error?: string }> {
  try {
    const url = new URL(urlStr);

    // Only allow HTTP and HTTPS protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }

    const hostname = url.hostname.toLowerCase();

    // Check hostname blacklist
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, error: 'Access to internal or private hosts is restricted.' };
    }

    // Resolve DNS IP addresses
    let ips: string[] = [];
    try {
      const lookupResult = await dns.lookup(hostname, { all: true });
      ips = lookupResult.map(r => r.address);
    } catch {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    if (ips.length === 0) {
      return { valid: false, error: `No IP addresses found for hostname "${hostname}".` };
    }

    // Check if any resolved IP falls into blocked ranges
    for (const ip of ips) {
      for (const regex of BLOCKED_IP_REGEXES) {
        if (regex.test(ip)) {
          return { valid: false, error: `Hostname resolved to a restricted IP address (${ip}).` };
        }
      }
    }

    return { valid: true, url };
  } catch (e: any) {
    return { valid: false, error: e.message || 'Invalid URL format.' };
  }
}
