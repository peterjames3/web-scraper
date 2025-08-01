import puppeteer from "puppeteer";

const scrapeWebsite = async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Navigate to the specified URL
  const urlToScrape: string = "http://books.toscrape.com/";
  await page.goto(urlToScrape);

  //Set screen size to ensure proper rendering
  await page.setViewport({ width: 1080, height: 1024 });

  const books = await page.evaluate(() => {
    // Extract book titles and prices from the page
    const bookElements = document.querySelectorAll(".product_pod");
    return Array.from(bookElements).map((book) => {
      const bookImage =
        book.querySelector("img")?.getAttribute("src") || "No image";
      const bookUrl = book.querySelector("h3 a")?.getAttribute("href");
      const title =
        book.querySelector("h3 a")?.getAttribute("title") || "No title";
      const price =
        book.querySelector(".price_color")?.textContent || "No price";
      return { title, price, bookImage, bookUrl };
    });
  });
  return books;
  await browser.close();
};
export default scrapeWebsite;
