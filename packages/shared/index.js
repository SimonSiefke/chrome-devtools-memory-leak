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

const setupCDP = async (remoteDebuggingPort) => {
  const client = await CDP({
    host: "localhost",
    port: Number(remoteDebuggingPort),
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
  return client;
};

const processBatch = async (
  client,
  startIndex,
  objectId,
  batchSize,
  commandCount
) => {
  const promises = [];
  const endIndex = Math.min(startIndex + batchSize, commandCount);
  for (let i = startIndex; i < endIndex; i++) {
    promises.push(
      client.Runtime.getProperties({
        objectId: objectId,
        ownProperties: true,
        generatePreview: false,
      })
    );
  }
  const result = await Promise.all(promises);
  return 123;
};

const runDevtoolsCommands = async (client, commandCount) => {
  const ref = await client.Runtime.evaluate({
    expression: "window",
    returnByValue: false,
  });
  const batchSize = 100;
  const objectId = ref.result.objectId;
  for (let i = 0; i < commandCount; i += batchSize) {
    console.log("processing batch", i);
    await processBatch(client, i, objectId, batchSize, commandCount);
  }
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
  await page.goto("https://vscode.dev");
  await page.waitForLoadState("networkidle");
  const client = await setupCDP(remoteDebuggingPort);
  await runDevtoolsCommands(client, commandCount);
  await browser.close();
};
