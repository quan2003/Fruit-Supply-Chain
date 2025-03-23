// src/components/FarmManagement/FarmOverview.jsx
import React, { useState, useEffect } from "react";
import { Typography, Box, Grid, Card, CardContent } from "@mui/material";
import FarmDetail from "./FarmDetail";
import UpdateFarmContent from "./UpdateFarmConditions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Dữ liệu giả lập cho biểu đồ
const chartData = [
  { month: "Tháng 1", yield: 40 },
  { month: "Tháng 2", yield: 60 },
  { month: "Tháng 3", yield: 80 },
  { month: "Tháng 4", yield: 50 },
  { month: "Tháng 5", yield: 40 },
];

const FarmOverview = () => {
  const [farmData, setFarmData] = useState({
    weather: "Nắng nhẹ, 28°C",
    yield: "500 kg",
    quality: "Tốt",
  });

  const [recommendation, setRecommendation] = useState("");

  const handleUpdateFarmData = (updateData) => {
    const newFarmData = {
      weather: farmData.weather,
      yield: updateData.yield,
      quality: updateData.condition,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("farmData", JSON.stringify(newFarmData));
    setFarmData(newFarmData);
    alert("Cập nhật dữ liệu thành công.");
    generateRecommendation(newFarmData);
  };

  const generateRecommendation = (data) => {
    if (parseInt(data.yield) > 600) {
      setRecommendation(
        "Sản lượng cao, cân nhắc mở rộng trồng thêm loại trái cây như xoài hoặc sầu riêng."
      );
    } else if (data.quality === "Kém") {
      setRecommendation(
        "Chất lượng cây trồng chưa tốt, cần kiểm tra điều kiện đất và nước."
      );
    } else {
      setRecommendation(
        "Tình hình ổn định, tiếp tục duy trì chất lượng hiện tại."
      );
    }
  };

  useEffect(() => {
    const storedFarmData = JSON.parse(localStorage.getItem("farmData"));
    if (storedFarmData) {
      setFarmData(storedFarmData);
      generateRecommendation(storedFarmData);
    }
  }, []);

  return (
    <>
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", color: "#2E7D32", mb: 4 }}
      >
        Tổng quan
      </Typography>

      {/* Thống kê */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: "#E8F5E9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: "#388E3C" }}>
                Sản phẩm
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#333" }}
              >
                15
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: "#E8F5E9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: "#388E3C" }}>
                Sản phẩm đã bán
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#333" }}
              >
                1
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: "#E8F5E9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: "#388E3C" }}>
                Tổng doanh thu
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#333" }}
              >
                $80 AGT
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biểu đồ sản lượng */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#388E3C" }}
        >
          Sản lượng theo tháng
        </Typography>
        <LineChart width={600} height={300} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="yield" stroke="#82ca9d" />
        </LineChart>
      </Box>

      {/* Thông tin vùng trồng và cập nhật */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FarmDetail farmData={farmData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <UpdateFarmContent
            onUpdate={handleUpdateFarmData}
            initialData={farmData}
          />
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #E8F5E9",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: "bold", color: "#388E3C" }}
            >
              Khuyến nghị từ hệ thống
            </Typography>
            <Typography sx={{ color: "#333" }}>
              {recommendation || "Cập nhật dữ liệu để nhận khuyến nghị."}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default FarmOverview;
