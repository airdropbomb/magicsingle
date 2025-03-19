const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; // 20-60 mins random delay

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadData(file) {
  try {
    const datas = fs.readFileSync(file, "utf8").replace(/\r/g, "").split("\n").filter(Boolean);
    if (datas?.length <= 0) {
      console.log(`No data found in ${file}`);
      return [];
    }
    return datas;
  } catch (error) {
    console.log(`File ${file} not found`);
    return [];
  }
}

async function runAccount(cookie, proxy) {
  try {
    let browserArgs = ["--no-sandbox", "--disable-setuid-sandbox"];
    let proxyUsername, proxyPassword, proxyIp, proxyPort;

    // Check if proxy is provided and valid
    if (proxy) {
      [proxyUsername, proxyPassword, proxyIp, proxyPort] = proxy.replace("http://", "").replace("@", ":").split(":");
      browserArgs.push(`--proxy-server=${proxyIp}:${proxyPort}`);
      console.log(`🌐 Using proxy: ${proxyIp}:${proxyPort}`);
    } else {
      console.log("🌐 No proxy provided. Using local IP...");
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: browserArgs,
    });
    const page = await browser.newPage();

    // Authenticate proxy if provided
    if (proxy && proxyUsername && proxyPassword) {
      await page.authenticate({ username: proxyUsername, password: proxyPassword });
    }

    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userEmail = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", (el) => el.innerText).catch(() => "Unknown");
    console.log(`📧 Logged in as: ${userEmail}`);

    let userCredits = await page.$eval("#creditBalance", (el) => el.innerText).catch(() => "Unknown");
    console.log(`💰 Current Credits: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", (buttons) => {
      const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (rollNowClicked) {
      console.log("✅ Starting roll daily...");
    }
    await delay(5000);

    const letsRollClicked = await page.$$eval("button", (buttons) => {
      const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Let's roll"));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (letsRollClicked) {
      await delay(5000);
      const throwDiceClicked = await page.$$eval("button", (buttons) => {
        const target = buttons.find((btn) => btn.innerText && btn.innerText.includes("Throw Dice"));
        if (target) {
          target.click();
          return true;
        }
        return false;
      });

      if (throwDiceClicked) {
        console.log("⏳ Waiting 60 seconds for dice animation...");
        await delay(60000);
        userCredits = await page.$eval("#creditBalance", (el) => el.innerText).catch(() => "Unknown");
        console.log(`💰 Updated Credits: ${userCredits}`);
      } else {
        console.log("⚠️ 'Throw Dice' button not found.");
      }
    } else {
      const timerText = await page.evaluate(() => {
        const h2Elements = Array.from(document.querySelectorAll("h2"));
        for (let h2 of h2Elements) {
          const text = h2.innerText.trim();
          if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
            return text;
          }
        }
        return null;
      });

      if (timerText) {
        console.log(`⏱ Time Left until next ROLL: ${timerText}`);
      } else {
        console.log("⚠️ No timer found. Using default sleep time.");
      }
    }
    await browser.close();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

(async () => {
  console.clear();
  console.log(`Tool modified by the Telegram group: https://t.me/airdropbombnode`);
  console.log("🚀 Starting Puppeteer Bot...");
  const data = loadData("data.txt");
  const proxies = loadData("proxy.txt");

  while (true) {
    try {
      console.log("🔄 New cycle started...");
      for (let i = 0; i < data.length; i++) {
        const cookie = {
          name: "__Secure-next-auth.session-token",
          value: data[i],
          domain: ".magicnewton.com",
          path: "/",
          secure: true,
          httpOnly: true,
        };
        const proxy = proxies[i] || null; // Set proxy to null if undefined
        await runAccount(cookie, proxy);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`🔄 Cycle complete. Sleeping for 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();

// Banner
console.log(`
 █████╗ ██████╗ ██████╗     ███╗   ██╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔══██╗██╔══██╗    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
███████║██║  ██║██████╔╝    ██╔██╗ ██║██║   ██║██║  ██║█████╗  
██╔══██║██║  ██║██╔══██╗    ██║╚██╗██║██║   ██║██║  ██║██╔══╝  
██║  ██║██████╔╝██████╔╝    ██║ ╚████║╚██████╔╝██████╔╝███████╗
╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝   
            ${chalk.yellow('magicnewton')}                
📢  ${chalk.yellow('Telegram Channel: https://t.me/airdropbombnode')}
`);
