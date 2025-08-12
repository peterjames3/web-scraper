import puppeteer from "puppeteer";
import fs from 'fs/promises'

const scrapeWebsite = async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const allBooks: Array<Array<string>> = [];
  const maxPages: number = 50;
  const currentPage: number = 1; 

  // Navigate to the specified URL
  const urlToScrape: string = `http://books.toscrape.com/catalogue/page-${currentPage}.html`;
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
      const stock = book.querySelector(".instock.availability")
        ? "In Stock"
        : "Out of stock";
      const rating = book.querySelector('.star-rating')?.className.split(' ')[1]; 
      return { title, price, bookImage, bookUrl, stock, rating };
    });
  });
  //return books;
  try{
    await fs.writeFile( "books.json",  JSON.stringify(books, null, 2));
    console.log('JSON file saved as  books.json')
  }catch(error: unknown){
    return error;
  }

  await browser.close();
};
export default scrapeWebsite;
