import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

import RiskFactors from "./pages/RiskFactors";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import MentalHealthForm from "./pages/MentalHealthForm";
// import CombinedMentalHealthForm from "./pages/Predictor";
import Map from "./pages/Comparison";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predictor" element={<MentalHealthForm />} />
        <Route path="/comparison" element={<Map />} />
        <Route path="/risk-factors" element={<RiskFactors />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        {/* <Route path="/mental-health-form" element={<MentalHealthForm />} /> */}
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
