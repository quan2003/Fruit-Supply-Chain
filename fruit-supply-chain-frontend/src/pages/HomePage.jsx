import React, { useEffect, useState } from "react";
import { Container, Grid, Typography, Box } from "@mui/material";
import { useWeb3Context } from "../contexts/Web3Context";
import Dashboard from "../components/Dashboard/Dashboard";
import RecentActivities from "../components/Dashboard/RecentActivities";
import QuickActions from "../components/Dashboard/QuickActions";
import DashboardStats from "../components/Dashboard/DashboardStats";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/common/Layout";
import { getFruitStatistics, getRecentActivities } from "../services/api";

const HomePage = () => {
  const { isConnected, account } = useWeb3Context();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard statistics from API
        const statsData = await getFruitStatistics();
        setStats(statsData);

        // Fetch recent activities on the blockchain
        const recentActivities = await getRecentActivities(account);
        setActivities(recentActivities);

        // Determine user role based on account or stored preferences
        // This could be fetched from a backend service or blockchain
        const role = localStorage.getItem("userRole") || "consumer";
        setUserRole(role);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Quản lý chuỗi cung ứng trái cây
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Hệ thống truy xuất nguồn gốc trái cây trên nền tảng Blockchain
          </Typography>
        </Box>

        {isConnected ? (
          <>
            <Dashboard />

            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={8}>
                <DashboardStats stats={stats} />
              </Grid>
              <Grid item xs={12} md={4}>
                <QuickActions userRole={userRole} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <RecentActivities activities={activities} />
            </Box>
          </>
        ) : (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Vui lòng kết nối ví để truy cập hệ thống
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sử dụng nút "Kết nối ví" trên thanh công cụ để bắt đầu
            </Typography>
          </Box>
        )}
      </Container>
    </Layout>
  );
};

export default HomePage;
