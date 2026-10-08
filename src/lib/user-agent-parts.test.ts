import { expect, test } from "bun:test";

import { userAgentParts } from "~/lib/user-agent-parts";

/** Token -> meaning, so tests read like the table. */
const meanings = (...args: Parameters<typeof userAgentParts>) =>
  Object.fromEntries(
    userAgentParts(...args).map((part) => [part.token, part.meaning]),
  );

test("Mac platform tokens, frozen or real", () => {
  const mac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
  expect(meanings(mac)).toEqual({
    "Mozilla/5.0": "Sent by almost every browser, for historical reasons",
    Macintosh: "A Mac",
    "Intel Mac OS X 10_15_7": "macOS, version hidden",
    "AppleWebKit/537.36": "Compatibility token. The real engine is Blink",
    "KHTML, like Gecko": "Compatibility note, not a real engine",
    "Chrome/154.0.0.0": "Chrome 154",
    "Safari/537.36": "Compatibility token, not Safari",
  });
  expect(
    meanings(mac, { hintedSystem: "macOS 15.1.0" })["Intel Mac OS X 10_15_7"],
  ).toBe("Frozen, really macOS 15.1.0");
  expect(
    meanings("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) Safari/605.1.15")[
      "Intel Mac OS X 10_14_6"
    ],
  ).toBe("Mac OS X 10.14.6 on Intel");
});

test("Windows platform tokens", () => {
  const windows =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
  expect(meanings(windows)).toMatchObject({
    "Windows NT 10.0": "Windows 10 or 11",
    Win64: "64-bit Windows",
    x64: "Intel or AMD 64-bit processor",
  });
  expect(
    meanings(windows, { hintedSystem: "Windows 11" })["Windows NT 10.0"],
  ).toBe("Windows NT 10.0, really Windows 11");
  expect(
    meanings("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101")[
      "Windows NT 6.1"
    ],
  ).toBe("Windows 7");
});

test("in-app brackets and model codes", () => {
  expect(
    meanings(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone16,2;FBCR/Spark NZ;FBLC/en_GB]",
      { deviceName: "iPhone 15 Pro Max", modelCode: "iPhone16,2" },
    ),
  ).toMatchObject({
    "CPU iPhone OS 17_5 like Mac OS X": "iOS 17.5",
    "FBAN/FBIOS": "Facebook app: FBIOS",
    "FBDV/iPhone16,2": "Device: iPhone 15 Pro Max",
    "FBCR/Spark NZ": "Mobile carrier: Spark NZ",
    "FBLC/en_GB": "Language: English (UK)",
  });
  expect(
    meanings(
      "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007)",
      {
        deviceName: "Samsung Galaxy S23 Ultra",
        modelCode: "SM-S918B",
      },
    )["SM-S918B Build/UP1A.231005.007"],
  ).toBe("Device model, Samsung Galaxy S23 Ultra");
});
