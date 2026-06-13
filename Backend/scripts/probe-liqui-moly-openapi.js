const axios = require("axios");
const fs = require("fs");
const path = require("path");

const AUTH = Buffer.from("limo:limo").toString("base64");

async function fetchJs() {
  const urls = [
    "https://liquimoly.cloudimg.io/v7/https://www.liqui-moly.com/static/version1780406990/frontend/limo/base/pt_PT/Limo_Search/js/components/licenseplate.min.js?func=proxy&process=minify-js?func=proxy",
    "https://www.liqui-moly.com/static/version1780406990/frontend/limo/base/pt_PT/Limo_Search/js/components/licenseplate.min.js",
    "https://www.liqui-moly.com/static/version1780406990/frontend/limo/base/pt_PT/Limo_Search/js/components/licenseplate.js",
  ];

  for (const url of urls) {
    const response = await axios.get(url, {
      validateStatus: () => true,
      timeout: 20000,
    });
    console.log(response.status, url);
    if (response.status < 400) {
      const file = path.join(__dirname, "licenseplate.min.js");
      fs.writeFileSync(file, response.data);
      return String(response.data);
    }
  }

  return null;
}

async function probeApi() {
  const headers = {
    Authorization: `Basic ${AUTH}`,
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const candidates = [
    "https://openapi.liqui-moly.com/api/v2/oww/search/109/PRT/POR/1/licenseplate/88TR11",
    "https://openapi.liqui-moly.com/api/v2/oww/search/109/PRT/POR/1/licenseplate/88-TR-11",
    "https://openapi.liqui-moly.com/api/v2/oww/search/109/PRT/POR/1/licenseplates/88TR11",
    "https://openapi.liqui-moly.com/api/v2/oww/search/109/PRT/POR/1/88TR11",
    "https://openapi.liqui-moly.com/api/v2/oww/109/PRT/POR/licenseplate/88TR11",
    "https://openapi.liqui-moly.com/api/v2/oww/109/PRT/POR/1/licenseplate/88TR11",
  ];

  for (const url of candidates) {
    const response = await axios.get(url, {
      headers,
      validateStatus: () => true,
      timeout: 15000,
    });
    const body =
      typeof response.data === "string"
        ? response.data.slice(0, 300)
        : JSON.stringify(response.data).slice(0, 300);
    console.log(`\n[${response.status}] ${url}`);
    console.log(body);
  }
}

async function main() {
  const js = await fetchJs();
  if (js) {
    const hints = [
      ...js.matchAll(
        /(?:licenseplate|licensePlate|apiUrl|Authorization|fetch|ajax)[^;]{0,160}/gi,
      ),
    ]
      .map((match) => match[0])
      .slice(0, 25);
    console.log("\nJS hints:");
    console.log(hints.join("\n"));
  }

  await probeApi();
}

main().catch(console.error);
