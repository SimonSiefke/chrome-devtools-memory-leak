import CDP from "chrome-remote-interface";

const launchBrowser = async (headless, remoteDebuggingPort, playwrightPath) => {
  const { chromium } = await import(playwrightPath);
  const browser = await chromium.launch({
    headless: headless,
    args: [`--remote-debugging-port=${remoteDebuggingPort}`],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  return {
    page,
    browser,
  };
};

const runDevtoolsCommands = async (commandCount, debuggingPort) => {
  const client = await CDP({
    host: "localhost",
    port: Number(debuggingPort),
  });
  const { promise, resolve } = Promise.withResolvers();
  client.Target.attachedToTarget(resolve);
  await client.Target.setAutoAttach({
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: true,
  });
  // @ts-ignore
  const { sessionId } = await promise;
  await client.Runtime.enable(sessionId);
  const mem = await client.Runtime.getHeapUsage(sessionId);

  console.log({ mem });
};

export const main = async (playwrightPath) => {
  const remoteDebuggingPort = "9222";
  const headless = process.argv.includes("--headless");
  const commandCount = 100_000;
  const { page, browser } = await launchBrowser(
    headless,
    remoteDebuggingPort,
    playwrightPath
  );
  await page.goto("https://example.com");
  await page.waitForLoadState("networkidle");
  await runDevtoolsCommands(commandCount, remoteDebuggingPort);
  await browser.close();
};
