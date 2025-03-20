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
import { Link, useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();

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

  const menuItems = [
    { text: "Trang chủ", path: "/" },
    { text: "Cửa hàng", path: "/cua-hang" },
    { text: "Đăng nhập", path: "/dang-nhap" },
    { text: "Đăng ký", path: "/dang-ky" },
    { text: "Mua Token", path: "/mua-token" },
  ];

  const getBasePath = (path) => path.split("?")[0];

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
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              borderBottom:
                getBasePath(location.pathname) === item.path
                  ? "2px solid white"
                  : "none",
            }}
          >
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontWeight: "bold", color: "white" }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ bgcolor: "white", boxShadow: 1 }}>
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#FF6F91",
              borderRadius: 2,
              px: 2,
              py: 1,
            }}
          >
            <IconButton edge="start" color="inherit" aria-label="logo">
              <LocalFlorist sx={{ color: "white", fontSize: 24 }} />
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
            {menuItems.map((item) => (
              <React.Fragment key={item.text}>
                {item.text === "Đăng nhập" || item.text === "Đăng ký" ? (
                  <Button
                    color="inherit"
                    onClick={
                      item.text === "Đăng nhập"
                        ? handleLoginClick
                        : handleRegisterClick
                    }
                    sx={{
                      color: "black",
                      mx: 1,
                      fontWeight: "bold",
                      borderBottom:
                        getBasePath(location.pathname) === item.path
                          ? "2px solid #FF6F91"
                          : "none",
                    }}
                  >
                    {item.text}
                  </Button>
                ) : (
                  <Button
                    color="inherit"
                    component={Link}
                    to={item.path}
                    sx={{
                      color: "black",
                      mx: 1,
                      fontWeight: "bold",
                      borderBottom:
                        getBasePath(location.pathname) === item.path
                          ? "2px solid #FF6F91"
                          : "none",
                    }}
                  >
                    {item.text}
                  </Button>
                )}
                {item.text === "Đăng nhập" && (
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
                      onClick={() => {
                        handleLoginClose();
                        navigate("/dang-nhap?role=nguoi-dan");
                      }}
                    >
                      Người dân
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleLoginClose();
                        navigate("/dang-nhap?role=nha-quan-ly");
                      }}
                    >
                      Nhà quản lý
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleLoginClose();
                        navigate("/dang-nhap?role=nguoi-tieu-dung");
                      }}
                    >
                      Người tiêu dùng
                    </MenuItem>
                  </Menu>
                )}
                {item.text === "Đăng ký" && (
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
                      onClick={() => {
                        handleRegisterClose();
                        navigate("/dang-ky?role=nguoi-dan");
                      }}
                    >
                      Người dân
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleRegisterClose();
                        navigate("/dang-ky?role=nha-quan-ly");
                      }}
                    >
                      Nhà quản lý
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleRegisterClose();
                        navigate("/dang-ky?role=nguoi-tieu-dung");
                      }}
                    >
                      Người tiêu dùng
                    </MenuItem>
                  </Menu>
                )}
              </React.Fragment>
            ))}
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

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, mt: { xs: 7, md: 8 } }}>{children}</Box>
    </Box>
  );
};

export default Layout;
