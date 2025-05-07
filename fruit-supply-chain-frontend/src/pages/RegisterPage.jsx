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
import { useLocation, useNavigate } from "react-router-dom";
import { Facebook, Twitter, Google } from "@mui/icons-material";
import { useWeb3 } from "../contexts/Web3Context";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

const illustrationImage =
  "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80";

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connectWallet, account } = useWeb3();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword || !role) {
      setError("Vui lòng điền đầy đủ thông tin! 😅");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp! 😓");
      return;
    }

    if (!walletConnected || !account) {
      setError("Vui lòng kết nối ví MetaMask trước khi đăng ký! 😅");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          walletAddress: account,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(
          data.message ||
            "Đăng ký thành công! Chuyển hướng đến trang đăng nhập... 🎉"
        );
        setTimeout(() => {
          navigate("/dang-nhap");
        }, 3000); // Tăng thời gian hiển thị thông báo lên 3 giây
      } else {
        setError(data.message || "Đăng ký thất bại! 😓");
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      setError("Có lỗi xảy ra! Vui lòng thử lại nhé! 😓");
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
              {success && (
                <Typography
                  variant="body2"
                  sx={{ color: "green", textAlign: "center", mb: 2 }}
                >
                  {success}
                </Typography>
              )}

              <Box component="form" sx={{ maxWidth: "400px", mx: "auto" }}>
                <TextField
                  fullWidth
                  label="Nhập họ tên"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
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
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  type="password"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <MenuItem value="Government">Cơ quan quản lý</MenuItem>
                    <MenuItem value="DeliveryHub">Trung tâm phân phối</MenuItem>
                  </Select>
                </FormControl>

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
                  onClick={handleRegister}
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
