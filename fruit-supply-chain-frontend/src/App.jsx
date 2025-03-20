import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import FarmPage from "./pages/FarmPage";
import TrackerPage from "./pages/TrackerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import ProductList from "./pages/ProductList";
import OrderManagement from "./pages/OrderManagement";
import OrderHistory from "./pages/OrderHistory";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/farms" element={<FarmPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Routes cho Admin */}
        <Route path="/admin" element={<AdminPage />}>
          <Route path="products" element={<ProductList />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="history" element={<OrderHistory />} />
        </Route>
      </Routes>
    </Layout>
  );
}

export default App;
