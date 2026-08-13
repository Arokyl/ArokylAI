const { spawnSync } = require("node:child_process");

const files = process.argv.slice(2);
const checkCommand = process.platform === "win32" ? "where" : "command";
const checkArgs = process.platform === "win32" ? ["forge"] : ["-v", "forge"];
const check = spawnSync(checkCommand, checkArgs, { stdio: "ignore", shell: process.platform !== "win32" });

if (check.status !== 0) {
  console.warn("Skipping forge fmt: Foundry is not installed or forge is not on PATH.");
  process.exit(0);
}

const result = spawnSync("forge", ["fmt", ...files], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
