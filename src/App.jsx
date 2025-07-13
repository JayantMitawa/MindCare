import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Predictor from "./pages/Predictor";
import Comparison from "./pages/Comparison";
import RiskFactors from "./pages/RiskFactors";
import Resources from "./pages/Resources";
import MainLayout from "./pages/Main_Layout";
import BoxPlotChart from "./pages/BoxPlotChart";
import BubblePlot from "./pages/BubblePlot";
import Map from "./pages/Comparison";
import MentalHealth3DPlot from "./pages/MentalHealth3DPlot";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<Home />} />

        {/* Sidebar Layout Routes */}
        <Route element={<MainLayout />}> 
          <Route path="/predictor" element={<Predictor />} />
          <Route path="/comparison" element={<Map/>} />
          <Route path="/risk-factors" element={<BoxPlotChart />} />
          <Route path="/resources" element={<BubblePlot />} />
          <Route path="/contact" element={<MentalHealth3DPlot />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
