import { expect, test } from "bun:test";

import { decodeVisit, type DecodedVisit } from "~/lib/decode-visit";

/** Label -> value, so tests read like the panel. */
const facts = (visit: DecodedVisit) =>
  Object.fromEntries(visit.facts.map((fact) => [fact.label, fact.value]));

test("Android model codes become marketing names", () => {
  const visit = decodeVisit(
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    null,
  );
  expect(visit.summary).toBe(
    "Samsung Galaxy S23 Ultra · Chrome Mobile 129 · Android 14",
  );
  expect(facts(visit)).toMatchObject({
    Make: "Samsung",
    Model: "Galaxy S23 Ultra",
    "Model code": "SM-S918B",
    Browser: "Chrome Mobile 129",
  });
});

test("client hints reveal what the reduced user agent hides", () => {
  const reduced =
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
  expect(facts(decodeVisit(reduced, null))).toMatchObject({
    Model: "Hidden",
    System: "Android",
  });

  const hinted = decodeVisit(reduced, {
    "sec-ch-ua-full-version-list":
      '"Chromium";v="129.0.6668.71", "Not=A?Brand";v="8.0.0.0", "Google Chrome";v="129.0.6668.71"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-model": '"SM-S918B"',
    "sec-ch-ua-platform": '"Android"',
    "sec-ch-ua-platform-version": '"14.0.0"',
  });
  expect(facts(hinted)).toMatchObject({
    Model: "Galaxy S23 Ultra",
    System: "Android 14.0.0",
    Browser: "Chrome Mobile 129.0.6668.71",
  });
});

test("frozen desktop versions aren't reported as real", () => {
  const mac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
  expect(decodeVisit(mac, null).summary).toBe("Mac · Chrome 154 · macOS");
  expect(
    facts(
      decodeVisit(mac, {
        "sec-ch-ua-platform": '"macOS"',
        "sec-ch-ua-platform-version": '"15.1.0"',
        "sec-ch-ua-arch": '"arm"',
      }),
    ),
  ).toMatchObject({
    System: "macOS 15.1.0",
    Processor: "Apple silicon",
  });

  expect(
    decodeVisit(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      null,
    ).summary,
  ).toBe("Chrome 131 · Windows 10 or 11");
});

test("in-app browsers name the exact iPhone", () => {
  const visit = decodeVisit(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.97;FBBV/609133282;FBDV/iPhone16,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBCR/Spark NZ;FBID/phone;FBLC/en_GB;FBOP/80]",
    null,
  );
  expect(visit.summary).toBe("iPhone 15 Pro Max · Facebook 470 · iOS 17.5");
  expect(facts(visit)).toMatchObject({
    "Model code": "iPhone16,2",
    "Pixel ratio": "3x",
    "App language": "English (UK)",
    Carrier: "Spark NZ",
  });
});

test("mail proxies and bots only say who they are", () => {
  const gmail = decodeVisit(
    "Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)",
    { "cf-ipcountry": "US", "cf-ray": "8c1d2e3f4a5b6c7d-SJC" },
  );
  expect(gmail.kind).toBe("email-proxy");
  expect(gmail).toMatchObject({
    title: "Gmail image proxy",
    subtitle: "Run by Google Inc. · Crawler",
    place: { title: "United States", subtitle: "🇺🇸 From the IP address" },
  });
  expect(facts(gmail)).not.toHaveProperty("System");
  expect(facts(gmail)).toMatchObject({
    "Run by": "Google Inc.",
    Country: "🇺🇸 United States",
    "Cloudflare edge": "SJC",
  });

  const snap = decodeVisit(
    "Snap URL Preview Service; bot; snapchat; https://developers.snap.com/robots",
    null,
  );
  expect(snap.kind).toBe("bot");
  expect(snap.summary).toBe("Snap URL Preview Service");
});

test("request headers decode into plain answers", () => {
  const visit = decodeVisit(null, {
    "cf-ipcountry": "NZ",
    "cf-region": "Canterbury",
    "cf-ipcity": "Christchurch",
    "accept-language": "en-NZ,en;q=0.9,mi;q=0.8",
    accept: "image/avif,image/webp,image/apng,*/*;q=0.8",
    "sec-fetch-dest": "image",
    "sec-fetch-site": "cross-site",
    "sec-gpc": "1",
  });
  expect(facts(visit)).toMatchObject({
    Languages: "English (New Zealand), English, Māori",
    "Image formats": "AVIF, WebP, APNG",
    "Loaded as": "An image inside a page or email",
    "Came from": "Another website",
    "Global Privacy Control": "On",
  });
  expect(visit.place).toEqual({
    title: "Christchurch",
    subtitle: "🇳🇿 Canterbury, New Zealand",
  });
});
