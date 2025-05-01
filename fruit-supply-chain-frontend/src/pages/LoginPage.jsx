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
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

const illustrationImage =
  "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connectWallet, account } = useWeb3();
  const { login } = useAuth();
  const [role, setRole] = useState("Customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

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

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (!account) {
        setError("Không thể kết nối ví MetaMask! Vui lòng thử lại nhé! 😓");
        return;
      }
      setWalletConnected(true);
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      setError(error.message || "Không thể kết nối ví MetaMask! 😓");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Kiểm tra dữ liệu đầu vào
    if (!email.trim() || !password.trim() || !role.trim()) {
      setError("Vui lòng điền đầy đủ thông tin! 😅");
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ! 😅");
      return;
    }

    // Yêu cầu kết nối ví trước khi đăng nhập
    if (!walletConnected || !account) {
      setError("Vui lòng kết nối ví MetaMask trước khi đăng nhập! 😅");
      return;
    }

    try {
      console.log("Dữ liệu gửi đi:", { email, password, role });
      // Gọi hàm login từ useAuth
      const userData = await login(email, password, role);

      // Cập nhật walletAddress vào backend
      const response = await fetch("http://localhost:3000/update-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, walletAddress: account }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật ví MetaMask!");
      }

      // Chuyển hướng dựa trên vai trò
      if (userData.role === "Producer") {
        navigate("/farms");
      } else if (userData.role === "Admin") {
        navigate("/quan-ly");
      } else if (userData.role === "Customer") {
        navigate("/");
      } else if (userData.role === "Government") {
        navigate("/government");
      } else if (userData.role === "DeliveryHub") {
        navigate("/delivery-hub");
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      setError(error.message || "Đăng nhập thất bại! 😓");
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

            <Grid item xs={12} md={6}>
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

                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "red", textAlign: "center", mb: 2 }}
                  >
                    {error}
                  </Typography>
                )}

                <Box component="form" sx={{ maxWidth: "400px", mx: "auto" }}>
                  <TextField
                    fullWidth
                    label="Nhập Email"
                    variant="outlined"
                    sx={{ mb: 2 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Nhập mật khẩu"
                    type="password"
                    variant="outlined"
                    sx={{ mb: 2 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Bạn là ai? 🌟</InputLabel>
                    <Select
                      value={role}
                      onChange={handleRoleChange}
                      label="Bạn là ai? 🌟"
                      required
                    >
                      <MenuItem value="Producer">Người dân</MenuItem>
                      <MenuItem value="Admin">Nhà quản lý</MenuItem>
                      <MenuItem value="Customer">Người tiêu dùng</MenuItem>
                      <MenuItem value="Government">Cơ quan quản lý</MenuItem>
                      <MenuItem value="DeliveryHub">
                        Trung tâm phân phối
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ textAlign: "right", mb: 2 }}>
                    <Link
                      to="/forgot-password"
                      style={{ color: "#42A5F5", textDecoration: "none" }}
                    >
                      Quên mật khẩu?
                    </Link>
                  </Box>

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
                      mb: 2,
                    }}
                  >
                    Kết Nối Ví MetaMask
                  </Button>

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
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Layout>
  );
};

export default LoginPage;
