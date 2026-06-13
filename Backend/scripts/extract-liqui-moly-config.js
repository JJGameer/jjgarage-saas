const axios = require("axios");
const fs = require("fs");
const path = require("path");

const PAGE =
  "https://www.liqui-moly.com/pt/pt/servico/guia-de-oleos.html";

async function main() {
  const response = await axios.get(PAGE, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    timeout: 20000,
  });

  const html = String(response.data);
  const initBlocks = [
    ...html.matchAll(
      /<script type="text\/x-magento-init">([\s\S]*?)<\/script>/gi,
    ),
  ].map((match) => match[1].trim());

  console.log("init blocks:", initBlocks.length);

  for (const [index, block] of initBlocks.entries()) {
    if (
      block.includes("ApiConfigOww") ||
      block.includes("license") ||
      block.includes("oww")
    ) {
      console.log(`\n--- BLOCK ${index} ---`);
      console.log(block.slice(0, 4000));
    }
  }

  const outPath = path.join(__dirname, "liqui-moly-oil-guide.html");
  fs.writeFileSync(outPath, html);
  console.log("\nSaved", outPath, html.length, "bytes");
}

main().catch(console.error);
