const axios = require("axios");

async function main() {
  const mapUrl =
    "https://liquimoly.cloudimg.io/v7/https://www.liqui-moly.com/static/version1780406990/frontend/limo/base/pt_PT/requirejs-map.min.js?func=proxy&process=minify-js?func=proxy";
  const response = await axios.get(mapUrl, { timeout: 20000 });
  const map = String(response.data);

  for (const key of ["licenseplate", "Limo_Search", "oww"]) {
    const regex = new RegExp(`"[^"]*${key}[^"]*"`, "gi");
    const matches = [...new Set([...map.matchAll(regex)].map((m) => m[0]))];
    console.log(key, matches.slice(0, 10).join("\n"));
    console.log("");
  }
}

main().catch(console.error);
