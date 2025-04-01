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
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [expectedWallet, setExpectedWallet] = useState("");

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

    if (!email || !password || !role) {
      setError("Vui lòng điền đầy đủ thông tin! 😅");
      return;
    }

    try {
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
        login(data.user);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.user.id,
            name: data.user.name,
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
        if (!expectedWallet || account.toLowerCase() === expectedWallet) {
          const response = await fetch("http://localhost:3000/update-wallet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, walletAddress: account }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Không thể cập nhật ví MetaMask!");
          }

          // Cập nhật lại user trong localStorage với walletAddress mới
          const user = JSON.parse(localStorage.getItem("user")) || {};
          user.walletAddress = account;
          localStorage.setItem("user", JSON.stringify(user));

          // Chuyển hướng dựa trên vai trò
          if (user.role === "Producer") {
            navigate("/farms");
          } else if (user.role === "Admin") {
            navigate("/quan-ly");
          } else if (user.role === "Customer") {
            navigate("/");
          } else if (user.role === "ThirdParty") {
            navigate("/third-party");
          } else if (user.role === "DeliveryHub") {
            navigate("/delivery-hub");
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
      } else {
        setError("Không thể kết nối ví MetaMask! Vui lòng thử lại nhé! 😓");
      }
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      setError(error.message || "Không thể kết nối ví MetaMask! 😓");
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

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Bạn là ai? 🌟</InputLabel>
                      <Select
                        value={role}
                        onChange={handleRoleChange}
                        label="Bạn là ai? 🌟"
                      >
                        <MenuItem value="Producer">Người dân</MenuItem>
                        <MenuItem value="Admin">Nhà quản lý</MenuItem>
                        <MenuItem value="Customer">Người tiêu dùng</MenuItem>
                        <MenuItem value="ThirdParty">Nhà vận chuyển</MenuItem>
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
