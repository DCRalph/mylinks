/** One piece of a user agent, e.g. "Win64" -> "64-bit Windows". */
export type UserAgentPart = {
  token: string;
  meaning?: string;
  /** A caveat, e.g. that the value is frozen. */
  note?: string;
};

type Meaning = Omit<UserAgentPart, "token">;

/** What the rest of the decode already worked out, to explain tokens with. */
type Context = {
  /** "Samsung Galaxy S23 Ultra". */
  deviceName?: string;
  /** "SM-S918B", "iPhone16,2". */
  modelCode?: string;
  /** The real OS from client hints, when the browser sent them. */
  hintedSystem?: string;
};

const languageNames = new Intl.DisplayNames(["en"], {
  type: "language",
  languageDisplay: "standard",
});

/** "en_NZ" or "en-NZ" -> "English (New Zealand)". */
export function languageName(tag: string) {
  try {
    return languageNames.of(tag.replace("_", "-")) ?? tag;
  } catch {
    return tag;
  }
}

const dots = (version: string) => version.replace(/_/g, ".");

const WINDOWS: Record<string, string> = {
  "10.0": "Windows 10 or 11",
  "6.3": "Windows 8.1",
  "6.2": "Windows 8",
  "6.1": "Windows 7",
  "6.0": "Windows Vista",
  "5.2": "Windows XP 64-bit",
  "5.1": "Windows XP",
  "5.0": "Windows 2000",
};

const ARCH: Record<string, string> = {
  x64: "Intel or AMD 64-bit processor",
  x86_64: "Intel or AMD 64-bit processor",
  amd64: "Intel or AMD 64-bit processor",
  i686: "Intel 32-bit processor",
  arm64: "ARM 64-bit processor",
  ARM64: "ARM 64-bit processor",
  aarch64: "ARM 64-bit processor",
};

const FIXED: Record<string, string> = {
  ...ARCH,
  Macintosh: "A Mac",
  Win64: "64-bit Windows",
  WOW64: "32-bit browser on 64-bit Windows",
  Win32: "Windows",
  X11: "X Window System, a Linux or Unix desktop",
  Linux: "Linux",
  iPhone: "An iPhone",
  iPad: "An iPad",
  "iPod touch": "An iPod touch",
  Mobile: "Mobile browser",
  wv: "Android WebView, a browser inside an app",
  U: "Old encryption strength flag",
  "KHTML, like Gecko": "Compatibility note, not a real engine",
  Gecko: "Gecko engine",
};

// Facebook's in-app browser: "[FBAN/FBIOS;FBAV/470.0;FBDV/iPhone16,2;...]".
const FACEBOOK: Record<string, string> = {
  FBAN: "Facebook app",
  FBAV: "Facebook app version",
  FBBV: "Facebook app build",
  FBMD: "Device family",
  FBSN: "System",
  FBSV: "System version",
  FBCR: "Mobile carrier",
  FBID: "Form factor",
  FBOP: "Facebook option flags",
};

/** Pattern rules for tokens with values in them, tried in order. */
const RULES: [
  RegExp,
  (match: RegExpExecArray, context: Context, ua: string) => Meaning,
][] = [
  [
    /^Mozilla\/5\.0$/,
    () => ({ meaning: "Sent by almost every browser, for historical reasons" }),
  ],
  [
    /^Intel Mac OS X (\d+(?:[._]\d+)*)$/,
    ([, version = ""], { hintedSystem }) =>
      /^10[._]15([._]7)?$/.test(version)
        ? {
            meaning: hintedSystem
              ? `Frozen, really ${hintedSystem}`
              : "macOS, version hidden",
            note: "Browsers on macOS 11 and later all send 10.15 or 10.15.7, and Apple silicon Macs still say Intel.",
          }
        : { meaning: `Mac OS X ${dots(version)} on Intel` },
  ],
  [/^PPC Mac OS X/, () => ({ meaning: "Mac OS X on PowerPC" })],
  [
    /^Windows NT (\d+\.\d+)$/,
    ([, version = ""], { hintedSystem }) =>
      version === "10.0"
        ? {
            meaning: hintedSystem
              ? `Windows NT 10.0, really ${hintedSystem}`
              : "Windows 10 or 11",
            note: "Windows 11 still reports NT 10.0.",
          }
        : { meaning: WINDOWS[version] ?? `Windows NT ${version}` },
  ],
  [
    /^Android (\S+)$/,
    ([, version = ""], { hintedSystem }, ua) =>
      version === "10" && ua.includes("Android 10; K)")
        ? {
            meaning: hintedSystem
              ? `Frozen, really ${hintedSystem}`
              : "Android, version hidden",
            note: "Chrome sends 10 for every Android version.",
          }
        : { meaning: `Android ${version}` },
  ],
  [
    /^K$/,
    (_match, { deviceName }) => ({
      meaning: deviceName
        ? `Stand-in for the model, really ${deviceName}`
        : "Stand-in for the model, which Chrome hides",
    }),
  ],
  [
    /^CPU (iPhone )?OS (\S+) like Mac OS X$/,
    ([, iPhone, version = ""]) => ({
      meaning: `${iPhone ? "iOS" : "iPadOS"} ${dots(version)}`,
    }),
  ],
  [/^iOS (\S+)$/, ([, version = ""]) => ({ meaning: `iOS ${dots(version)}` })],
  [
    /^Linux (\S+)$/,
    ([, arch = ""]) => ({ meaning: `Linux on ${ARCH[arch] ?? arch}` }),
  ],
  [/^CrOS /, () => ({ meaning: "ChromeOS" })],
  [/^rv:(\S+)$/, ([, version]) => ({ meaning: `Gecko engine ${version}` })],
  [
    /^AppleWebKit\/(\S+)$/,
    ([, version], _context, ua) =>
      /Chrome|CriOS/.test(ua)
        ? {
            meaning: "Compatibility token. The real engine is Blink",
            note: "Chrome froze this at 537.36.",
          }
        : { meaning: `WebKit engine ${version}` },
  ],
  [
    /^Gecko\/(\d+)$/,
    () => ({ meaning: "Gecko engine", note: "The date is frozen." }),
  ],
  [
    /^(Chrome|CriOS)\/(\S+)$/,
    ([, name, version = ""]) =>
      /^\d+\.0\.0\.0$/.test(version)
        ? {
            meaning: `Chrome ${version.split(".")[0]}${name === "CriOS" ? " for iOS" : ""}`,
            note: "Chrome zeroes everything after the major version.",
          }
        : { meaning: `Chrome ${version}${name === "CriOS" ? " for iOS" : ""}` },
  ],
  [
    /^Version\/(\S+)$/,
    ([, version], _context, ua) =>
      ua.includes("Chrome/")
        ? { meaning: "Marks an Android WebView, a browser inside an app" }
        : { meaning: `Safari ${version}` },
  ],
  [
    /^Safari\/(\S+)$/,
    ([, version], _context, ua) =>
      /Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
        ? { meaning: "Compatibility token, not Safari" }
        : { meaning: `Safari build ${version}` },
  ],
  [
    /^Mobile\/(\S+)$/,
    () => ({
      meaning: "Mobile browser",
      note: "iOS sends the same build tag on every version.",
    }),
  ],
  [
    /^(?:Firefox|FxiOS)\/(\S+)$/,
    ([, version]) => ({ meaning: `Firefox ${version}` }),
  ],
  [
    /^Edg(?:e|A|iOS)?\/(\S+)$/,
    ([, version]) => ({ meaning: `Microsoft Edge ${version}` }),
  ],
  [/^OPR\/(\S+)$/, ([, version]) => ({ meaning: `Opera ${version}` })],
  [
    /^SamsungBrowser\/(\S+)$/,
    ([, version]) => ({ meaning: `Samsung Internet ${version}` }),
  ],
  [
    /^Snapchat\/(\S+)$/,
    ([, version]) => ({ meaning: `Snapchat app ${version}` }),
  ],
  [
    /^Instagram (\S+)$/,
    ([, version]) => ({ meaning: `Instagram app ${version}` }),
  ],
  [
    /^FBDV\/(.+)$/,
    ([, code], { deviceName }) => ({
      meaning: deviceName ? `Device: ${deviceName}` : `Device code ${code}`,
    }),
  ],
  [
    /^FBLC\/(.+)$/,
    ([, locale = ""]) => ({ meaning: `Language: ${languageName(locale)}` }),
  ],
  [/^FBSS\/(.+)$/, ([, scale]) => ({ meaning: `Screen scale ${scale}x` })],
  [
    /^(FB[A-Z]{2})\/(.+)$/,
    ([, key = "", value]) =>
      FACEBOOK[key] ? { meaning: `${FACEBOOK[key]}: ${value}` } : {},
  ],
  [
    /^([a-z]{2,3})_([A-Z]{2})$/,
    ([tag]) => ({ meaning: `Language: ${languageName(tag)}` }),
  ],
  [
    /^scale=([\d.]+)$/,
    ([, scale]) => ({ meaning: `Screen scale ${Number(scale)}x` }),
  ],
  [
    /^(\d{3,4})x(\d{3,4})$/,
    ([, w, h]) => ({ meaning: `Screen ${w} × ${h} px` }),
  ],
  [
    /^(\d+)\/(\d+)$/,
    ([, api, version]) => ({ meaning: `Android ${version}, API level ${api}` }),
  ],
  [/^(\d+)dpi$/, ([, dpi]) => ({ meaning: `Screen density ${dpi} dpi` })],
];

// Instagram puts a space between its name and version, so keep them together.
const TOKENS = /\(([^)]*)\)|\[([^\]]*)\]|(Instagram [\d.]+|\S+)/g;

/**
 * A user agent split into its parts, each explained where we know it:
 * "Macintosh; Intel Mac OS X 10_15_7" -> "A Mac", "macOS, version hidden".
 * Product tokens are space separated; (comments) and [brackets] hold ";" lists.
 */
export function userAgentParts(
  ua: string,
  context: Context = {},
): UserAgentPart[] {
  const tokens = [...ua.matchAll(TOKENS)].flatMap(
    ([, comment, bracket, word]) => {
      const list = comment ?? bracket;
      if (list === undefined) return word ? [word] : [];
      return list
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
    },
  );
  return tokens.map((token) => ({ token, ...explain(token, context, ua) }));
}

function explain(token: string, context: Context, ua: string): Meaning {
  const fixed = FIXED[token];
  if (fixed) return { meaning: fixed };

  // The model code, alone or with its build: "Pixel 8 Pro Build/AP2A.240805.005".
  const { modelCode, deviceName } = context;
  if (modelCode && token.startsWith(modelCode)) {
    const build = /Build\/(\S+)$/.exec(token)?.[1];
    return {
      meaning: deviceName ? `Device model, ${deviceName}` : "Device model",
      note: build && `System build ${build}`,
    };
  }

  for (const [pattern, describe] of RULES) {
    const match = pattern.exec(token);
    if (match) return describe(match, context, ua);
  }
  return {};
}
