import { expect, test } from "bun:test";

import { parseUserAgent, visitColumns } from "~/lib/user-agent";

test("desktop and mobile browsers", () => {
  expect(
    parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    ),
  ).toEqual({
    client: "Chrome 129",
    os: "macOS 10.15.7",
    device: "Desktop",
    kind: "browser",
  });

  expect(
    parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    ),
  ).toEqual({
    client: "Safari 18",
    os: "iOS 18.0",
    device: "Mobile",
    kind: "browser",
  });

  expect(
    parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    ).client,
  ).toBe("Edge 129");

  expect(
    parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ).device,
  ).toBe("Tablet");
});

test("mail image proxies are labelled, not mistaken for people", () => {
  const gmail = parseUserAgent(
    "Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)",
  );
  expect(gmail).toEqual({
    client: "Gmail image proxy",
    os: null,
    device: "Unknown",
    kind: "email-proxy",
  });
});

test("link preview bots", () => {
  const slack = parseUserAgent(
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  );
  expect(slack).toEqual({
    client: "Slack link preview",
    os: null,
    device: "Unknown",
    kind: "bot",
  });
  expect(parseUserAgent("curl/8.7.1").kind).toBe("bot");
});

test("missing user agent", () => {
  expect(parseUserAgent(null)).toEqual({
    client: null,
    os: null,
    device: "Unknown",
    kind: "unknown",
  });
});

test("stored click columns group by family and split out bots", () => {
  expect(
    visitColumns(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      "https://www.Instagram.com/p/abc",
    ),
  ).toEqual({
    isBot: false,
    client: "Safari",
    os: "iOS",
    device: "Mobile",
    refererHost: "instagram.com",
  });
  expect(visitColumns("Slackbot-LinkExpanding 1.0", null).isBot).toBe(true);
  expect(visitColumns(null, "not a url")).toMatchObject({
    isBot: true,
    refererHost: null,
  });
  expect(visitColumns("Mozilla/5.0 (Windows NT 10.0; Win64; x64) GoogleImageProxy", null).isBot).toBe(false);
});

test("HTTP libraries count as scripts", () => {
  for (const ua of ["node", "axios/1.7.2", "Go-http-client/2.0", "okhttp/4.12.0", "Mozilla/5.0 HeadlessChrome/129.0"]) {
    expect(parseUserAgent(ua).kind).toBe("bot");
  }
});
