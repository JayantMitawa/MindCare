import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Predictor from "./pages/Predictor";
import Comparison from "./pages/Comparison";
import RiskFactors from "./pages/RiskFactors";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import MainLayout from "./pages/Main_Layout";
import BoxPlotChart from "./pages/BoxPlotChart";
import BubblePlot from "./pages/BubblePlot";
import Map from "./pages/Map";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<Home />} />

        {/* Sidebar Layout Routes */}
        <Route element={<MainLayout />}> 
          <Route path="/predictor" element={<Predictor />} />
          <Route path="/comparison" element={<Map />} />
          <Route path="/risk-factors" element={<BoxPlotChart />} />
          <Route path="/resources" element={<BubblePlot />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
