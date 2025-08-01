import express from "express";
import scrapeWebsite from "./scraper.ts";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.get("/scrape", async (req, res) => {
  try {
    const data = await scrapeWebsite();
    res.status(200).json({ message: "Scraping successful", data });
  } catch (error: unknown) {
    console.error("Error during scraping:", error);
    res.status(500).json({ message: "Scraping failed", error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
