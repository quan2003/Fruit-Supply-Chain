import React from "react";
import { Container, Typography, Box, Tabs, Tab } from "@mui/material";
import { Security as SecurityIcon } from "@mui/icons-material";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Layout from "../components/common/Layout";

const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Các đường dẫn tab tương ứng
  const tabPaths = ["/admin/products", "/admin/orders", "/admin/history"];
  const tabValue = tabPaths.indexOf(location.pathname);

  const handleTabChange = (event, newValue) => {
    navigate(tabPaths[newValue]); // Điều hướng trang
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Tiêu đề */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">
            <SecurityIcon sx={{ mr: 1 }} />
            Trang quản trị hệ thống
          </Typography>
        </Box>

        {/* Thanh Tabs cố định */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tab label="Danh sách sản phẩm" />
          <Tab label="Quản lý đơn hàng" />
          <Tab label="Lịch sử đơn hàng" />
        </Tabs>

        {/* Outlet để hiển thị nội dung động */}
        <Outlet />
      </Container>
    </Layout>
  );
};

export default AdminPage;
