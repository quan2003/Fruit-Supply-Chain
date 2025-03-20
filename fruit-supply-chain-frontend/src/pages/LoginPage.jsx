// src/pages/LoginPage.jsx
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Facebook, Twitter, Google } from "@mui/icons-material";
import { useWeb3 } from "../contexts/Web3Context";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

// Hình minh họa bên trái
const illustrationImage =
  "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connectWallet, account } = useWeb3();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [expectedWallet, setExpectedWallet] = useState("");

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
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password || !role) {
      setError("Vui lòng điền đầy đủ thông tin! 😅");
      return;
    }

    try {
      // Gửi yêu cầu đăng nhập đến API
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(true);
        setExpectedWallet(data.user.walletAddress?.toLowerCase() || "");
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.user.email,
            role: data.user.role,
            walletAddress: data.user.walletAddress,
          })
        );
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      setError("Có lỗi xảy ra! Vui lòng thử lại nhé! 😓");
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (account) {
        // Kiểm tra xem địa chỉ ví có khớp với ví được gán cho đối tượng không (nếu có)
        if (!expectedWallet || account.toLowerCase() === expectedWallet) {
          // Cập nhật wallet address vào PostgreSQL
          await fetch("http://localhost:3000/update-wallet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, walletAddress: account }),
          });

          // Điều hướng theo vai trò
          const user = JSON.parse(localStorage.getItem("user")) || {};
          if (user.role === "nguoi-dan") {
            navigate("/farms"); // Điều hướng đến trang FarmPage cho Người dân
          } else if (user.role === "nha-quan-ly") {
            navigate("/admin"); // Điều hướng đến trang quản lý cho Nhà quản lý
          } else if (user.role === "nguoi-tieu-dung") {
            navigate("/"); // Điều hướng về trang chủ cho Người tiêu dùng
          }
        } else {
          setError(
            "Ví MetaMask không khớp với ví đã đăng ký! Vui lòng chọn đúng ví nhé! 😓"
          );
          if (window.ethereum) {
            await window.ethereum.request({
              method: "wallet_requestPermissions",
              params: [{ eth_accounts: {} }],
            });
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      setError("Không thể kết nối ví MetaMask! 😓");
    }
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

            {/* Right Section: Login Form hoặc Kết nối ví */}
            <Grid item xs={12} md={6}>
              {!isLoggedIn ? (
                <>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      color: "black",
                      mb: 2,
                      textAlign: "center",
                    }}
                  >
                    Đăng nhập nhanh đi nào! 😍
                  </Typography>

                  {/* Social Login Buttons */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                  >
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

                  {/* Hiển thị thông báo lỗi nếu có */}
                  {error && (
                    <Typography
                      variant="body2"
                      sx={{ color: "red", textAlign: "center", mb: 2 }}
                    >
                      {error}
                    </Typography>
                  )}

                  {/* Login Form */}
                  <Box component="form" sx={{ maxWidth: "400px", mx: "auto" }}>
                    <TextField
                      fullWidth
                      label="Nhập Email"
                      variant="outlined"
                      sx={{ mb: 2 }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Nhập mật khẩu"
                      type="password"
                      variant="outlined"
                      sx={{ mb: 2 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                        <MenuItem value="nguoi-tieu-dung">
                          Người tiêu dùng
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ textAlign: "right", mb: 2 }}>
                      <Link
                        to="/forgot-password"
                        style={{ color: "#42A5F5", textDecoration: "none" }}
                      >
                        Forgot password?
                      </Link>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleLogin}
                      sx={{
                        bgcolor: "#42A5F5",
                        color: "white",
                        py: 1.5,
                        fontWeight: "bold",
                        "&:hover": { bgcolor: "#1E88E5" },
                      }}
                    >
                      Đăng nhập ngay! 🚀
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      color: "black",
                      mb: 2,
                      textAlign: "center",
                    }}
                  >
                    Kết nối ví MetaMask để bắt đầu nào! 🚀
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ textAlign: "center", mb: 2, color: "text.secondary" }}
                  >
                    Bạn đã đăng nhập thành công! Bây giờ hãy kết nối ví MetaMask
                    để tiếp tục nhé! 🌟
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ textAlign: "center", mb: 2, color: "#FF6F91" }}
                  >
                    Không kết nối ví MetaMask ư? 😕
                  </Typography>
                  {error && (
                    <Typography
                      variant="body2"
                      sx={{ color: "red", textAlign: "center", mb: 2 }}
                    >
                      {error}
                    </Typography>
                  )}
                  <Box sx={{ maxWidth: "400px", mx: "auto" }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleConnectWallet}
                      sx={{
                        bgcolor: "#FF6F91",
                        color: "white",
                        py: 1.5,
                        fontWeight: "bold",
                        "&:hover": { bgcolor: "#E65B7B" },
                      }}
                    >
                      Kết nối ngay! 🌟
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Layout>
  );
};

export default LoginPage;
