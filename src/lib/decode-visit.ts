import DeviceDetector from "node-device-detector";
import ClientHints from "node-device-detector/client-hints";

import { parseUserAgent, type ParsedUserAgent } from "~/lib/user-agent";

/** One decoded detail, e.g. Model: "Galaxy S23 Ultra". */
export type Fact = {
  label: string;
  value: string;
  /** A caveat, e.g. why the real value is hidden. */
  note?: string;
  href?: string;
  /** The raw headers it was decoded from. */
  from: string[];
  /** Already said by the visit's title, subtitle or place. */
  headline?: boolean;
};

export type DecodedVisit = {
  kind: ParsedUserAgent["kind"];
  /** One line for lists: "Samsung Galaxy S23 Ultra · Chrome Mobile 129 · Android 14". */
  summary: string;
  /** The device, or the bot or proxy that stood in for one. */
  title: string;
  /** Its software: "Android 14.0.0 · Chrome Mobile 129.0.6668.71 · Phone". */
  subtitle: string;
  /** Most specific place known ("Christchurch"), then the rest ("🇳🇿 Canterbury, New Zealand"). */
  place: { title: string; subtitle: string } | null;
  facts: Fact[];
};

/**
 * Hints we ask browsers for. Chromium sends them on later requests to this
 * origin once it has seen this header on a page load (not on embedded images).
 */
export const ACCEPT_CH = [
  "sec-ch-ua-full-version-list",
  "sec-ch-ua-platform-version",
  "sec-ch-ua-model",
  "sec-ch-ua-arch",
  "sec-ch-ua-bitness",
  "sec-ch-ua-wow64",
  "sec-ch-ua-form-factors",
  "sec-ch-device-memory",
  "sec-ch-dpr",
  "sec-ch-viewport-width",
  "sec-ch-prefers-color-scheme",
  "sec-ch-prefers-reduced-motion",
  "ect",
  "rtt",
  "downlink",
].join(", ");

// Matomo's device database: thousands of regexes, so it's built on first use.
// It's large, so keep this module on the server.
let detector: DeviceDetector | undefined;
const getDetector = () =>
  (detector ??= new DeviceDetector({
    deviceIndexes: true,
    clientIndexes: true,
    osIndexes: true,
    maxUserAgentSize: 1000,
  }));
const clientHints = new ClientHints();

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const languageNames = new Intl.DisplayNames(["en"], {
  type: "language",
  languageDisplay: "standard",
});

const CONTINENTS: Record<string, string> = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};

const CLIENT_TYPES: Record<string, string> = {
  browser: "Browser",
  "mobile app": "App",
  pim: "Mail app",
  library: "Library",
  "feed reader": "Feed reader",
  mediaplayer: "Media player",
};

/** A fact, or nothing when there's no value, so fact lists read as plain lists. */
const fact = (
  label: string,
  value: string | null | undefined,
  from: string[],
  extra: Pick<Fact, "note" | "href" | "headline"> = {},
): Fact[] => (value ? [{ label, value, from, ...extra }] : []);

/** `"Android"` -> `Android`: client hints are quoted structured-header strings. */
function unquote(value: string | undefined) {
  const unquoted = value?.replace(/^"|"$/g, "");
  return unquoted === "" ? undefined : unquoted;
}

const sentence = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** The library's types, with "smartphone" and "phablet" as plain phones. */
const deviceType = (type: string) =>
  type.includes("phone") || type === "phablet" ? "Phone" : sentence(type);

const flag = (code: string) =>
  String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** "NZ" -> { flag: "🇳🇿", name: "New Zealand" }. XX is unknown and T1 is Tor. */
function country(code: string | undefined) {
  if (!code || code === "XX") return undefined;
  if (code === "T1") return { flag: "", name: "Tor network" };
  const name = /^[A-Z]{2}$/.test(code) ? regionNames.of(code) : undefined;
  return name ? { flag: flag(code), name } : { flag: "", name: code };
}

const joined = (
  parts: (string | null | undefined | false)[],
  separator = " · ",
) => parts.filter(Boolean).join(separator);

/** "en_NZ" or "en-NZ" -> "English (New Zealand)". */
function languageName(tag: string) {
  try {
    return languageNames.of(tag.replace("_", "-")) ?? tag;
  } catch {
    return tag;
  }
}

/** "en-NZ,en;q=0.9,mi;q=0.8" -> "English (New Zealand), English, Māori". */
function languages(acceptLanguage: string | undefined) {
  if (!acceptLanguage) return undefined;
  const tags = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]!.trim())
    .filter((tag) => tag && tag !== "*");
  return [...new Set(tags.map(languageName))].join(", ") || undefined;
}

function processor(
  arch: string | undefined,
  bitness: string | undefined,
  os: string,
) {
  if (!arch) return undefined;
  const lower = arch.toLowerCase();
  if (lower === "arm" && os === "Mac") return "Apple silicon";
  if (lower === "x64") return "x86 64-bit";
  return [lower === "arm" ? "ARM" : arch, bitness && `${bitness}-bit`]
    .filter(Boolean)
    .join(" ");
}

/** "image/avif,image/webp,*\/*" -> "AVIF, WebP". */
function imageFormats(accept: string | undefined) {
  const formats = [
    ["avif", "AVIF"],
    ["webp", "WebP"],
    ["jxl", "JPEG XL"],
    ["apng", "APNG"],
    ["svg+xml", "SVG"],
  ].filter(([type]) => accept?.includes(`image/${type}`));
  return formats.map(([, name]) => name).join(", ") || undefined;
}

const FETCH_DEST: Record<string, string> = {
  image: "An image inside a page or email",
  document: "A page opened in a tab",
  iframe: "A frame inside a page",
  empty: "A script request",
};

const FETCH_SITE: Record<string, string> = {
  "cross-site": "Another website",
  "same-site": "This site",
  "same-origin": "This site",
  none: "Directly, not from a page",
};

/**
 * Everything worth knowing about one visit, decoded from its user agent and
 * request headers: exact device, software versions, Cloudflare's location and
 * the browser's preferences. Best effort; the raw values stay the truth.
 */
export function decodeVisit(
  userAgent: string | null,
  headers: Record<string, string> | null,
): DecodedVisit {
  const ua = userAgent ?? "";
  const header = (name: string) => {
    const value = headers?.[name]?.trim();
    return value === "" ? undefined : value;
  };
  const parsed = parseUserAgent(userAgent);
  const bot = ua ? getDetector().parseBot(ua) : null;
  // The library types this as `any`.
  const producer = bot?.producer as { name?: string } | undefined;
  const headline = true;

  const facts: Fact[] = [];
  let kind = parsed.kind;
  let summary: string;
  let title: string;
  let subtitle: string;

  if (parsed.kind === "bot" || parsed.kind === "email-proxy" || bot?.name) {
    // A proxy or bot's device details are made up, so only say who it is.
    if (parsed.kind !== "email-proxy") kind = "bot";
    // Our own names for mail proxies, the library's more specific ones for bots.
    summary = title =
      (kind === "email-proxy" ? parsed.client : bot?.name) ??
      parsed.client ??
      "Bot";
    subtitle = joined([
      producer?.name && `Run by ${producer.name}`,
      bot?.category,
    ]);
    facts.push(
      ...fact("Name", bot?.name ?? title, ["user-agent"], { headline }),
      ...fact("Run by", producer?.name, ["user-agent"], { headline }),
      ...fact("Category", bot?.category, ["user-agent"], { headline }),
      ...fact("About", bot?.url, ["user-agent"], { href: bot?.url }),
    );
  } else if (ua === "Mozilla/5.0") {
    kind = "email-proxy";
    summary = "Apple Mail privacy proxy, likely";
    title = "Apple Mail Privacy Protection";
    subtitle = "Likely, from the bare user agent";
    facts.push(
      ...fact("Likely", title, ["user-agent"], {
        headline,
        note: "Apple Mail loads images through Apple's servers with this bare user agent, hiding the reader's device and IP.",
      }),
    );
  } else {
    const hints = clientHints.parse(headers ?? {}, {});
    const { device, os, client } = getDetector().detect(ua, hints);
    const hinted = (name: string) => !!header(name);

    // The exact model code: client hint, in-app identifier, or Android token.
    const modelCode =
      unquote(header("sec-ch-ua-model")) ??
      /\b(?:iPhone|iPad|iPod)\d+,\d+\b/.exec(ua)?.[0] ??
      /Android [\d.]+; (?:[a-z]{2}[-_][a-z]{2}; )?([^;)]+?)(?: Build\/[^;)]+)?[;)]/
        .exec(ua)?.[1]
        ?.trim();
    const reducedAndroid = ua.includes("Android 10; K)");

    let model = device.model || undefined;
    let modelNote: string | undefined;
    if (!model && reducedAndroid) {
      model = "Hidden";
      modelNote = "Chrome hides the model unless it sends client hints.";
    } else if (model === "iPhone" || model === "iPad") {
      modelNote =
        "Apple doesn't send the exact model. In-app browsers like Instagram and Facebook do.";
    } else if (!model && device.brand === "Apple" && os.name === "Mac") {
      model = "Mac";
      modelNote = "Macs don't send their model.";
    }

    // Browsers freeze some OS versions to make tracking harder.
    const osName =
      ({ Mac: "macOS", "GNU/Linux": "Linux" } as Record<string, string>)[
        os.name
      ] ?? os.name;
    let osValue = joined([osName, os.version], " ") || undefined;
    let osNote: string | undefined;
    if (!hinted("sec-ch-ua-platform-version")) {
      if (os.name === "Mac" && /^10\.15(\.7)?$/.test(os.version)) {
        osValue = "macOS";
        osNote =
          "Browsers report every macOS as 10.15.7, so the real version is hidden.";
      } else if (os.name === "Windows" && os.version === "10") {
        osValue = "Windows 10 or 11";
        osNote =
          "Windows 11 reports itself as 10 unless the browser sends client hints.";
      } else if (reducedAndroid) {
        osValue = "Android";
        osNote =
          "Chrome reports every Android as 10, so the real version is hidden.";
      }
    }

    // Chrome zeroes everything after the major version ("129.0.0.0").
    const reducedVersion = /^\d+\.0\.0\.0$/.test(client.version ?? "");
    const clientName = client.name
      ? joined(
          [
            client.name,
            reducedVersion ? client.version.split(".")[0] : client.version,
          ],
          " ",
        )
      : (parsed.client ?? undefined);
    const clientType = client.type ? CLIENT_TYPES[client.type] : undefined;
    const typeName = device.type ? deviceType(device.type) : undefined;
    const processorName = processor(
      unquote(header("sec-ch-ua-arch")) ?? (os.platform || undefined),
      unquote(header("sec-ch-ua-bitness")),
      os.name,
    );

    const screen = /\b(\d{3,4})x(\d{3,4})\b/.exec(ua);
    const scale =
      header("sec-ch-dpr") ??
      /scale=([\d.]+)/.exec(ua)?.[1] ??
      /FBSS\/([\d.]+)/.exec(ua)?.[1];
    const memory = header("sec-ch-device-memory") ?? header("device-memory");
    const appLocale = /(?:FBLC\/|; )([a-z]{2,3}_[A-Z]{2})[;)\]]/.exec(ua)?.[1];

    const deviceName =
      joined([device.brand, model !== "Hidden" && model], " ").replace(
        /^Apple (iPhone|iPad|Mac)/,
        "$1",
      ) || undefined;
    summary =
      joined([
        deviceName,
        client.name &&
          joined([client.name, client.version?.split(".")[0]], " "),
        osValue,
      ]) || "Unknown client";
    title = deviceName ?? osValue ?? clientName ?? "Unknown client";
    subtitle = joined(
      [osValue, clientName, typeName, processorName].filter(
        (part) => part !== title,
      ),
    );

    facts.push(
      ...fact("Type", typeName, ["user-agent", "sec-ch-ua-mobile"], {
        headline,
      }),
      ...fact("Make", device.brand, ["user-agent"], { headline }),
      ...fact("Model", model, ["user-agent", "sec-ch-ua-model"], {
        headline,
        note: modelNote,
      }),
      ...fact("Model code", modelCode !== model ? modelCode : undefined, [
        "user-agent",
        "sec-ch-ua-model",
      ]),
      ...fact(
        "Processor",
        processorName,
        ["user-agent", "sec-ch-ua-arch", "sec-ch-ua-bitness"],
        { headline },
      ),
      ...fact(
        "Memory",
        memory && `${memory} GB${memory === "8" ? " or more" : ""}`,
        ["sec-ch-device-memory", "device-memory"],
      ),
      ...fact("Screen", screen && `${screen[1]} × ${screen[2]} px`, [
        "user-agent",
      ]),
      ...fact("Pixel ratio", scale && `${Number(scale)}x`, [
        "user-agent",
        "sec-ch-dpr",
      ]),
      ...fact(
        "Viewport width",
        header("sec-ch-viewport-width") &&
          `${header("sec-ch-viewport-width")} px`,
        ["sec-ch-viewport-width"],
      ),
      ...fact(
        "Form factor",
        header("sec-ch-ua-form-factors")?.replace(/"/g, ""),
        ["sec-ch-ua-form-factors"],
      ),
      ...fact(
        "System",
        osValue,
        ["user-agent", "sec-ch-ua-platform", "sec-ch-ua-platform-version"],
        { headline, note: osNote },
      ),
      ...fact(
        clientType ?? "Client",
        clientName,
        ["user-agent", "sec-ch-ua", "sec-ch-ua-full-version-list"],
        {
          headline,
          note: reducedVersion
            ? "Chrome hides its exact build number."
            : undefined,
        },
      ),
      ...fact(
        "Engine",
        client.engine &&
          joined(
            [
              client.engine,
              reducedVersion
                ? client.engine_version?.split(".")[0]
                : client.engine_version,
            ],
            " ",
          ),
        ["user-agent"],
      ),
      ...fact("App language", appLocale && languageName(appLocale), [
        "user-agent",
      ]),
      ...fact("Carrier", /FBCR\/([^;\]]+)/.exec(ua)?.[1], ["user-agent"]),
    );
  }

  const where = country(header("cf-ipcountry"));
  const city = header("cf-ipcity");
  const region = header("cf-region");
  const regionCode = header("cf-region-code");
  const lat = header("cf-iplatitude");
  const lon = header("cf-iplongitude");
  const colo = /-([A-Z]{3})$/.exec(header("cf-ray") ?? "")?.[1];
  const scheme =
    header("x-forwarded-proto") ??
    /"scheme":"(\w+)"/.exec(header("cf-visitor") ?? "")?.[1];
  const colorScheme = unquote(header("sec-ch-prefers-color-scheme"));

  const [placeTitle, ...placeRest] = [city, region, where?.name].filter(
    (part) => part !== undefined,
  );
  const place = placeTitle
    ? {
        title: placeTitle,
        // Only a country known: say where that came from rather than nothing.
        subtitle: joined(
          [where?.flag, placeRest.join(", ") || "From the IP address"],
          " ",
        ),
      }
    : null;

  facts.push(
    ...fact("City", city, ["cf-ipcity"], { headline }),
    ...fact(
      "Region",
      region &&
        (regionCode && regionCode !== region
          ? `${region} (${regionCode})`
          : region),
      ["cf-region", "cf-region-code"],
      { headline },
    ),
    ...fact(
      "Country",
      where && joined([where.flag, where.name], " "),
      ["cf-ipcountry"],
      {
        headline,
      },
    ),
    ...fact("Postcode", header("cf-postal-code"), ["cf-postal-code"]),
    ...fact("Continent", CONTINENTS[header("cf-ipcontinent") ?? ""], [
      "cf-ipcontinent",
    ]),
    ...fact(
      "Coordinates",
      lat && lon && `${lat}, ${lon}`,
      ["cf-iplatitude", "cf-iplongitude"],
      {
        note: "Approximate, from the IP address.",
        href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`,
      },
    ),
    ...fact("Time zone", header("cf-timezone"), ["cf-timezone"]),
    ...fact("Cloudflare edge", colo, ["cf-ray"], {
      note: "Airport code of the data center that took the request, usually the nearest one.",
    }),
    ...fact("Loaded as", FETCH_DEST[header("sec-fetch-dest") ?? ""], [
      "sec-fetch-dest",
    ]),
    ...fact("Came from", FETCH_SITE[header("sec-fetch-site") ?? ""], [
      "sec-fetch-site",
    ]),
    ...fact(
      "Started by",
      header("sec-fetch-user") === "?1" ? "A click" : undefined,
      ["sec-fetch-user"],
    ),
    ...fact("Languages", languages(header("accept-language")), [
      "accept-language",
    ]),
    ...fact(
      "Connection",
      joined(
        [
          header("ect")?.toUpperCase(),
          header("rtt") && `${header("rtt")} ms round trip`,
          header("downlink") && `${header("downlink")} Mbps`,
        ],
        ", ",
      ),
      ["ect", "rtt", "downlink"],
    ),
    ...fact("Protocol", scheme?.toUpperCase(), [
      "x-forwarded-proto",
      "cf-visitor",
    ]),
    ...fact("Via", header("via"), ["via"]),
    ...fact("Image formats", imageFormats(header("accept")), ["accept"]),
    ...fact("Compression", header("accept-encoding"), ["accept-encoding"]),
    ...fact("Color scheme", colorScheme && sentence(colorScheme), [
      "sec-ch-prefers-color-scheme",
    ]),
    ...fact(
      "Reduced motion",
      unquote(header("sec-ch-prefers-reduced-motion")) === "reduce"
        ? "On"
        : undefined,
      ["sec-ch-prefers-reduced-motion"],
    ),
    ...fact("Data saver", header("save-data") === "on" ? "On" : undefined, [
      "save-data",
    ]),
    ...fact("Do Not Track", header("dnt") === "1" ? "On" : undefined, ["dnt"]),
    ...fact(
      "Global Privacy Control",
      header("sec-gpc") === "1" ? "On" : undefined,
      ["sec-gpc"],
    ),
  );

  return { kind, summary, title, subtitle, place, facts };
}
