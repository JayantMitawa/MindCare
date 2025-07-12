import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Plot from "react-plotly.js";

const occupationMapping = {
  0.2: "Student",
  0.65: "Business",
  0.3: "House wife",
  0.8: "Corporate",
  0.5: "Others",
};

const BoxPlotChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch("/ratings2.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        const rows = parsed.data;

        // Group scores by mapped occupation
        const grouped = {};

        rows.forEach((row) => {
          const occStr = row["Occupation"]?.trim();
          const scoreStr = row["Ratings"]?.trim();

          if (
            occStr !== undefined &&
            occStr !== "" &&
            scoreStr !== undefined &&
            scoreStr !== "" &&
            !isNaN(occStr) &&
            !isNaN(scoreStr)
          ) {
            const occNum = parseFloat(occStr);
            const occupation = occupationMapping[occNum];

            if (occupation) {
              const score = parseFloat(scoreStr);
              if (!grouped[occupation]) {
                grouped[occupation] = [];
              }
              grouped[occupation].push(score);
            }
          }
        });

        // Prepare traces for Plotly
        const occupations = Object.values(occupationMapping);

        const traces = occupations.map((occ) => ({
          y: grouped[occ] || [],
          name: occ,
          type: "violin",
          points: false,                // ❌ hide individual scatter points
          box: { visible: true },       // ✅ show box inside violin
          meanline: { visible: true },  // ✅ show mean line
          scalemode: "count",
          width: 0.7,                   // ✅ make violins wider horizontally
          line: { width: 1 },
        }));

        setChartData(traces);
      });
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-8">
      <div className="w-full max-w-5xl bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Mental Health Score by Occupation
        </h2>

        {chartData ? (
          <Plot
            data={chartData}
            layout={{
              title: "Mental Health Ratings vs Occupation",
              yaxis: { title: "Score (0-10)", range: [0, 10] },
              violinmode: "group",
              margin: { t: 50, l: 50, r: 50, b: 100 },
              autosize: true,
            }}
            style={{ width: "100%", height: "600px" }}
            config={{ responsive: true }}
          />
        ) : (
          <div className="text-center text-gray-500">Loading chart...</div>
        )}
      </div>
    </div>
  );
};

export default BoxPlotChart;
