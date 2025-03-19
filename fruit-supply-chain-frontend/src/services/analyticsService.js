// fruit-supply-chain-frontend/src/services/analyticsService.js
import axios from "axios";
const API_URL = "http://localhost:3000";

export const getPopularFruit = async () => {
  const response = await axios.get(`${API_URL}/popular`);
  return response.data;
};

export const getTrendsData = async (timeRange, fruitType, region) => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    { date: "2025-03-01", value: 100 },
    { date: "2025-03-02", value: 120 },
    { date: "2025-03-03", value: 90 },
  ];
};

export const getQualityMapData = async (timeRange, fruitType, region) => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    { region: "Tiền Giang", quality: 85 },
    { region: "Bình Thuận", quality: 70 },
    { region: "Đồng Tháp", quality: 90 },
  ];
};

export const getRecommendations = async (
  userRole,
  timeRange,
  fruitType,
  region
) => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    "Tăng sản lượng xoài tại Tiền Giang do nhu cầu cao.",
    "Cải thiện điều kiện bảo quản tại Đồng Tháp.",
  ];
};

export const exportAnalyticsReport = async (timeRange, fruitType, region) => {
  // Giả lập xuất báo cáo, bạn có thể thay bằng API thật
  console.log(
    `Exporting report for timeRange: ${timeRange}, fruitType: ${fruitType}, region: ${region}`
  );
};

export const getRecentEvents = async (account) => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    {
      message: `Người dùng ${account} đã thu hoạch lô trái cây mới`,
      timestamp: Date.now() - 100000,
    },
    {
      message: `Người dùng ${account} đã ghi nhận bước vận chuyển`,
      timestamp: Date.now() - 50000,
    },
  ];
};
