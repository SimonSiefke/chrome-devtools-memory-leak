import { main } from "../shared/index.js";

const playwrightPath = new URL(
  "./node_modules/playwright/index.mjs",
  import.meta.url
).toString();

main(playwrightPath);
