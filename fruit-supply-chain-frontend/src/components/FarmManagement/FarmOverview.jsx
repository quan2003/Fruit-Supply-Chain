import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
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
  ResponsiveContainer,
} from "recharts";
import FruitCollection from "../FruitCollection";
import { useWeb3 } from "../../contexts/Web3Context";
import { getFarmStats, getYieldData } from "../../services/farmService";
import InventoryIcon from "@mui/icons-material/Inventory";
import SellIcon from "@mui/icons-material/Sell";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const FarmOverview = () => {
  const { account } = useWeb3();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [farmData, setFarmData] = useState({
    weather: "Nắng nhẹ, 28°C",
    yield: "500 kg",
    quality: "Tốt",
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    soldProducts: 0,
    totalRevenue: 0,
  });
  const [yieldData, setYieldData] = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [recommendationType, setRecommendationType] = useState("info"); // info, warning, success
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setRecommendationType("success");
    } else if (data.quality === "Kém") {
      setRecommendation(
        "Chất lượng cây trồng chưa tốt, cần kiểm tra điều kiện đất và nước."
      );
      setRecommendationType("warning");
    } else {
      setRecommendation(
        "Tình hình ổn định, tiếp tục duy trì chất lượng hiện tại."
      );
      setRecommendationType("info");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Kiểm tra điều kiện trước khi gọi API
      if (!user.email) {
        setError("Vui lòng đăng nhập để xem thông tin!");
        setLoading(false);
        return;
      }
      if (!account || typeof account !== "string" || account === "") {
        setError("Vui lòng kết nối ví MetaMask để tiếp tục!");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Bắt đầu fetch data với account:", account);

        // Lấy thống kê farm
        const statsData = await getFarmStats(user.email, account);
        setStats(statsData);

        // Lấy dữ liệu sản lượng
        const yieldDataResponse = await getYieldData(user.email, account);
        setYieldData(yieldDataResponse);

        // Lấy dữ liệu farm từ localStorage
        const storedFarmData = JSON.parse(localStorage.getItem("farmData"));
        if (storedFarmData) {
          setFarmData(storedFarmData);
          generateRecommendation(storedFarmData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi fetch data:", err);
        setError(err.message || "Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user.email, account]);

  if (loading) {
    return (
      <CircularProgress
        size={24}
        sx={{ display: "block", mx: "auto", my: 2 }}
      />
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

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
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center" }}>
              <InventoryIcon sx={{ color: "#388E3C", mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ color: "#388E3C" }}>
                  Sản phẩm
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  {stats.totalProducts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: "#E8F5E9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center" }}>
              <SellIcon sx={{ color: "#388E3C", mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ color: "#388E3C" }}>
                  Sản phẩm đã bán
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  {stats.soldProducts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: "#E8F5E9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center" }}>
              <AttachMoneyIcon sx={{ color: "#388E3C", mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ color: "#388E3C" }}>
                  Tổng doanh thu
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  ${stats.totalRevenue} AGT
                </Typography>
              </Box>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yieldData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
            <XAxis dataKey="month" stroke="#388E3C" />
            <YAxis stroke="#388E3C" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#388E3C",
              }}
              labelStyle={{ color: "#388E3C" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="yield"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ fill: "#388E3C", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
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
              display: "flex",
              alignItems: "center",
            }}
          >
            {recommendationType === "success" && (
              <CheckCircleIcon sx={{ color: "#388E3C", mr: 2, fontSize: 30 }} />
            )}
            {recommendationType === "warning" && (
              <WarningIcon sx={{ color: "#FF6F91", mr: 2, fontSize: 30 }} />
            )}
            {recommendationType === "info" && (
              <InfoIcon sx={{ color: "#1976D2", mr: 2, fontSize: 30 }} />
            )}
            <Box>
              <Typography
                variant="h6"
                sx={{ mb: 1, fontWeight: "bold", color: "#388E3C" }}
              >
                Khuyến nghị từ hệ thống
              </Typography>
              <Typography sx={{ color: "#333" }}>
                {recommendation || "Cập nhật dữ liệu để nhận khuyến nghị."}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Bộ sưu tập Trái cây */}
      <FruitCollection />
    </>
  );
};

export default FarmOverview;
