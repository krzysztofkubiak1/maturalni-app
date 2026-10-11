// Uruchamia backend FastAPI (uvicorn) z wirtualnego środowiska w backend/.venv.
// Działa na Windowsie i na macOS/Linux. Wywoływane przez `npm run dev:api`.
//
// Port: zmienna API_PORT (domyślnie 8000). Jeśli 8000 jest zajęty przez
// osierocony proces, ustaw np. API_PORT=8010 i to samo w API_PROXY_TARGET
// oraz INTERNAL_API_URL w .env.local.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const backendDir = path.join(process.cwd(), "backend");
const port = process.env.API_PORT ?? "8000";
const pythonPath =
  process.platform === "win32"
    ? path.join(backendDir, ".venv", "Scripts", "python.exe")
    : path.join(backendDir, ".venv", "bin", "python");

if (!existsSync(pythonPath)) {
  console.error(
    [
      "",
      `Nie znaleziono środowiska Pythona: ${pythonPath}`,
      "",
      "Utwórz je jednorazowo:",
      "  cd backend",
      "  python -m venv .venv",
      process.platform === "win32"
        ? "  .venv\\Scripts\\python -m pip install -r requirements.txt"
        : "  .venv/bin/python -m pip install -r requirements.txt",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const child = spawn(
  pythonPath,
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", port],
  { cwd: backendDir, stdio: "inherit" },
);

// Sprzątanie: `uvicorn --reload` odpala proces potomny. Bez tego przy Ctrl+C
// worker potrafi zostać i trzymać port 8000. Ubijamy całe drzewo procesów.
let cleaning = false;
function cleanup() {
  if (cleaning) return;
  cleaning = true;
  if (child.pid) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, () => {
    cleanup();
    process.exit(0);
  });
}
process.on("exit", cleanup);

child.on("exit", (code) => process.exit(code ?? 0));
