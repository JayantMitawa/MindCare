import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";

// Map numeric codes → occupation labels
const occupationMapping = {
  0.2: "student",
  0.3: "house wife",
  0.5: "others",
  0.65: "business",
  0.8: "corporate",
};

const occupationList = Object.values(occupationMapping);

const BubblePlot = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    Papa.parse("data_trimmed.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const countMap = new Map(); // key: sleep-occupation → count
        const scoreMap = new Map(); // key: sleep-occupation → total score

        // Step 1: Filter rows
        const filtered = results.data.filter((row, index) => {
          const occCode = parseFloat(row.occupation);
          const occupationLabel = occupationMapping[occCode];

          return (
            occupationLabel &&
            !isNaN(parseFloat(row.sleep_hours)) &&
            !isNaN(parseFloat(row.score)) &&
            index % 100 === 0
          );
        });

        // Step 2: Count occurrences and accumulate scores
        filtered.forEach((row) => {
          const sleep = parseFloat(row.sleep_hours).toFixed(1);
          const occCode = parseFloat(row.occupation);
          const occupation = occupationMapping[occCode];
          const score = parseFloat(row.score);

          const key = `${sleep}-${occupation}`;
          countMap.set(key, (countMap.get(key) || 0) + 1);
          scoreMap.set(key, (scoreMap.get(key) || 0) + score);
        });

        // Step 3: Prepare bubble data
        const x = [];
        const y = [];
        const size = [];
        const color = [];
        const text = [];

        countMap.forEach((count, key) => {
          const [sleep, occupation] = key.split("-");
          const totalScore = scoreMap.get(key);
          const avgScore = totalScore / count;

          x.push(parseFloat(sleep));
          y.push(occupation);
          size.push(count * 4);
          color.push(avgScore);
          text.push(
            `Sleep Hour: ${sleep}<br>Occupation: ${occupation}<br>Count: ${count}<br>Avg. Score: ${avgScore.toFixed(2)}`
          );
        });

        setData([
          {
            x,
            y,
            text,
            mode: "markers",
            type: "scatter",
            marker: {
              size,
              sizemode: "area",
              sizeref:
                size.length > 0
                  ? 2.0 * Math.max(...size) / (100 ** 2)
                  : 1,
              sizemin: 4,
              color,
              colorscale: "RdYlGn",
              colorbar: {
                title: "Avg. Mental Health Score",
              },
            },
          },
        ]);
      },
    });
  }, []);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Occupation vs Sleep Hour – Bubble Plot
      </h1>
      <Plot
        data={data}
        layout={{
          title: {
            text: "Bubble Plot: Avg. Mental Health Score by Sleep Hour & Occupation",
            font: { color: "white" },
          },
          xaxis: {
            title: "Sleep Hours (2 to 12)",
            color: "white",
            tickmode: "linear",
            tick0: 2,
            dtick: 1,
            range: [1.5, 12.5],
          },
          yaxis: {
            title: "Occupation",
            type: "category",
            color: "white",
            categoryorder: "array",
            categoryarray: occupationList,
          },
          plot_bgcolor: "#111827",
          paper_bgcolor: "#111827",
          hovermode: "closest",
          showlegend: false,
          height: 600,
          width: 1000,
        }}
      />
    </div>
  );
};

export default BubblePlot;
