import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { FiRefreshCw, FiInfo, FiGlobe, FiBarChart2, FiX, FiHeart, FiPlay, FiPause } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const Map = () => {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryA, setCountryA] = useState("");
  const [countryB, setCountryB] = useState("");
  const [nameToId, setNameToId] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });
  const [rawRows, setRawRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [showInfo, setShowInfo] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [year, setYear] = useState(2023);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState(null); // Added for better tooltip handling

  const mentalHealthFacts = [
    "1 in 4 people worldwide will be affected by mental disorders at some point in their lives",
    "Depression is the leading cause of disability worldwide",
    "Mental health conditions cost the global economy $1 trillion per year in lost productivity",
    "Suicide is the 4th leading cause of death among 15-29 year-olds globally",
    "People with severe mental disorders die 10-20 years earlier than the general population",
    "Only 2% of health budgets globally are allocated to mental health care",
    "Anxiety disorders affect 284 million people worldwide",
    "Women are nearly twice as likely as men to be diagnosed with depression",
    "75% of mental disorders begin before the age of 24",
    "Mental health conditions can increase the risk of physical health problems"
  ];

  const tourSteps = [
    {
      title: "Welcome to the Mental Health Dashboard",
      content: "This interactive visualization helps you explore global mental health trends. Let's take a quick tour!",
      position: "center"
    },
    {
      title: "World Map View",
      content: "This heatmap shows mental health ratings worldwide. Yellow indicates lower ratings, orange medium, and red higher ratings.",
      position: "top"
    },
    {
      title: "Country Comparison",
      content: "Select two countries to compare their mental health ratings across demographics",
      position: "top"
    },
    {
      title: "Demographic Insights",
      content: "This treemap breaks down ratings by gender, occupation, and family history",
      position: "bottom"
    },
    {
      title: "Explore Mental Health Facts",
      content: "Discover important statistics and resources about mental health",
      position: "right"
    }
  ];

  useEffect(() => {
    const factTimer = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % mentalHealthFacts.length);
    }, 8000);
    
    return () => clearInterval(factTimer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setYear(prev => {
          const nextYear = prev + 1;
          if (nextYear > 2023) {
            setIsPlaying(false);
            return 2023;
          }
          return nextYear;
        });
      }, 1500);
    }
    
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying]);

  const OCC_MAP = {
    "0.2": "Student",
    "0.3": "Housecaretaker",
    "0.5": "Others",
    "0.65": "Business",
    "0.8": "Corporate",
  };

  const FH_MAP = {
    "0": "No",
    "0.5": "Maybe",
    "1": "Yes",
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load geography data
        const topoRes = await fetch(geoUrl);
        const topoJson = await topoRes.json();
        const geoData = feature(topoJson, topoJson.objects.countries).features;
        setCountries(geoData);

        const mapping = {};
        geoData.forEach((d) => {
          const name = d.properties.name;
          const id = d.id?.toString().padStart(3, "0");
          if (name && id) mapping[name] = id;
        });
        setNameToId(mapping);

        // Load CSV data
        const rows = await d3.csv("ratings2.csv", d3.autoType);
        setRawRows(rows);
        
        const grouped = d3.groups(rows, (d) => d.Country);
        const averaged = grouped.map(([country, records]) => {
          const scores = records.map((r) => +r.Ratings).filter((s) => !isNaN(s));
          const avg = d3.mean(scores);
          const id = mapping[country];
          if (!id || isNaN(avg)) return null;
          return { id, country, rating: +avg.toFixed(2) };
        });
        setData(averaged.filter((d) => d !== null));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const width = 960;
  const height = 500;
  const projection = d3.geoMercator().scale(120).translate([width / 2, height / 2]);
  const pathGenerator = d3.geoPath().projection(projection);
  
  // Fixed color scale from yellow to red
  const colorScale = useMemo(() => 
    d3.scaleSequential()
      .domain([1, 5])
      .interpolator(d3.interpolateYlOrRd), 
    []
  );

  const getRating = (name) => {
    const entry = data.find((d) => d.country === name);
    return entry ? entry.rating : "N/A";
  };

  // Updated to sort by respondent count (size)
  const prepareTreeData = () => {
    const selectedCountries = new Set([countryA, countryB]);
    const hierarchy = { name: "root", children: [] };

    const byCountry = d3.groups(
      rawRows.filter((d) => selectedCountries.has(d.Country)),
      (d) => d.Country,
      (d) => d.Gender,
      (d) => d.Occupation,
      (d) => String(d.family_history)
    );

    for (const [country, genderGroups] of byCountry) {
      const countryNode = { name: country, children: [] };
      for (const [gender, occupationGroups] of genderGroups) {
        const genderNode = { name: gender, children: [] };
        for (const [occupation, fhGroups] of occupationGroups) {
          const occupationNode = { 
            name: OCC_MAP[occupation] || occupation, 
            children: [] 
          };
          for (const [fh, records] of fhGroups) {
            const scores = records.map((r) => +r.Ratings).filter((s) => !isNaN(s));
            const avg = d3.mean(scores);
            occupationNode.children.push({
              name: `Family History: ${FH_MAP[fh] || fh}`,
              size: scores.length,
              rating: avg,
              gender,
              occupation: OCC_MAP[occupation] || occupation,
              country,
              fh: FH_MAP[fh] || fh,
            });
          }
          // Sort children by size (respondent count) descending
          occupationNode.children.sort((a, b) => b.size - a.size);
          genderNode.children.push(occupationNode);
        }
        countryNode.children.push(genderNode);
      }
      hierarchy.children.push(countryNode);
    }
    return hierarchy.children;
  };

  const resetSelection = () => {
    setCountryA("");
    setCountryB("");
  };

  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
  };

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const InfoModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => setShowInfo(false)}
          className="absolute top-4 right-4 text-violet-700 hover:text-violet-900"
        >
          <FiX size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-violet-800 mb-4 flex items-center">
          <FiInfo className="mr-2" /> About This Visualization
        </h2>
        
        <div className="space-y-4 text-gray-700">
          <p>
            This interactive dashboard visualizes mental health ratings across different countries 
            and demographic groups. The data is sourced from a global survey of mental health indicators.
          </p>
          
          <h3 className="font-semibold text-lg text-violet-700">Features:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-medium">World Map:</span> Heatmap showing average mental health ratings per country</li>
            <li><span className="font-medium">Country Comparison:</span> Select two countries to compare their ratings</li>
            <li><span className="font-medium">Demographic Analysis:</span> Treemap breakdown by gender, occupation, and family history</li>
            <li><span className="font-medium">Data Storytelling:</span> Interactive tour and timeline visualization</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-violet-700">Data Interpretation:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Higher ratings (darker red) indicate better mental health outcomes</li>
            <li>Lower ratings (yellow/orange) indicate areas needing more mental health support</li>
            <li>Treemap size represents the number of respondents in each category</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const TourModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 to-red-500 rounded-t-xl"></div>
        
        <div className="text-center mb-6">
          <div className="text-sm text-violet-700 mb-2">Step {tourStep + 1} of {tourSteps.length}</div>
          <h2 className="text-2xl font-bold text-violet-800">{tourSteps[tourStep].title}</h2>
        </div>
        
        <div className="text-gray-700 mb-8 text-center">
          {tourSteps[tourStep].content}
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className={`px-4 py-2 rounded-lg ${
              tourStep === 0 
                ? "bg-gray-200 text-gray-500" 
                : "bg-violet-100 hover:bg-violet-200 text-violet-700"
            }`}
          >
            Previous
          </button>
          
          <button 
            onClick={nextTourStep}
            className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-lg"
          >
            {tourStep === tourSteps.length - 1 ? "Finish Tour" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-700 mx-auto"></div>
          <p className="mt-4 text-lg text-violet-800 font-medium">Loading world data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-red-50 min-h-screen px-4 py-6 font-sans relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-violet-900 flex items-center">
              <FiHeart className="mr-3 text-red-600" />
              Global Mental Health Dashboard
            </h1>
            <p className="text-violet-700 mt-2">
              Interactive visualization of mental health ratings worldwide
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={startTour}
              className="flex items-center bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlay className="mr-2" /> Take Tour
            </button>
            <button 
              onClick={() => setShowInfo(true)}
              className="flex items-center bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-lg transition-colors"
            >
              <FiInfo className="mr-2" /> About
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          >
            <div className="flex border-b">
              <button
                className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${
                  activeTab === "map" 
                    ? "text-violet-800 border-b-2 border-violet-800" 
                    : "text-gray-500 hover:text-violet-700"
                }`}
                onClick={() => setActiveTab("map")}
              >
                <FiGlobe /> World Map
              </button>
              <button
                className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${
                  activeTab === "comparison" 
                    ? "text-violet-800 border-b-2 border-violet-800" 
                    : "text-gray-500 hover:text-violet-700"
                }`}
                onClick={() => setActiveTab("comparison")}
              >
                <FiBarChart2 /> Country Comparison
              </button>
            </div>

            <div className="p-4 md:p-6">
              {activeTab === "map" && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-2/3">
                    <div className="bg-violet-50 rounded-xl p-4 mb-6">
                      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-violet-900">
                          🌍 Mental Health Rating Heatmap
                        </h2>
                        
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-violet-200">
                          <span className="text-violet-800 text-sm">Timeline:</span>
                          <input
                            type="range"
                            min="2018"
                            max="2023"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-32 accent-violet-700"
                          />
                          <span className="text-violet-800 font-medium w-12">{year}</span>
                          <button 
                            onClick={togglePlay}
                            className="text-violet-700 hover:text-violet-900"
                          >
                            {isPlaying ? <FiPause /> : <FiPlay />}
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-violet-800 mb-4">
                        Color intensity represents average mental health rating (yellow = low, orange = medium, red = high)
                      </p>
                      
                      <div className="bg-black rounded-xl shadow-inner mb-6 overflow-auto">
                        <svg
                          width={width}
                          height={height}
                          onMouseMove={(e) => {
                            const rect = e.target.getBoundingClientRect();
                            setTooltip({
                              visible: hoveredCountry !== null,
                              x: e.clientX + 10,
                              y: e.clientY + 10,
                              content: hoveredCountry 
                                ? `${hoveredCountry.name}: ${hoveredCountry.rating?.toFixed(2) ?? "N/A"}`
                                : ""
                            });
                          }}
                          onMouseLeave={() => {
                            setTooltip({ visible: false, x: 0, y: 0, content: "" });
                            setHoveredCountry(null);
                          }}
                        >
                          {countries.map((country) => {
                            const id = country.id?.toString().padStart(3, "0");
                            if (!id) return null;
                            const name = country.properties.name;
                            const datum = data.find((d) => d.country === name);
                            const rating = datum?.rating;
                            const fill = rating ? colorScale(rating) : "#ffe4e8";

                            return (
                              <motion.path
                                key={id}
                                d={pathGenerator(country)}
                                fill={fill}
                                stroke="#fff"
                                strokeWidth={0.5}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => {
                                  setHoveredCountry({ name, rating });
                                  setTooltip({
                                    visible: true,
                                    x: tooltip.x,
                                    y: tooltip.y,
                                    content: `${name}: ${rating?.toFixed(2) ?? "N/A"}`
                                  });
                                }}
                                onMouseLeave={() => setHoveredCountry(null)}
                                whileHover={{ strokeWidth: 1.5, stroke: "#ff1a5e" }}
                              />
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex flex-col items-center max-w-lg mx-auto mt-4">
                        <div className="w-full h-4 rounded-full overflow-hidden flex mb-1">
                          {[...Array(100)].map((_, i) => (
                            <div 
                              key={i} 
                              className="flex-1 h-full"
                              style={{ backgroundColor: colorScale(1 + (4 * i / 100)) }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between w-full text-xs text-gray-600">
                          <span>1.0</span>
                          <span>Low to High</span> {/* Updated text */}
                          <span>5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:w-1/3">
                    <div className="bg-gradient-to-b from-violet-100 to-red-100 rounded-xl p-6 h-full">
                      <div className="flex items-center mb-4">
                        <FiInfo className="text-violet-800 mr-2" />
                        <h3 className="text-xl font-bold text-violet-900">Mental Health Facts</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <motion.div 
                          key={currentFactIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="relative bg-white p-4 rounded-lg shadow-sm border border-violet-200"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-600 to-red-500 rounded-l"></div>
                          <div className="ml-3">
                            <p className="text-violet-900 font-medium">
                              {mentalHealthFacts[currentFactIndex]}
                            </p>
                            <p className="text-xs text-violet-600 mt-2">Source: World Health Organization</p>
                          </div>
                        </motion.div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-200">
                            <div className="text-3xl font-bold text-violet-800 mb-1">284M</div>
                            <div className="text-xs text-violet-700">People affected by anxiety disorders</div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-200">
                            <div className="text-3xl font-bold text-violet-800 mb-1">10-20</div>
                            <div className="text-xs text-violet-700">Years earlier death for severe mental disorders</div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-200 mt-4">
                          <h4 className="font-bold text-violet-800 mb-2">Mental Health Resources</h4>
                          <ul className="text-sm text-violet-700 space-y-1">
                            <li>• <a href="#" className="hover:underline">WHO Mental Health Atlas</a></li>
                            <li>• <a href="#" className="hover:underline">National Alliance on Mental Illness</a></li>
                            <li>• <a href="#" className="hover:underline">Mental Health First Aid</a></li>
                            <li>• <a href="#" className="hover:underline">Crisis Text Line</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "comparison" && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-violet-100 to-red-100 p-6 rounded-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                      <h2 className="text-xl font-bold text-violet-900">
                        📊 Compare Mental Health Ratings
                      </h2>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={resetSelection}
                          className="flex items-center bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <FiRefreshCw className="mr-2" /> Reset Selection
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="flex-1">
                        <label className="block text-violet-800 font-medium mb-2">
                          Select First Country
                        </label>
                        <select 
                          className="w-full p-3 rounded-lg border border-violet-300 bg-white text-violet-900 shadow-sm focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                          value={countryA}
                          onChange={(e) => setCountryA(e.target.value)}
                        >
                          <option value="">Choose a country</option>
                          {data.map((d) => (
                            <option key={d.id} value={d.country}>
                              {d.country}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-violet-800 font-medium mb-2">
                          Select Second Country
                        </label>
                        <select 
                          className="w-full p-3 rounded-lg border border-violet-300 bg-white text-violet-900 shadow-sm focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                          value={countryB}
                          onChange={(e) => setCountryB(e.target.value)}
                        >
                          <option value="">Choose a country</option>
                          {data.map((d) => (
                            <option key={d.id} value={d.country}>
                              {d.country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {countryA && countryB && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-5 rounded-xl shadow border border-violet-100">
                          <h3 className="font-bold text-lg text-violet-800 mb-2">{countryA}</h3>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-violet-900">
                              {getRating(countryA)}
                            </span>
                            <span className="text-gray-500 mb-1">/ 5.0</span>
                          </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-xl shadow border border-violet-100">
                          <h3 className="font-bold text-lg text-violet-800 mb-2">{countryB}</h3>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-violet-900">
                              {getRating(countryB)}
                            </span>
                            <span className="text-gray-500 mb-1">/ 5.0</span>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2 bg-violet-50 p-5 rounded-xl">
                          <h4 className="font-semibold text-violet-800 mb-2">Comparison Summary</h4>
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-violet-600 to-red-500 rounded-full"
                                  style={{ width: `${(getRating(countryA) / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="mx-4 font-bold text-violet-900">
                              {Math.abs(getRating(countryA) - getRating(countryB)).toFixed(2)}
                            </div>
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-500 to-violet-600 rounded-full"
                                  style={{ width: `${(getRating(countryB) / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1 text-sm text-gray-600">
                            <span>Difference</span>
                            <span>
                              {getRating(countryA) > getRating(countryB) ? countryA : countryB} has higher rating
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {countryA && countryB && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-violet-700 to-red-600 p-5">
                        <h3 className="text-xl font-bold text-white">
                          🧩 Demographic Breakdown
                        </h3>
                        <p className="text-violet-100">
                          Mental health ratings by gender, occupation and family history
                        </p>
                      </div>
                      
                      <div className="p-4 md:p-6">
                        <ResponsiveContainer width="100%" height={400}>
                          <Treemap
                            width={800}
                            height={400}
                            data={prepareTreeData()}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            sortBySize={true}
                            content={({ x, y, width, height, name, rating, gender, occupation, country, size }) => {
                              const fillColor = rating ? colorScale(rating) : "#ffd6e0";
                              const shouldDisplayText = width > 100 && height > 40;

                              return (
                                <g>
                                  <rect 
                                    x={x} 
                                    y={y} 
                                    width={width} 
                                    height={height} 
                                    fill={fillColor} 
                                    stroke="#fff" 
                                    rx="4"
                                    ry="4"
                                  />
                                  {shouldDisplayText && (
                                    <>
                                      <text 
                                        x={x + 8} 
                                        y={y + 20} 
                                        fontSize={12} 
                                        fill="#000" 
                                        fontWeight="500"
                                      >
                                        {country}
                                      </text>
                                      <text 
                                        x={x + 8} 
                                        y={y + 38} 
                                        fontSize={11} 
                                        fill="#333"
                                      >
                                        {gender} • {occupation}
                                      </text>
                                      <text 
                                        x={x + 8} 
                                        y={y + 56} 
                                        fontSize={11} 
                                        fill="#333"
                                      >
                                        {name}
                                      </text>
                                      <text 
                                        x={x + 8} 
                                        y={y + 74} 
                                        fontSize={12} 
                                        fill="#ff1a5e"
                                        fontWeight="600"
                                      >
                                        {rating?.toFixed(2)} rating
                                      </text>
                                      <text 
                                        x={x + 8} 
                                        y={y + 92} 
                                        fontSize={10} 
                                        fill="#666"
                                      >
                                        {size} respondents
                                      </text>
                                    </>
                                  )}
                                </g>
                              );
                            }}
                          >
                            <RechartsTooltip
                              content={({ payload }) => {
                                const node = payload && payload[0]?.payload;
                                if (!node || !node.rating) return null;
                                return (
                                  <div className="bg-white border border-violet-200 p-3 text-sm rounded-lg shadow-lg">
                                    <div className="font-bold text-violet-800">{node.country}</div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <div>
                                        <div className="text-gray-500">Gender</div>
                                        <div>{node.gender}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Occupation</div>
                                        <div>{node.occupation}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Family History</div>
                                        <div>{node.fh}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Avg Rating</div>
                                        <div className="font-bold">{node.rating.toFixed(2)}</div>
                                      </div>
                                      <div className="col-span-2">
                                        <div className="text-gray-500">Respondents</div>
                                        <div className="font-medium">{node.size}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                          </Treemap>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {tooltip.visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bg-white border border-violet-200 text-sm px-3 py-2 rounded-lg shadow-lg z-10"
          style={{ left: tooltip.x, top: tooltip.y, pointerEvents: "none" }}
        >
          <div className="font-medium">{tooltip.content.split(":")[0]}</div>
          <div className="text-violet-800 font-bold">
            Rating: {tooltip.content.split(":")[1]}
          </div>
        </motion.div>
      )}

      {showInfo && <InfoModal />}
      {showTour && <TourModal />}
      
      <footer className="mt-12 text-center text-gray-600 text-sm">
        <p>©️ {new Date().getFullYear()} Global Mental Health Dashboard | Data Visualization</p>
        <div className="mt-2 flex justify-center">
          <div className="w-32 h-1 bg-gradient-to-r from-violet-600 to-red-500 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
};

export default Map;