// BubblePlot.jsx
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";

const BubblePlot = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load CSV from public folder
    Papa.parse("/data_trimmmed.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const rawData = results.data;

        // Create a map to count occurrences of each (income, score) pair
        const countMap = new Map();

        rawData.forEach((row) => {
          const income = parseInt(row.income);
          const score = parseFloat(row.score);

          if (!isNaN(income) && !isNaN(score)) {
            const key = `${income}-${score}`;
            countMap.set(key, (countMap.get(key) || 0) + 1);
          }
        });

        const x = [];
        const y = [];
        const size = [];

        countMap.forEach((count, key) => {
          const [income, score] = key.split("-").map(Number);
          x.push(income);
          y.push(score);
          size.push(count * 5); // scale bubble size
        });

        setData([{ x, y, mode: "markers", marker: { size, color: size, colorscale: 'Viridis' }, type: "scatter" }]);
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
          xaxis: { title: "Income" },
          yaxis: { title: "Score" },
          showlegend: false,
          height: 600,
          width: 900,
        }}
      />
    </div>
  );
};

export default BubblePlot;
