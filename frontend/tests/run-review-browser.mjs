// npm run dev 실행 후: node tests/run-review-browser.mjs
// 외부 패키지 없이 설치된 Chrome과 Node.js의 WebSocket으로 검증한다.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const profile = await mkdtemp(path.join(tmpdir(), "oncare-review-check-"));
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; break; } catch { await sleep(100); }
  }
  if (!port) throw new Error("Chrome 디버깅 연결을 열지 못했습니다.");
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if (message.error) task.reject(message.error); else task.resolve(message.result); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const desktop = process.argv.includes("--desktop");
  await send("Emulation.setDeviceMetricsOverride", { width: desktop ? 1440 : 390, height: desktop ? 900 : 844, deviceScaleFactor: 1, mobile: !desktop });
  await send("Page.navigate", { url: "http://localhost:5173/tests/review.html" });
  let result;
  for (let i = 0; i < 200; i++) {
    await sleep(200);
    const evaluated = await send("Runtime.evaluate", { expression: "window.reviewTestResult", returnByValue: true });
    result = evaluated.result?.value;
    if (result) break;
  }
  if (!result) throw new Error("브라우저 검증 시간 초과: Vite와 /tests/review.html을 확인하세요.");
  console.log(JSON.stringify(result, null, 2));
  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  const screenshotPath = path.join(tmpdir(), desktop ? "oncare-review-desktop.png" : "oncare-review-mobile.png");
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  console.log(`화면 캡처: ${screenshotPath}`);
  if (result.error) process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill();
  await sleep(500);
  // mkdtemp으로 만든 이번 실행 전용 경로만 정리한다.
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(profile));
  if (relative.startsWith("oncare-review-check-") && !relative.includes(path.sep)) await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}
