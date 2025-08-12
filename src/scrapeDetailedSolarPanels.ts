// scraper.js
import puppeteer from "puppeteer";
import fs from "fs";
import { Page } from "puppeteer";

export async function scrapeDetailedSolarPanels() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to the main website...");
    await page.goto("https://solarshop.co.ke/buy-solar-panels-in-kenya/", {
      waitUntil: "networkidle2",
      timeout: 90000,
    });

    console.log("Page loaded. Waiting for product selector...");
    await page.waitForSelector("li.product-item", { timeout: 60000 });

    console.log("Scraping product URLs...");
    await autoScroll(page);

    const productUrls = await page.evaluate(() => {
      const productElements = document.querySelectorAll("li.product-item");
    interface ProductUrl {
      name: string;
      url: string;
    }
    const urls: ProductUrl[] = [];

      productElements.forEach((product, index) => {
        try {
          const nameLinkElement = product.querySelector("h2.product-title a");
          if (nameLinkElement) {
            urls.push({
              name: nameLinkElement.textContent.trim(),
              url: (nameLinkElement as HTMLAnchorElement).href
            });
          }
        } catch (error) {
          console.log(`Error processing product ${index}:`, (error instanceof Error ? error.message : String(error)));
        }
      });

      return urls;
    });

    console.log(`Found ${productUrls.length} product URLs`);

    const detailedProducts = [];
    const urlsToScrape = productUrls.slice(0, 191);

    for (let i = 0; i < urlsToScrape.length; i++) {
      const productInfo = urlsToScrape[i];
      console.log(`Scraping product ${i + 1}/${urlsToScrape.length}: ${productInfo.name}`);
     
       const productPage = await browser.newPage(); // 🆕 create new page
      try {
        await page.goto(productInfo.url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await page.waitForSelector("h1", { timeout: 30000 });

        const productDetails = await page.evaluate(() => {
          const result: {
            specifications: { [key: string]: string },
            description: string,
            price: string,
            availability: string,
            categories: string[],
            brands: string[]
          } = {
            specifications: {},
            description: "",
            price: "",
            availability: "",
            categories: [],
            brands: []
          };

          // const priceElement = document.querySelector("ins .woocommerce-Price-amount.amount");
          // if (priceElement) {
          //   result.price = priceElement.textContent.trim();
          // }

           // Try <ins> selector (discounted price)
  let priceElement = document.querySelector("ins .woocommerce-Price-amount.amount");

  // If not found, fallback to <p class="price"> variant
  if (!priceElement) {
    priceElement = document.querySelector(".price .woocommerce-Price-amount.amount");
  }

  if (priceElement) {
    result.price = priceElement.textContent.trim();
  } else {
    result.price = "Price not found";
    console.warn("⚠️ No price found on page:", window.location.href);
  }


          const availabilityElement = document.querySelector(".stock");
          if (availabilityElement) {
            result.availability = availabilityElement.textContent.trim();
          }

          const categoryElements = document.querySelectorAll("a[rel='tag']");
          categoryElements.forEach(cat => {
            if (cat.textContent.trim()) {
              result.categories.push(cat.textContent.trim());
            }
          });

          const brandElements = document.querySelectorAll(".posted_in a");
          brandElements.forEach(brand => {
            if (brand.textContent.trim()) {
              result.brands.push(brand.textContent.trim());
            }
          });

          const descriptionElement = document.querySelector(".woocommerce-product-details__short-description");
          if (descriptionElement) {
            result.description = descriptionElement.textContent.trim();
          }

          const table = document.querySelector("table");
          if (table) {
            const rows = table.querySelectorAll("tbody tr");
            rows.forEach(row => {
              const cells = row.querySelectorAll("td");
              if (cells.length >= 2) {
                const key = cells[0].textContent.trim().replace(/\*+/g, "");
                const value = cells[1].textContent.trim();
                result.specifications[key] = value;
              }
            });
          }

          return result;
        });

        detailedProducts.push({
          name: productInfo.name,
          url: productInfo.url,
          ...productDetails
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`Error scraping ${productInfo.name}:`, (error instanceof Error ? error.message: String(error) ));
        detailedProducts.push({
          name: productInfo.name,
          url: productInfo.url,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const jsonData = {
      website: "SolarShop Kenya",
      baseUrl: "https://solarshop.co.ke/buy-solar-panels-in-kenya/",
      scrapedAt: new Date().toISOString(),
      totalProducts: detailedProducts.length,
      products: detailedProducts,
    };

    fs.writeFileSync("detailed_solar_panels_new_data.json", JSON.stringify(jsonData, null, 2));
    console.log("Saved to detailed_solar_panels_data.json");

    return detailedProducts;
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

interface AutoScrollPage extends Page {}

async function autoScroll(page: puppeteer.Page): Promise<void> {
  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  
  while (true) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (currentHeight === previousHeight) {
      console.log("✅ No more content to scroll. Breaking.");
      break;
    }

    previousHeight = currentHeight;
  }
}


