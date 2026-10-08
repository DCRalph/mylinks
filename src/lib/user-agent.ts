export type ParsedUserAgent = {
  /** "Chrome 129", "Gmail image proxy", "Slack link preview", or null. */
  client: string | null;
  /** "macOS 14.5", "iOS 18.0", "Android 15", or null. */
  os: string | null;
  device: "Desktop" | "Mobile" | "Tablet" | "Unknown";
  /** What kind of thing made the request. */
  kind: "browser" | "email-proxy" | "bot" | "unknown";
};

// Mail providers fetch images through their own servers, so a pixel load from
// these means "opened in that mail app", not a person's own browser.
const EMAIL_PROXIES: [RegExp, string][] = [
  [/GoogleImageProxy/i, "Gmail image proxy"],
  [/YahooMailProxy/i, "Yahoo Mail proxy"],
  [/Outlook|MSOffice|Microsoft Office/i, "Outlook"],
];

const BOTS: [RegExp, string][] = [
  [/Slackbot/i, "Slack link preview"],
  [/Discordbot/i, "Discord link preview"],
  [/Twitterbot/i, "X link preview"],
  [/facebookexternalhit|Facebot/i, "Facebook link preview"],
  [/WhatsApp/i, "WhatsApp link preview"],
  [/TelegramBot/i, "Telegram link preview"],
  [/LinkedInBot/i, "LinkedIn link preview"],
  [/Applebot/i, "Apple bot"],
  [/Googlebot/i, "Googlebot"],
  [/bingbot/i, "Bingbot"],
  [
    /bot|crawler|spider|preview|curl|wget|python-requests|httpclient/i,
    "Bot or script",
  ],
];

const BROWSERS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/SamsungBrowser\/(\d+)/, "Samsung Internet"],
  [/(?:Firefox|FxiOS)\/(\d+)/, "Firefox"],
  [/(?:Chrome|CriOS)\/(\d+)/, "Chrome"],
  [/Version\/(\d+)(?:\.\d+)*.*Safari/, "Safari"],
];

const version = (raw: string | undefined) => raw?.replace(/_/g, ".");

function parseOs(ua: string): string | null {
  const ios = /(?:iPhone|iPad|iPod).*? OS (\d+[_\d]*)/.exec(ua);
  if (ios) return `iOS ${version(ios[1])}`;
  const android = /Android (\d+(?:\.\d+)?)/.exec(ua);
  if (android) return `Android ${android[1]}`;
  if (ua.includes("Windows NT 10")) return "Windows";
  if (ua.includes("Windows")) return "Windows (older)";
  const mac = /Mac OS X (\d+[_\d]*)/.exec(ua);
  if (mac) return `macOS ${version(mac[1])}`;
  if (ua.includes("CrOS")) return "ChromeOS";
  if (ua.includes("Linux")) return "Linux";
  return null;
}

function parseDevice(ua: string, os: string | null): ParsedUserAgent["device"] {
  if (
    /iPad|Tablet/i.test(ua) ||
    (ua.includes("Android") && !ua.includes("Mobile"))
  )
    return "Tablet";
  if (/Mobile|iPhone|iPod/.test(ua)) return "Mobile";
  return os ? "Desktop" : "Unknown";
}

/** Best-effort breakdown of a User-Agent header. Raw strings stay the source of truth. */
export function parseUserAgent(
  userAgent: string | null | undefined,
): ParsedUserAgent {
  const ua = userAgent ?? "";

  for (const [pattern, name] of EMAIL_PROXIES) {
    if (pattern.test(ua)) {
      // Proxies send a made-up desktop UA, so there's no real OS to report.
      return { client: name, os: null, device: "Unknown", kind: "email-proxy" };
    }
  }
  for (const [pattern, name] of BOTS) {
    if (pattern.test(ua)) {
      return { client: name, os: null, device: "Unknown", kind: "bot" };
    }
  }

  const os = parseOs(ua);
  for (const [pattern, name] of BROWSERS) {
    const match = pattern.exec(ua);
    if (match) {
      return {
        client: `${name} ${match[1]}`,
        os,
        device: parseDevice(ua, os),
        kind: "browser",
      };
    }
  }

  return { client: null, os, device: parseDevice(ua, os), kind: "unknown" };
}
