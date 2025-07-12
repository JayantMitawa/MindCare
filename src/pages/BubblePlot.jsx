// BubblePlot.jsx
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";

const BubblePlot = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load CSV from public folder
    Papa.parse("data_trimmmed.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const rawData = results.data;

        // Create a map to count occurrences of each (income_bucket, score) pair
        const countMap = new Map();

        rawData.forEach((row) => {
          const incomeRaw = parseInt(row.income);
          const score = parseFloat(row.score); // Ensure column name matches exactly

          if (!isNaN(incomeRaw) && !isNaN(score)) {
            const incomeBucket = Math.floor(incomeRaw / 100) * 100;
            const key = `${incomeBucket}-${score.toFixed(1)}`; // toFixed to reduce float errors
            countMap.set(key, (countMap.get(key) || 0) + 1);
          }
        });

        const x = [];
        const y = [];
        const size = [];
        const text = [];

        countMap.forEach((count, key) => {
          const [income, score] = key.split("-").map(Number);
          x.push(income);
          y.push(score);
          size.push(count * 5); // scale bubble size
          text.push(`Income: ${income}<br>Score: ${score}<br>Count: ${count}`);
        });

        setData([
          {
            x,
            y,
            text,
            mode: "markers",
            marker: {
              size,
              color: size,
              colorscale: "Viridis",
              showscale: true,
              sizemode: "area",
              sizeref: 2.0 * Math.max(...size) / (100 ** 2), // adjust this for better scaling
              sizemin: 4,
            },
            type: "scatter",
          },
        ]);
      },
    });
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Mental Health Ratings vs Income</h1>
      <Plot
        data={data}
        layout={{
          title: "Bubble Plot of Mental Health Ratings vs Income",
          xaxis: { title: "Income (bucketed by 100)", zeroline: false },
          yaxis: { title: "Score (0–10)", zeroline: false },
          showlegend: false,
          height: 600,
          width: 900,
          hovermode: "closest",
        }}
      />
    </div>
  );
};

export default BubblePlot;
