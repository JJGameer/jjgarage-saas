const axios = require("axios");
const fs = require("fs");
const path = require("path");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9",
};

async function fetchText(url) {
  const response = await axios.get(url, {
    headers: HEADERS,
    timeout: 20000,
    validateStatus: () => true,
  });
  return { status: response.status, data: String(response.data || "") };
}

async function main() {
  const pages = [
    "https://www.liqui-moly.com/pt/pt/servico/guia-de-oleos.html",
    "https://www.liqui-moly.com/pt/pt/",
    "https://www.liqui-moly.com/pt/pt/customer/account/login/",
  ];

  const hints = new Set();

  for (const page of pages) {
    const { status, data } = await fetchText(page);
    console.log("PAGE", status, page);

    const scripts = [...data.matchAll(/<script[^>]+src="([^"]+)"/gi)].map(
      (match) => match[1],
    );
    console.log("scripts", scripts.slice(0, 8));

    for (const match of data.matchAll(
      /(?:api|license|licence|matric|plate|vehicle|vin|kba|search)[a-zA-Z0-9/_\-?=.&]{3,120}/gi,
    )) {
      hints.add(match[0]);
    }
  }

  console.log("\nHTML hints:");
  console.log([...hints].slice(0, 40).join("\n"));

  const jsUrls = [
    "https://www.liqui-moly.com/static/version1749641234/frontend/LiquiMoly/default/pt_PT/requirejs/require.js",
  ];

  for (const page of pages) {
    const { data } = await fetchText(page);
    for (const match of data.matchAll(/src="(\/static\/[^"]+\.js)"/gi)) {
      jsUrls.push(`https://www.liqui-moly.com${match[1]}`);
    }
  }

  const uniqueJs = [...new Set(jsUrls)].slice(0, 12);
  console.log("\nFetching JS bundles:", uniqueJs.length);

  for (const jsUrl of uniqueJs) {
    try {
      const { status, data } = await fetchText(jsUrl);
      if (status >= 400) continue;

      const apiMatches = [
        ...data.matchAll(
          /["'`]([^"'`]*(?:license|licence|matric|plate|vehicle|kba|vin)[^"'`]*)["'`]/gi,
        ),
      ]
        .map((match) => match[1])
        .filter((value) => value.length < 120);

      if (apiMatches.length) {
        console.log("\nJS", jsUrl.split("/").slice(-2).join("/"));
        console.log([...new Set(apiMatches)].slice(0, 20).join("\n"));
      }
    } catch (error) {
      console.log("JS ERR", jsUrl, error.message);
    }
  }
}

main().catch(console.error);
