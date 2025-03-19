// fruit-supply-chain-frontend/src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import DashboardStats from "./DashboardStats";
import RecentActivities from "./RecentActivities";
import QuickActions from "./QuickActions";
import LoadingSpinner from "../common/LoadingSpinner";
import { getFruitCount } from "../../services/fruitService";
import { getAllFarmsService } from "../../services/farmService"; // Sửa từ getAllFarms thành getAllFarmsService
import {
  getRecentEvents,
  getTrendsData,
} from "../../services/analyticsService"; // Sửa từ getTrends thành getTrendsData

const Dashboard = () => {
  const { account } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    fruitCount: 0,
    farmCount: 0,
    inTransit: 0,
    deliveredToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [trends, setTrends] = useState({
    popularFruits: [],
    growingRegions: {},
    qualityTrends: {},
    recommendations: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch fruit count
        const fruitCount = await getFruitCount();

        // Fetch farms
        const farms = await getAllFarmsService();

        // Fetch recent events
        const events = await getRecentEvents(account);

        // Fetch trends
        const trendsData = await getTrendsData("30", "all", "all");

        // Set dashboard stats
        setStats({
          fruitCount: fruitCount || 0,
          farmCount: farms?.length || 0,
          inTransit: 15, // Placeholder - should be fetched from API
          deliveredToday: 42, // Placeholder - should be fetched from API
        });

        setRecentActivities(events || []);
        setTrends(
          trendsData || {
            popularFruits: [],
            growingRegions: {},
            qualityTrends: {},
            recommendations: [],
          }
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (account) {
      fetchDashboardData();
    }
  }, [account]);

  if (!account) {
    return (
      <div className="dashboard welcome-screen">
        <h1>Chào mừng đến với Hệ thống Quản lý Chuỗi Cung ứng Trái cây</h1>
        <p>Vui lòng kết nối ví MetaMask để sử dụng hệ thống</p>
        <div className="feature-highlights">
          <div className="feature">
            <h3>Truy xuất nguồn gốc</h3>
            <p>Theo dõi trái cây từ nông trại đến người tiêu dùng</p>
          </div>
          <div className="feature">
            <h3>Quản lý nông trại</h3>
            <p>
              Cập nhật thông tin và tình trạng nông trại theo thời gian thực
            </p>
          </div>
          <div className="feature">
            <h3>Phân tích dữ liệu</h3>
            <p>Nhận các phân tích và khuyến nghị thông minh</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu..." />;
  }

  return (
    <div className="dashboard">
      <h1>Bảng điều khiển</h1>

      <DashboardStats stats={stats} />

      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="dashboard-section">
            <h2>Xu hướng phổ biến</h2>
            <div className="trends-container">
              <div className="popular-fruits">
                <h3>Trái cây phổ biến</h3>
                <ul>
                  {trends.popularFruits.map((fruit, index) => (
                    <li key={index}>{fruit}</li>
                  ))}
                </ul>
              </div>

              <div className="recommendations">
                <h3>Khuyến nghị</h3>
                <ul>
                  {trends.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="view-more">
              <Link to="/analytics">Xem thêm phân tích →</Link>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          <RecentActivities activities={recentActivities} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
