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
} from "@mui/material";
import { Link } from "react-router-dom";
import Layout from "../components/common/Layout";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context"; // Sửa từ useWeb3Context thành useWeb3
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
            <Typography variant="h4" gutterBottom>
              Chào mừng đến với Hệ thống Quản lý Chuỗi Cung ứng Trái cây
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Vui lòng kết nối ví MetaMask để sử dụng hệ thống
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Truy xuất nguồn gốc</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Theo dõi trái cây từ nông trại đến người tiêu dùng
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Quản lý nông trại</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cập nhật thông tin và tình trạng nông trại theo thời
                        gian thực
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Phân tích dữ liệu</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nhận các phân tích và khuyến nghị thông minh
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Tổng quan hệ thống
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Tổng số trái cây</Typography>
                  <Typography variant="h4">{stats.totalFruits}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Tổng số nông trại</Typography>
                  <Typography variant="h4">{stats.totalFarms}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Trái cây phổ biến</Typography>
                  <Typography variant="body1">
                    {stats.popularFruits.join(", ")}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Hoạt động gần đây</Typography>
                  <List dense>
                    {recentActivities.slice(0, 3).map((activity, index) => (
                      <ListItem key={index}>
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
                <CardActions>
                  <Button size="small" component={Link} to="/dashboard">
                    Xem thêm
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default HomePage;
