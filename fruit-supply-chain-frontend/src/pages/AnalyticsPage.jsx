import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import Layout from "../components/common/Layout";
import TrendsChart from "../components/Analytics/TrendsChart";
import QualityMap from "../components/Analytics/QualityMap";
import Recommendations from "../components/Analytics/Recommendations";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3Context } from "../contexts/useWeb3";
import { useAuthContext } from "../contexts/AuthContext";
import {
  getTrendsData,
  getQualityMapData,
  getRecommendations,
  exportAnalyticsReport,
} from "../services/analyticsService";

const AnalyticsPage = () => {
  const { isConnected, account } = useWeb3();
  const { user } = useAuthContext();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState([]);
  const [qualityMapData, setQualityMapData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [timeRange, setTimeRange] = useState("30");
  const [fruitType, setFruitType] = useState("all");
  const [region, setRegion] = useState("all");

  const [fruitTypes, setFruitTypes] = useState([]);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch available fruit types from blockchain data
        const types = await fetch("/api/fruitTypes").then((res) => res.json());
        setFruitTypes(types);

        // Fetch available regions from blockchain data
        const regionList = await fetch("/api/regions").then((res) =>
          res.json()
        );
        setRegions(regionList);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    if (isConnected) {
      fetchFilters();
    }
  }, [isConnected]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trends data based on filters
        const trends = await getTrendsData(timeRange, fruitType, region);
        setTrendsData(trends);

        // Fetch quality map data based on filters
        const qualityData = await getQualityMapData(
          timeRange,
          fruitType,
          region
        );
        setQualityMapData(qualityData);

        // Fetch recommendations based on user role and filters
        const userRole = user?.role || "consumer";
        const recs = await getRecommendations(
          userRole,
          timeRange,
          fruitType,
          region
        );
        setRecommendations(recs);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConnected, timeRange, fruitType, region, user?.role]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleFruitTypeChange = (event) => {
    setFruitType(event.target.value);
  };

  const handleRegionChange = (event) => {
    setRegion(event.target.value);
  };

  const handleRefresh = () => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trends data based on filters
        const trends = await getTrendsData(timeRange, fruitType, region);
        setTrendsData(trends);

        // Fetch quality map data based on filters
        const qualityData = await getQualityMapData(
          timeRange,
          fruitType,
          region
        );
        setQualityMapData(qualityData);

        // Fetch recommendations based on user role and filters
        const userRole = user?.role || "consumer";
        const recs = await getRecommendations(
          userRole,
          timeRange,
          fruitType,
          region
        );
        setRecommendations(recs);

        setLoading(false);
      } catch (error) {
        console.error("Error refreshing analytics data:", error);
        setLoading(false);
      }
    };

    fetchData();
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportAnalyticsReport(timeRange, fruitType, region);
      setLoading(false);
    } catch (error) {
      console.error("Error exporting report:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Phân tích dữ liệu
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Xuất báo cáo
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={timeRange}
                  label="Khoảng thời gian"
                  onChange={handleTimeRangeChange}
                >
                  <MenuItem value="7">7 ngày gần đây</MenuItem>
                  <MenuItem value="30">30 ngày gần đây</MenuItem>
                  <MenuItem value="90">3 tháng gần đây</MenuItem>
                  <MenuItem value="180">6 tháng gần đây</MenuItem>
                  <MenuItem value="365">1 năm gần đây</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại trái cây</InputLabel>
                <Select
                  value={fruitType}
                  label="Loại trái cây"
                  onChange={handleFruitTypeChange}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {fruitTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Khu vực</InputLabel>
                <Select
                  value={region}
                  label="Khu vực"
                  onChange={handleRegionChange}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {regions.map((reg) => (
                    <MenuItem key={reg.id} value={reg.id}>
                      {reg.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Xu hướng thị trường" />
            <Tab label="Bản đồ chất lượng" />
            <Tab label="Khuyến nghị" />
          </Tabs>
        </Box>

        {!isConnected ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">
              Vui lòng kết nối ví để xem phân tích dữ liệu
            </Typography>
          </Box>
        ) : (
          <>
            {tabValue === 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Xu hướng thị trường
                </Typography>
                <TrendsChart data={trendsData} />
              </Paper>
            )}

            {tabValue === 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Bản đồ chất lượng theo vùng
                </Typography>
                <QualityMap data={qualityMapData} />
              </Paper>
            )}

            {tabValue === 2 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Khuyến nghị dựa trên dữ liệu
                </Typography>
                <Recommendations
                  data={recommendations}
                  userRole={user?.role || "consumer"}
                />
              </Paper>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default AnalyticsPage;
