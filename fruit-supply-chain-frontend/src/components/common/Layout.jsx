// src/components/common/Layout.jsx
import React, { useState } from "react";
import {
  Container,
  Box,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { Menu as MenuIcon, LocalFlorist } from "@mui/icons-material";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State cho dropdown Đăng nhập và Đăng ký
  const [loginAnchorEl, setLoginAnchorEl] = useState(null);
  const [registerAnchorEl, setRegisterAnchorEl] = useState(null);
  const loginOpen = Boolean(loginAnchorEl);
  const registerOpen = Boolean(registerAnchorEl);

  const handleLoginClick = (event) => {
    setLoginAnchorEl(event.currentTarget);
  };

  const handleRegisterClick = (event) => {
    setRegisterAnchorEl(event.currentTarget);
  };

  const handleLoginClose = () => {
    setLoginAnchorEl(null);
  };

  const handleRegisterClose = () => {
    setRegisterAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box
      sx={{
        textAlign: "center",
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
        height: "100%",
        color: "white",
      }}
      onClick={handleDrawerToggle}
    >
      <Typography variant="h6" sx={{ my: 2, fontWeight: "bold" }}>
        Fruit Supply Chain
      </Typography>
      <List>
        {["Trang chủ", "Cửa hàng", "Đăng nhập", "Đăng ký", "Mua Token"].map(
          (text) => (
            <ListItem
              button
              key={text}
              component={Link}
              to={
                text === "Trang chủ"
                  ? "/"
                  : `/${text.toLowerCase().replace(/\s+/g, "-")}`
              }
            >
              <ListItemText
                primary={text}
                primaryTypographyProps={{ fontWeight: "bold", color: "white" }}
              />
            </ListItem>
          )
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="fixed" sx={{ bgcolor: "white", boxShadow: 1 }}>
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#FF6F91", // Màu nền hồng
              borderRadius: 2,
              px: 2,
              py: 1,
            }}
          >
            <IconButton edge="start" color="inherit" aria-label="logo">
              <LocalFlorist sx={{ color: "white", fontSize: 24 }} />{" "}
              {/* Icon bông hoa */}
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "white", ml: 1 }}
            >
              Fruit Supply Chain
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            <Button
              color="inherit"
              component={Link}
              to="/"
              sx={{ color: "black", mx: 1, fontWeight: "bold" }}
            >
              Trang chủ
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/cua-hang"
              sx={{ color: "black", mx: 1, fontWeight: "bold" }}
            >
              Cửa hàng
            </Button>
            {/* Dropdown Đăng nhập */}
            <Button
              color="inherit"
              onClick={handleLoginClick}
              sx={{ color: "black", mx: 1, fontWeight: "bold" }}
            >
              Đăng nhập
            </Button>
            <Menu
              anchorEl={loginAnchorEl}
              open={loginOpen}
              onClose={handleLoginClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiMenuItem-root": {
                    fontWeight: "bold",
                    color: "#333",
                    "&:hover": {
                      backgroundColor: "#E6F4EA",
                      color: "#FF6F91",
                    },
                  },
                },
              }}
            >
              <MenuItem
                component={Link}
                to="/dang-nhap?role=nguoi-dan"
                onClick={handleLoginClose}
              >
                Người dân
              </MenuItem>
              <MenuItem
                component={Link}
                to="/dang-nhap?role=nha-quan-ly"
                onClick={handleLoginClose}
              >
                Nhà quản lý
              </MenuItem>
              <MenuItem
                component={Link}
                to="/dang-nhap?role=nguoi-tieu-dung"
                onClick={handleLoginClose}
              >
                Người tiêu dùng
              </MenuItem>
            </Menu>
            {/* Dropdown Đăng ký */}
            <Button
              color="inherit"
              onClick={handleRegisterClick}
              sx={{ color: "black", mx: 1, fontWeight: "bold" }}
            >
              Đăng ký
            </Button>
            <Menu
              anchorEl={registerAnchorEl}
              open={registerOpen}
              onClose={handleRegisterClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiMenuItem-root": {
                    fontWeight: "bold",
                    color: "#333",
                    "&:hover": {
                      backgroundColor: "#E6F4EA",
                      color: "#FF6F91",
                    },
                  },
                },
              }}
            >
              <MenuItem
                component={Link}
                to="/dang-ky?role=nguoi-dan"
                onClick={handleRegisterClose}
              >
                Người dân
              </MenuItem>
              <MenuItem
                component={Link}
                to="/dang-ky?role=nha-quan-ly"
                onClick={handleRegisterClose}
              >
                Nhà quản lý
              </MenuItem>
              <MenuItem
                component={Link}
                to="/dang-ky?role=nguoi-tieu-dung"
                onClick={handleRegisterClose}
              >
                Người tiêu dùng
              </MenuItem>
            </Menu>
            <Button
              color="inherit"
              component={Link}
              to="/mua-token"
              sx={{ color: "black", mx: 1, fontWeight: "bold" }}
            >
              Mua Token
            </Button>
          </Box>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" }, color: "black" }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, mt: { xs: 7, md: 8 } }}>{children}</Box>
    </Box>
  );
};

export default Layout;
