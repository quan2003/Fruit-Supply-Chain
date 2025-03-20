// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import { Facebook, Twitter, Google } from "@mui/icons-material";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

// Hình minh họa bên trái
const illustrationImage =
  "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80";

const RegisterPage = () => {
  const location = useLocation();
  const [role, setRole] = useState("");

  // Lấy query parameter role từ URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleFromQuery = params.get("role");
    if (roleFromQuery) {
      setRole(roleFromQuery);
    }
  }, [location]);

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "calc(100vh - 140px)",
          display: "flex",
          alignItems: "center",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            {/* Left Section: Illustration */}
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={illustrationImage}
                alt="Illustration"
                sx={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  borderRadius: 2,
                }}
              />
            </Grid>

            {/* Right Section: Register Form */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "black",
                  mb: 2,
                  textAlign: "center",
                }}
              >
                Đăng ký liền tay, không chờ đợi! 🚀
              </Typography>

              {/* Social Register Buttons */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <IconButton sx={{ color: "#3b5998", mx: 1 }}>
                  <Facebook />
                </IconButton>
                <IconButton sx={{ color: "#1da1f2", mx: 1 }}>
                  <Twitter />
                </IconButton>
                <IconButton sx={{ color: "#db4437", mx: 1 }}>
                  <Google />
                </IconButton>
              </Box>

              <Typography
                variant="body1"
                sx={{ textAlign: "center", mb: 2, color: "text.secondary" }}
              >
                Or
              </Typography>

              {/* Register Form */}
              <Box component="form" sx={{ maxWidth: "400px", mx: "auto" }}>
                <TextField
                  fullWidth
                  label="Nhập Email"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Nhập mật khẩu"
                  type="password"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  type="password"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                {/* Dropdown chọn vai trò */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Bạn là ai? 🌟</InputLabel>
                  <Select
                    value={role}
                    onChange={handleRoleChange}
                    label="Bạn là ai? 🌟"
                  >
                    <MenuItem value="nguoi-dan">Người dân</MenuItem>
                    <MenuItem value="nha-quan-ly">Nhà quản lý</MenuItem>
                    <MenuItem value="nguoi-tieu-dung">Người tiêu dùng</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: "#42A5F5",
                    color: "white",
                    py: 1.5,
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#1E88E5" },
                  }}
                >
                  Đăng ký ngay! 🚀
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Layout>
  );
};

export default RegisterPage;
