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
import Footer from "../components/common/Footer"; // Thêm Footer
import Sidebar from "../components/common/Sidebar"; // Thêm Sidebar
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

  if (!account) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mt: 4 }}>
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
                }}
              >
                Chào mừng đến với Hệ thống Quản lý Chuỗi Cung ứng Trái cây
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Vui lòng kết nối ví MetaMask để sử dụng hệ thống
              </Typography>
            </motion.div>
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">
                          Truy xuất nguồn gốc
                        </Typography>
                        <Typography variant="body2">
                          Theo dõi trái cây từ nông trại đến người tiêu dùng
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">Quản lý nông trại</Typography>
                        <Typography variant="body2">
                          Cập nhật thông tin và tình trạng nông trại theo thời
                          gian thực
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #FF9800 30%, #FFC107 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">Phân tích dữ liệu</Typography>
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
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: "flex" }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1 }}>
          <Container maxWidth="lg">
            <Box sx={{ mt: 4 }}>
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
                  }}
                >
                  Tổng quan hệ thống
                </Typography>
              </motion.div>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <TrendingUp sx={{ mr: 1 }} />
                          <Typography variant="h6">Tổng số trái cây</Typography>
                        </Box>
                        <Typography variant="h4">
                          {stats.totalFruits}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Agriculture sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            Tổng số nông trại
                          </Typography>
                        </Box>
                        <Typography variant="h4">{stats.totalFarms}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #FF9800 30%, #FFC107 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <LocalFlorist sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            Trái cây phổ biến
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {stats.popularFruits.join(", ")}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      sx={{
                        background:
                          "linear-gradient(45deg, #F44336 30%, #E57373 90%)",
                        color: "white",
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <History sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            Hoạt động gần đây
                          </Typography>
                        </Box>
                        <List dense>
                          {recentActivities
                            .slice(0, 3)
                            .map((activity, index) => (
                              <Fade
                                in={true}
                                timeout={500 * (index + 1)}
                                key={index}
                              >
                                <ListItem>
                                  <ListItemIcon>
                                    <History sx={{ color: "white" }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={activity.message}
                                    secondary={new Date(
                                      activity.timestamp
                                    ).toLocaleString()}
                                    primaryTypographyProps={{ color: "white" }}
                                    secondaryTypographyProps={{
                                      color: "rgba(255, 255, 255, 0.7)",
                                    }}
                                  />
                                </ListItem>
                              </Fade>
                            ))}
                        </List>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          component={Link}
                          to="/dashboard"
                          sx={{ color: "white" }}
                        >
                          Xem thêm
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </Layout>
  );
};

export default HomePage;
