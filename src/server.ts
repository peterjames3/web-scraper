import express from "express";
//import scrapeWebsite from "./scraper.ts";
import { scrapeDetailedSolarPanels } from "./scrapeDetailedSolarPanels.ts";
import { InvertersData } from "./inverters.ts";
import { waterHeater } from "./waterheater.ts";
import { battery } from './battery.ts';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.get("/scrape", async (req, res) => {
  try {
    const data = await scrapeDetailedSolarPanels();
    res.status(200).json({
      message: "Scraping successful",
      total: data.length,
      data,
    });
  } catch (error) {
    console.log(`Scraping failed: ${error}`);
    res.status(500).json({
      error: "Scraping failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }

  // try {
  //   const data = await scrapeWebsite();
  //   res.status(200).json({ message: "Scraping successful", data });
  // } catch (error: unknown) {
  //   console.error("Error during scraping:", error);
  //   res.status(500).json({ message: "Scraping failed", error });
  // }
});

app.get("/inverters", async (req, res) => {
  try {
    const data = await InvertersData();
    res.status(200).json({
      message: "Inverters scraping successful",
      total: data.length,
      data,
    });
  } catch (error) {
    console.log(`Inverters scraping failed: ${error}`);
    res.status(500).json({
      error: "Inverters scraping failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/water-heater", async (req, res) => {
  try {
    const data = await waterHeater();
    res.status(200).json({
      message: "Water Heater scraping successful",
      total: data.length,
      data,
    });
  } catch (error) {
    console.log(`Water Heater scraping failed: ${error}`);
    res.status(500).json({
      error: "Water Heater scraping failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

//route for battery
app.get("/battery", async (req, res) => {
  try{
    const data = await battery();
    // Ensure data is an array or has a length property
    const total = Array.isArray(data) ? data.length : 0;
    res.status(200).json({
      message: "Battery scraping successful",
      total,
      data,
    });
  }catch(error){
    console.log(`Battery scraping failed: ${error}`);
    res.status(500).json({
      error: "Battery scraping failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }

  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
