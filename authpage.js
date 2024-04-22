import fs from "fs";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";

async function login(page, origin) {
  await page.goto(origin);
  await page.waitForSelector('input[name="email"]', { visible: true });

  // Fill in and submit login form.
  const emailInput = await page.$('input[name="email"]');
  await emailInput.type("fkarnagi@gmail.com");
  const passwordInput = await page.$('input[name="password"]');
  await passwordInput.type("password");
  await Promise.all([
    page.$eval(".form fv-plugins-bootstrap fv-plugins-framework", (form) =>
      form.submit()
    ),
    page.waitForNavigation(),
  ]);
}

async function logout(page, origin) {
  await page.goto(`${origin}/logout`);
}

(async () => {
  // Direct Puppeteer to open Chrome with a specific debugging port.
  const browser = await puppeteer.launch({
    // Set DEBUG environment variable if you want to see the tests in action.
    headless: process.env.DEBUG ? false : "new",
    slowMo: 50,
  });
  const page = await browser.newPage();

  // Setup the browser session to be logged into our site.
  await login(page, "https://app.resolve-technologies.com");

  // The local server is running on port 10632.
  const url = "https://app.resolve-technologies.com/admin/dashboard";

  // Direct Lighthouse to use the same Puppeteer page.
  // Disable storage reset so login session is preserved.
  const runnerResult = await lighthouse(
    url,
    { disableStorageReset: true },
    undefined,
    page
  );

  // `.report` is the HTML report as a string
  const reportHtml = runnerResult.report;
  fs.writeFileSync("auth.html", reportHtml);

  // `.lhr` is the Lighthouse Result as a JS object
  console.log("Report is done for", runnerResult.lhr.finalDisplayedUrl);
  console.log(
    "Performance score was",
    runnerResult.lhr.categories.performance.score * 100
  );

  await chrome.kill();
})();
