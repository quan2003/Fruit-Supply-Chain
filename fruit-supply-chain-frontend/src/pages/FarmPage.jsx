// fruit-supply-chain-frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Agriculture,
  LocalFlorist,
  History,
} from "@mui/icons-material";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";
import Sidebar from "../components/common/Sidebar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context";
import { getFruitStatistics, getRecentActivities } from "../services/api";

const HomePage = () => {
  const { account } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFruits: 0,
    totalFarms: 0,
    popularFruits: [],
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsData = await getFruitStatistics();
        const activities = await getRecentActivities(account);

        setStats(statsData);
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (account) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [account]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Pre-login landing page for users without MetaMask connection
  if (!account) {
    return (
      <Layout>
        <Box
          sx={{
            display: "flex",
            minHeight: "calc(100vh - 140px)",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="lg">
              <Box sx={{ py: { xs: 4, md: 6 } }}>
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      background:
                        "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textAlign: "center",
                    }}
                  >
                    Chào mừng đến với Hệ thống Quản lý Chuỗi Cung ứng Trái cây
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ textAlign: "center", mb: 4 }}
                  >
                    Vui lòng kết nối ví MetaMask để sử dụng hệ thống
                  </Typography>
                </motion.div>
                <Box sx={{ mt: 4 }}>
                  <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} sm={6} md={4}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          sx={{
                            background:
                              "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                            color: "white",
                            borderRadius: 2,
                            height: 140,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold" }}
                            >
                              Truy xuất nguồn gốc
                            </Typography>
                            <Typography variant="body2">
                              Theo dõi trái cây từ nông trại đến người tiêu dùng
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          sx={{
                            background:
                              "linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)",
                            color: "white",
                            borderRadius: 2,
                            height: 140,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold" }}
                            >
                              Quản lý nông trại
                            </Typography>
                            <Typography variant="body2">
                              Cập nhật thông tin và tình trạng nông trại theo
                              thời gian thực
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          sx={{
                            background:
                              "linear-gradient(45deg, #FF9800 30%, #FFC107 90%)",
                            color: "white",
                            borderRadius: 2,
                            height: 140,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold" }}
                            >
                              Phân tích dữ liệu
                            </Typography>
                            <Typography variant="body2">
                              Nhận các phân tích và khuyến nghị thông minh
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Container>
          </Box>
          <Footer />
        </Box>
      </Layout>
    );
  }

  // Main dashboard for logged in users
  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 140px)",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: "#f5f5f5",
              py: 4,
              px: { xs: 2, md: 3 },
              ml: { xs: 0, md: "250px" }, // Space for sidebar on larger screens
              width: { xs: "100%", md: "calc(100% - 250px)" }, // Adjust width based on sidebar
              minHeight: "100%",
              pb: 8, // Ensure space for Footer
            }}
          >
            <Container maxWidth="lg">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    background:
                      "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textAlign: "center",
                    mb: 3,
                  }}
                >
                  Tổng quan hệ thống
                </Typography>
              </motion.div>

              {/* Statistics Cards */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                        color: "white",
                        borderRadius: 2,
                        boxShadow: 3,
                        height: 160,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            justifyContent: "center",
                          }}
                        >
                          <TrendingUp sx={{ mr: 1, fontSize: 30 }} />
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Tổng số trái cây
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ textAlign: "center" }}>
                          {stats.totalFruits}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)",
                        color: "white",
                        borderRadius: 2,
                        boxShadow: 3,
                        height: 160,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            justifyContent: "center",
                          }}
                        >
                          <Agriculture sx={{ mr: 1, fontSize: 30 }} />
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Tổng số nông trại
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ textAlign: "center" }}>
                          {stats.totalFarms}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #FF9800 30%, #FFC107 90%)",
                        color: "white",
                        borderRadius: 2,
                        boxShadow: 3,
                        height: 160,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            justifyContent: "center",
                          }}
                        >
                          <LocalFlorist sx={{ mr: 1, fontSize: 30 }} />
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Trái cây phổ biến
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{ textAlign: "center" }}
                        >
                          {stats.popularFruits.join(", ")}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>

              {/* Recent Activities Section */}
              {recentActivities.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      background:
                        "linear-gradient(45deg, #F44336 30%, #E57373 90%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textAlign: "center",
                      mb: 2,
                    }}
                  >
                    Hoạt động gần đây
                  </Typography>
                  <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                      <List>
                        {recentActivities.slice(0, 5).map((activity, index) => (
                          <ListItem key={index} divider={index < 4}>
                            <ListItemIcon>
                              <History color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={activity.message}
                              secondary={new Date(
                                activity.timestamp
                              ).toLocaleString()}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "center" }}>
                      <Button
                        size="small"
                        component={Link}
                        to="/dashboard"
                        sx={{ color: "#F44336", fontWeight: "bold" }}
                      >
                        Xem tất cả hoạt động
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              )}

              {/* Why Choose Us Section */}
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    background:
                      "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textAlign: "center",
                    mb: 3,
                  }}
                >
                  Tại sao chọn chúng tôi?
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 2,
                          boxShadow: 3,
                          height: 140,
                          transition: "transform 0.3s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: 5,
                          },
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#2196F3", mb: 1 }}
                          >
                            Minh bạch
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Theo dõi toàn bộ chuỗi cung ứng từ nông trại đến tay
                            người tiêu dùng với công nghệ blockchain.
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 2,
                          boxShadow: 3,
                          height: 140,
                          transition: "transform 0.3s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: 5,
                          },
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#4CAF50", mb: 1 }}
                          >
                            Hiệu quả
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tối ưu hóa quy trình quản lý nông trại và phân phối
                            với dữ liệu thời gian thực.
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 2,
                          boxShadow: 3,
                          height: 140,
                          transition: "transform 0.3s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: 5,
                          },
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#FF9800", mb: 1 }}
                          >
                            Đáng tin cậy
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Đảm bảo chất lượng trái cây với hệ thống kiểm tra và
                            phân tích thông minh.
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              </Box>
            </Container>
          </Box>
        </Box>
        <Footer />
      </Box>
    </Layout>
  );
};

export default HomePage;
