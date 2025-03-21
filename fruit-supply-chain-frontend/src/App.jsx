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
import FarmProductList from "./components/FarmManagement/FarmProductList";
import AddFarmProductForm from "./components/FarmManagement/AddFarmProductForm";
import RegisterFarmForm from "./components/FarmManagement/RegisterFarmForm";
import FarmOverview from "./components/FarmManagement/FarmOverview";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Typography } from "@mui/material"; // Thêm import Typography

function App() {
  const { isManager } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
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
        {/* Route cha cho các trang liên quan đến farm */}
        <Route path="/farms" element={<FarmPage />}>
          <Route
            index
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <FarmOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <FarmProductList />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-product"
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <AddFarmProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="register"
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <RegisterFarmForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="sold"
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <Typography>Trang Sản phẩm đã bán (Chưa triển khai)</Typography>
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
                <Typography>Trang Danh mục (Chưa triển khai)</Typography>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Layout>
  );
}

export default App;
