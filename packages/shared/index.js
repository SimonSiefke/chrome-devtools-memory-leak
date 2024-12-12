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

export const main = async (playwrightPath) => {
  const remoteDebuggingPort = "9222";
  const headless = true;
  const { page, browser } = await launchBrowser(
    headless,
    remoteDebuggingPort,
    playwrightPath
  );
  await page.goto("https://example.com");
  await page.waitForLoadState("networkidle");
  await browser.close();
};
