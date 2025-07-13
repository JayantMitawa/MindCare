// backend/index.js
let globalScores = [];
let countryIndex = {};

require("dotenv").config();
const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const bodyParser   = require("body-parser");
const compression  = require("compression");

const Rating = require("./models/Rating");

const app  = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(compression());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🚀 Connected to MongoDB");

    // 🔧 Create indexes
   Rating.collection.createIndex({ Country: 1 });
Rating.collection.createIndex({ Rating: 1 });

(async () => {
  const allDocs = await Rating.find({ Rating: { $type: "number" } }).select("Rating Country -_id");

  globalScores = allDocs.map(r => r.Rating);

  // Build country → [ratings[]] map
  countryIndex = {};
  for (const doc of allDocs) {
    const country = doc.Country;
    if (!countryIndex[country]) countryIndex[country] = [];
    countryIndex[country].push(doc.Rating);
  }

  console.log(`⚡ Cached ${globalScores.length} ratings into memory`);
})();

  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// 1. Health check
app.get("/api/message", (req, res) => {
  res.json({ message: "Backend with MongoDB is up!" });
});

// 2. Paginated ratings
app.get("/api/ratings", async (req, res) => {
  const limit = parseInt(req.query.limit) || 1000;
  const skip  = parseInt(req.query.skip) || 0;

  try {
    const ratings = await Rating.find({})
      .skip(skip)
      .limit(limit)
      .select("Country Year Rating");
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings." });
  }
});

// 3. Cached country averages
let averageCache = null;

app.get("/api/ratings/average", async (req, res) => {
  if (averageCache) {
    return res.json(averageCache);
  }

  try {
    const agg = await Rating.aggregate([
      { $match: { Rating: { $type: "number" } } },
      { $group: {
          _id: "$Country",
          avg: { $avg: "$Rating" }
        }
      },
      { $project: {
          country: "$_id",
          rating: { $round: ["$avg", 2] },
          _id: 0
        }
      }
    ]);
    averageCache = agg;
    res.json(agg);
  } catch (err) {
    res.status(500).json({ error: "Failed to compute averages." });
  }
});

// 4. Predictor logic
function calculateRating(data) {
  let score = 0;
  const yesMaybeNo = v => v === "Yes" ? 1 : (v === "Maybe" ? 0.5 : 0);
  const copingMap   = { Yes: 1, No: 0 };
  const daysMap     = {
    "Goes out every day": 0,
    "1-14 days": 0.25,
    "15-30 days": 0.5,
    "31-60 days": 0.75,
    "more than 2 months": 1
  };
  const moodMap     = { High: 1, Medium: 0.5, Low: 0 };
  const occMap      = { Business: 0.65, Corporate: 0.8, Student: 0.2, Others: 0.5 };
  const interestMap = { Yes: 0, No: 1, Maybe: 0.5 };
  const careMap     = { Yes: 1, No: 0, Maybe: 0.5 };

  score += yesMaybeNo(data.Mental_Health_History) * 0.10;
  score += (copingMap[data.Coping_Struggles] || 0) * 0.10;
  score += yesMaybeNo(data.Growing_Stress) * 0.10;
  score += (moodMap[data.Mood_Swings] || 0) * 0.10;
  score += yesMaybeNo(data.Changes_Habits) * 0.10;
  score += yesMaybeNo(data.treatment) * 0.10;
  score += (daysMap[data.Days_Indoors] || 0) * 0.08;
  score += yesMaybeNo(data.family_history) * 0.07;
  score += yesMaybeNo(data.Social_Weakness) * 0.08;
  score += (interestMap[data.Work_Interest] || 0) * 0.05;
  score += (1 - (careMap[data.care_options] || 0)) * 0.02;
  score += (occMap[data.Occupation] || 0.10) * 0.10;

  return score;
}

function percentile(scores, v) {
  const above = scores.filter(x => v > x).length;
  return (above / scores.length) * 100;
}

app.post("/api/predict", async (req, res) => {
  try {
    const input = req.body;
    const score = calculateRating(input);

    const globalPct = percentile(globalScores, score);

    const countryScores = countryIndex[input.Country] || [];
    const countryPct = countryScores.length > 0
      ? percentile(countryScores, score)
      : null;

    res.json({
      score: parseFloat(score.toFixed(2)),
      globalPercent: parseFloat(globalPct.toFixed(1)),
      countryPercent: countryPct != null ? parseFloat(countryPct.toFixed(1)) : null
    });
  } catch (err) {
    console.error("❌ Prediction error:", err);
    res.status(500).json({ error: "Prediction failed." });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`📡 Backend listening on http://localhost:${PORT}`);
});
