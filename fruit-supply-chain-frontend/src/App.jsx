// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import FarmPage from "./pages/FarmPage";
import TrackerPage from "./pages/TrackerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isManager } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/farms/*" element={<FarmPage />} />{" "}
        {/* Hỗ trợ route con */}
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAllowed={isManager}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
