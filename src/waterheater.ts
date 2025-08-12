// scraper.ts
import puppeteer, { Page } from "puppeteer";
import fs from "fs";

interface ProductUrl {
  name: string;
  url: string;
}

interface ProductDetails {
  specifications: Record<string, string>;
  description: string;
  price: string;
  availability: string;
  categories: string[];
  brands: string[];
}

export async function waterHeater() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to category page...");
    await page.goto(
      "https://solarshop.co.ke/buy-solar-water-heaters-in-kenya/",
      {
        waitUntil: "networkidle2",
        timeout: 90000,
      }
    );

    console.log("Extracting category title...");
    const categoryTitle = await page.evaluate(() => {
      const breadcrump = document.querySelector(".woocommerce-breadcrumb  ");
      if (!breadcrump) return null;

      const title =
        breadcrump.lastChild &&
        (breadcrump.lastChild as HTMLElement).textContent
          ? (breadcrump.lastChild as HTMLElement).textContent.trim()
          : "No title found";

      return title;
    });
    console.log(`Category: ${categoryTitle}`);

    await page.waitForSelector(" #primary ul.products > li.product-item", {
      timeout: 60000,
    });

    console.log("Auto-scrolling to load all products...");
    await autoScroll(page);

    console.log("Extracting product URLs...");
    const productUrls: ProductUrl[] = await page.evaluate(() => {
      const urls: ProductUrl[] = [];
      document
        .querySelectorAll("ul.products > li.product-item h2.product-title a")
        .forEach((link) => {
          urls.push({
            name: link.textContent.trim(),
            url: (link as HTMLAnchorElement).href,
          });
        });
      return urls;
    });

    if (productUrls.length === 0) {
      throw new Error("No products found — check selector or page structure.");
    }

    console.log(`Found ${productUrls.length} products`);
    console.log(`First product: ${productUrls[0].name}`);
    console.log(`First product link: ${productUrls[0].url}`);

    const detailedProducts: (ProductUrl & ProductDetails)[] = [];

    // Limit to first 2 for testing
    const urlsToScrape = productUrls.slice(0, 77);

    for (let i = 0; i < urlsToScrape.length; i++) {
      const productInfo = urlsToScrape[i];
      console.log(
        `Scraping ${i + 1}/${urlsToScrape.length}: ${productInfo.name}`
      );

      const productPage = await browser.newPage();
      try {
        await productPage.goto(productInfo.url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await productPage.waitForSelector("h1", { timeout: 30000 });

        const productDetails: ProductDetails = await productPage.evaluate(
          () => {
            const result: ProductDetails = {
              specifications: {},
              description: "",
              price: "",
              availability: "",
              categories: [],
              brands: [],
            };

            const priceEl = document.querySelector(
              "#primary .price ins .woocommerce-Price-amount  "
            );
            result.price = priceEl
              ? priceEl.textContent.trim()
              : "Price not found";

            const availabilityEl = document.querySelector(".stock");
            if (availabilityEl)
              result.availability = availabilityEl.textContent.trim();

            document.querySelectorAll("a[rel='tag']").forEach((cat) => {
              if (cat.textContent.trim())
                result.categories.push(cat.textContent.trim());
            });

            document.querySelectorAll(".posted_in a").forEach((brand) => {
              if (brand.textContent.trim())
                result.brands.push(brand.textContent.trim());
            });

            const descEl = document.querySelector(
              ".woocommerce-product-details__short-description"
            );
            if (descEl) result.description = descEl.textContent.trim();

            const table = document.querySelector("table");
            if (table) {
              table.querySelectorAll("tbody tr").forEach((row) => {
                const cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                  const key = cells[0].textContent.trim().replace(/\*+/g, "");
                  const value = cells[1].textContent.trim();
                  result.specifications[key] = value;
                }
              });
            }

            return result;
          }
        );

        detailedProducts.push({
          ...productInfo,
          ...productDetails,
        });
      } catch (error) {
        console.error(`Error scraping ${productInfo.name}:`, error);
        detailedProducts.push({
          ...productInfo,
          specifications: {},
          description: "",
          price: "Error",
          availability: "",
          categories: [],
          brands: [],
        });
      } finally {
        await productPage.close();
      }
    }

    const jsonData = {
      website: "SolarShop Kenya",
      baseUrl: "https://solarshop.co.ke/buy-solar-water-heaters-in-kenya/",
      category: categoryTitle,
      scrapedAt: new Date().toISOString(),
      //totalProducts: detailedProducts.length,
      //products: detailedProducts,
    };

    fs.writeFileSync(
      "water_heater_data.json",
      JSON.stringify(jsonData, null, 2)
    );
    console.log("✅ Data saved to water_heater_data.json");

    return detailedProducts;
  } catch (error) {
    console.error("❌ Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function autoScroll(page: Page): Promise<void> {
  let prevHeight = await page.evaluate(() => document.body.scrollHeight);
  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const currHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currHeight === prevHeight) break;
    prevHeight = currHeight;
  }
}
