// backend/loadData.js
require("dotenv").config();
const fs       = require("fs");
const csv      = require("csv-parser");
const mongoose = require("mongoose");
const Rating   = require("./models/Rating");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // 1. Clear existing
  await Rating.deleteMany({});
  console.log("🗑 Cleared existing ratings");

  // 2. Read & filter CSV rows
  const rows = [];
  let headers;

  fs.createReadStream("ratings.csv")  // or "ratings2.csv"—use whichever has your data
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on("headers", (h) => {
      headers = h;
      console.log("🔖 Detected headers:", headers);
    })
    .on("data", (row) => {
      // Find keys (case-insensitive)
      const findKey = name =>
        headers.find(h => h.toLowerCase() === name.toLowerCase());

      const tsKey    = findKey("Timestamp");
      const scoreKey = findKey("Score");
      const countryKey = findKey("Country");
      const famHistKey = findKey("family_history");
      // You can add more fields if your model uses them

      // Derive Year from Timestamp
      let yearVal = null;
      if (tsKey && row[tsKey]) {
        const d = new Date(row[tsKey]);
        if (!isNaN(d)) {
          yearVal = String(d.getFullYear());
        }
      }

      const ratingVal = scoreKey ? parseFloat(row[scoreKey]) : NaN;

      // Skip rows missing a valid year or score
      if (!yearVal || isNaN(ratingVal)) {
        return;
      }

      // Build document
      const doc = {
        Country:        row[countryKey]?.trim(),
        Year:           yearVal,
        Rating:         ratingVal,
      };

      // Optional extra fields
      if (famHistKey) doc.family_history = row[famHistKey].trim();

      rows.push(doc);
    })
    .on("end", async () => {
      console.log(`🗂 ${rows.length} valid rows to import`);

      if (rows.length > 0) {
        await Rating.insertMany(rows, { ordered: false });
        console.log(`✅ Imported ${rows.length} rows into MongoDB`);
      } else {
        console.warn("⚠️ No rows imported — check your CSV headers & content");
      }
      mongoose.disconnect();
    })
    .on("error", (err) => {
      console.error("❌ CSV read error:", err);
    });
}

main().catch(err => {
  console.error("❌ Import script error:", err);
  process.exit(1);
});
