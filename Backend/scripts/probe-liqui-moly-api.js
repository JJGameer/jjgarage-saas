const axios = require("axios");

const CONFIG_URL =
  "https://liquimoly.cloudimg.io/v7/https://www.liqui-moly.com/static/version1780406990/frontend/limo/base/pt_PT/requirejs-config.min.js?func=proxy&process=minify-js?func=proxy";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "*/*",
};

async function probeUrl(url, label) {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      validateStatus: () => true,
    });
    const body =
      typeof response.data === "string"
        ? response.data.slice(0, 400)
        : JSON.stringify(response.data).slice(0, 400);
    console.log(`[${label}] ${response.status} ${url}`);
    console.log(body);
    console.log("");
  } catch (error) {
    console.log(`[${label}] ERR ${url} ${error.message}\n`);
  }
}

async function main() {
  const configResponse = await axios.get(CONFIG_URL, {
    headers: HEADERS,
    timeout: 20000,
  });
  const config = String(configResponse.data);

  const patterns = [
    /api\.liqui-moly\.com[^"'`\s]{0,120}/gi,
    /api\/v2\/oww[^"'`\s]{0,120}/gi,
    /license[^"'`\s]{0,120}/gi,
    /vehicle[^"'`\s]{0,120}/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...new Set([...config.matchAll(pattern)].map((m) => m[0]))];
    console.log(`Pattern ${pattern}:`, matches.slice(0, 15).join("\n"));
    console.log("");
  }

  const candidates = [
    "https://api.liqui-moly.com/api/v2/oww/109/PRT/POR/licenseplate/88TR11",
    "https://api.liqui-moly.com/api/v2/oww/109/PRT/POR/licenseplate?plate=88TR11",
    "https://api.liqui-moly.com/api/v2/oww/109/PRT/POR/licenseplate/88-TR-11",
    "https://api.liqui-moly.com/api/v2/oww/109/PRT/POR/licenseplates/88TR11",
    "https://api.liqui-moly.com/api/v2/oww/109/PRT/POR/vehicle/licenseplate/88TR11",
  ];

  for (const url of candidates) {
    await probeUrl(url, "API");
  }
}

main().catch(console.error);
