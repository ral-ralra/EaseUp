const fs = require("node:fs");
const path = require("node:path");

const srcRoot = path.resolve(__dirname, "..", "src", "assets");
const destRoot = path.resolve(__dirname, "..", "public", "wellness");

function stripSvgText(content) {
  return content.replace(/<text[\s\S]*?<\/text>/g, "");
}

function copyDir(relativeDir) {
  const from = path.join(srcRoot, relativeDir);
  const to = path.join(destRoot, relativeDir);
  fs.mkdirSync(to, { recursive: true });

  for (const file of fs.readdirSync(from)) {
    if (!file.endsWith(".svg")) continue;
    const raw = fs.readFileSync(path.join(from, file), "utf8");
    fs.writeFileSync(path.join(to, file), stripSvgText(raw), "utf8");
  }
}

copyDir("eye-exercise");
copyDir("stretching");
console.log("Wellness SVG assets copied to public/wellness/");
