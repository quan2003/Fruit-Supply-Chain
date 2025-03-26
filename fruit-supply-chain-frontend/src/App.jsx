// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import FarmPage from "./pages/FarmPage";
import TrackerPage from "./pages/TrackerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DeliveryHubPage from "./pages/DeliveryHubPage";
import ShopPage from "./pages/ShopPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import FarmProductList from "./components/FarmManagement/FarmProductList";
import AddFarmProductForm from "./components/FarmManagement/AddFarmProductForm";
import RegisterFarmForm from "./components/FarmManagement/RegisterFarmForm";
import FarmOverview from "./components/FarmManagement/FarmOverview";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Typography } from "@mui/material";

// Import các component con cho DeliveryHubPage
import StatisticsPage from "./components/DeliveryHub/StatisticsPage";
import DeliveryHubShopPage from "./components/DeliveryHub/ShopPage";
import OrdersPage from "./components/DeliveryHub/OrdersPage";
import PurchasesPage from "./components/DeliveryHub/PurchasesPage";
import OutgoingProductsPage from "./components/DeliveryHub/OutgoingProductsPage"; // Đảm bảo import đúng
import DashboardPage from "./components/DeliveryHub/DashboardPage";

function App() {
  const { isManager } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Các route công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/cua-hang" element={<ShopPage />} />

        {/* Route cho admin (bảo vệ bởi role Admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAllowed={(user) => user?.role === "Admin"}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Nested routes cho DeliveryHubPage */}
        <Route
          path="/delivery-hub"
          element={
            <ProtectedRoute isAllowed={(user) => user?.role === "DeliveryHub"}>
              <DeliveryHubPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="shop" element={<DeliveryHubShopPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="outgoing-products" element={<OutgoingProductsPage />} />
        </Route>

        {/* Nested routes cho FarmPage */}
        <Route
          path="/farms"
          element={
            <ProtectedRoute isAllowed={(user) => user?.role === "Producer"}>
              <FarmPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<FarmOverview />} />
          <Route path="products" element={<FarmProductList />} />
          <Route path="add-product" element={<AddFarmProductForm />} />
          <Route path="register" element={<RegisterFarmForm />} />
          <Route
            path="sold"
            element={
              <Typography>Trang Sản phẩm đã bán (Chưa triển khai)</Typography>
            }
          />
          <Route
            path="categories"
            element={<Typography>Trang Danh mục (Chưa triển khai)</Typography>}
          />
        </Route>

        {/* Route mặc định nếu không tìm thấy */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
