// src/pages/FarmPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import MenuIcon from "@mui/icons-material/Menu";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import Footer from "../components/common/Footer";
import FarmDetail from "../components/FarmManagement/FarmDetail";
import UpdateFarmContent from "../components/FarmManagement/UpdateFarmConditions";
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

const FarmPage = () => {
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  // State quản lý dữ liệu vùng trồng
  const [farmData, setFarmData] = useState({
    weather: "Nắng nhẹ, 28°C",
    yield: "500 kg",
    quality: "Tốt",
  });

  // State cho khuyến nghị
  const [recommendation, setRecommendation] = useState("");

  // State điều khiển Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Kiểm tra vai trò người dùng
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isFarmer = user.role === "nguoi-dan";

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Rút gọn địa chỉ ví
  const shortenAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Chưa kết nối";

  // Hàm xử lý kết nối ví
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Lỗi khi kết nối ví:", error);
    }
  };

  // Cập nhật dữ liệu vùng trồng
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

  // Tạo khuyến nghị từ hệ thống
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

  // Load dữ liệu từ localStorage
  useEffect(() => {
    const storedFarmData = JSON.parse(localStorage.getItem("farmData"));
    if (storedFarmData) {
      setFarmData(storedFarmData);
      generateRecommendation(storedFarmData);
    }
  }, []);

  // Danh sách chức năng trong thanh bên
  const menuItems = [
    { text: "Tổng quan", action: () => navigate("/farm") },
    { text: "Sản phẩm", action: () => navigate("/farm/products") },
    { text: "Đã bán", action: () => navigate("/farm/sold") },
    { text: "Danh mục", action: () => navigate("/farm/categories") },
    { text: "Đăng xuất", action: handleLogout },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* Thanh điều hướng bên trái (toggle) */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, bgcolor: "#FFFFFF", height: "100%", p: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "#333", mb: 2 }}
          >
            Fruit Supply Chain
          </Typography>
          <List>
            {menuItems.map((item, index) => (
              <ListItem
                button
                key={index}
                onClick={() => {
                  item.action();
                  setDrawerOpen(false); // Đóng Drawer sau khi chọn
                }}
                sx={{
                  bgcolor:
                    item.text === "Tổng quan" ? "#1976D2" : "transparent",
                  color: item.text === "Tổng quan" ? "#FFFFFF" : "#333",
                  "&:hover": { bgcolor: "#E8F5E9" },
                }}
              >
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Button
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: "#1976D2",
              "&:hover": { bgcolor: "#115293" },
              width: "100%",
            }}
            onClick={() => navigate("/farm/register")}
          >
            Tải chương trình báo cáo
          </Button>
        </Box>
      </Drawer>

      {/* Nội dung chính */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Header cố định */}
        <AppBar
          position="fixed"
          sx={{
            bgcolor: "#FFF5F5",
            color: "#333",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <LocalFloristIcon
                sx={{ color: "#FF6F91", mr: 1, fontSize: 30 }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#333" }}
              >
                Fruit Supply Chain
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {account ? (
                <>
                  <Typography sx={{ mr: 2 }}>
                    Hi, Nông dân xuất sắc ({shortenAddress(account)})
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleLogout}
                    sx={{ color: "#333", fontWeight: "bold" }}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleConnectWallet}
                  sx={{
                    bgcolor: "#1976D2",
                    "&:hover": { bgcolor: "#115293" },
                    fontWeight: "bold",
                  }}
                >
                  Kết nối ví
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Nội dung chính */}
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
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
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default FarmPage;
