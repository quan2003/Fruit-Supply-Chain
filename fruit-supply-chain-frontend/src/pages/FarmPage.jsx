import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import MenuIcon from "@mui/icons-material/Menu";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import Footer from "../components/common/Footer";

const FarmPage = () => {
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isFarmer = user.role === "Producer";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const shortenAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Chưa kết nối";

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Lỗi khi kết nối ví:", error);
    }
  };

  const menuItems = [
    { text: "Tổng quan", action: () => navigate("/farms") },
    { text: "Sản phẩm", action: () => navigate("/farms/products") },
    { text: "Đã bán", action: () => navigate("/farms/sold") },
    { text: "Danh mục", action: () => navigate("/farms/categories") },
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
                  setDrawerOpen(false);
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
            onClick={() => navigate("/farms/register")}
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
          <Outlet /> {/* Render các route con tại đây */}
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default FarmPage;
