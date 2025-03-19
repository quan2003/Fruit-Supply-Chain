import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Thêm interceptor để gắn địa chỉ Ethereum vào header của mỗi request
api.interceptors.request.use((config) => {
  const account = localStorage.getItem("account");
  if (account) {
    config.headers["x-ethereum-address"] = account;
  }
  return config;
});

// Hàm lấy thống kê trái cây
export const getFruitStatistics = async () => {
  const response = await api.get("/fruit-statistics");
  return response.data;
};

// Hàm lấy hoạt động gần đây
export const getRecentActivities = async (account) => {
  const response = await api.get(`/recent-activities?account=${account}`);
  return response.data;
};

export default api;
