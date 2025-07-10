import React, { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  FaBrain,
  FaChartBar,
  FaExclamationTriangle,
  FaBookOpen,
  FaPhoneAlt,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";

const navItems = [
  { label: "Predictor", path: "/predictor", icon: <FaBrain /> },
  { label: "Comparison", path: "/comparison", icon: <FaChartBar /> },
  { label: "Risk Factors", path: "/risk-factors", icon: <FaExclamationTriangle /> },
  { label: "Resources", path: "/resources", icon: <FaBookOpen /> },
  { label: "Contact", path: "/contact", icon: <FaPhoneAlt /> },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md p-4 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          {!collapsed && (
            <h2
              onClick={() => navigate("/")}
              className="text-xl font-bold text-indigo-600 cursor-pointer hover:underline"
            >
              MindCare
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-indigo-600 p-2 focus:outline-none"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <FaBars /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className="space-y-3">
          {navItems.map((item, i) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : "hover:bg-indigo-50 text-gray-700"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
