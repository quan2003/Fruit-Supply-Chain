// src/components/DeliveryHub/StatisticsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  ShoppingBag as ShoppingBagIcon,
  Receipt as ReceiptIcon,
  LocalShipping as LocalShippingIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// Removed the unused import for getDeliveryHubStats

const mockData = [
  { day: "Thứ 2", sales: 5, orders: 3 },
  { day: "Thứ 3", sales: 10, orders: 7 },
  { day: "Thứ 4", sales: 25, orders: 18 },
  { day: "Thứ 5", sales: 70, orders: 40 },
  { day: "Thứ 6", sales: 40, orders: 25 },
  { day: "Thứ 7", sales: 15, orders: 10 },
  { day: "Chủ nhật", sales: 5, orders: 3 },
];

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 80,
    totalProfit: 45,
    productsForSale: 0,
    productsInStock: 0,
    orders: 0,
    productsSold: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Trong môi trường thực tế, gọi API thực tế
        // const data = await getDeliveryHubStats();
        // setStats(data);

        // Giả lập dữ liệu
        setTimeout(() => {
          setStats({
            totalRevenue: 80,
            totalProfit: 45,
            productsForSale: 0,
            productsInStock: 0,
            orders: 0,
            productsSold: 0,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadReport = () => {
    alert("Báo cáo đang được tải xuống...");
    // Thực hiện tải xuống báo cáo thực tế ở đây
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Thống kê
      </Typography>

      {/* Thống kê tổng quan */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#FFF8E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingBagIcon sx={{ color: "#FFC107", fontSize: 30 }} />
              </Box>
            </Box>
            <Typography variant="h4" component="div">
              {stats.productsForSale}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sản phẩm đang bán
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#FFF0F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <InventoryIcon sx={{ color: "#FF4081", fontSize: 30 }} />
              </Box>
            </Box>
            <Typography variant="h4" component="div">
              {stats.productsInStock}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sản phẩm trong kho
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#E8F5E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ReceiptIcon sx={{ color: "#4CAF50", fontSize: 30 }} />
              </Box>
            </Box>
            <Typography variant="h4" component="div">
              {stats.orders}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Đơn đặt hàng
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#E0F7FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocalShippingIcon sx={{ color: "#00BCD4", fontSize: 30 }} />
              </Box>
            </Box>
            <Typography variant="h4" component="div">
              {stats.productsSold}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sản phẩm đã bán
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Thống kê doanh thu và lợi nhuận */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ${stats.totalRevenue} <small>AGT</small>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Tổng Chi
              </Typography>

              <Typography variant="h4" sx={{ mt: 3, mb: 1 }}>
                ${stats.totalProfit} <small>AGT</small>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Tổng Doanh thu
              </Typography>

              <Button
                variant="contained"
                color="success"
                startIcon={<FileDownloadIcon />}
                sx={{ mt: 3 }}
                onClick={handleDownloadReport}
              >
                Tải xuống Báo cáo
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Biểu đồ hoạt động
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      name="Doanh thu"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      name="Đơn hàng"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatisticsPage;
