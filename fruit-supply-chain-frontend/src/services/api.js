// fruit-supply-chain-frontend/src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:3000";

export const getAllFruits = async () => {
  const response = await axios.get(`${API_URL}/all-fruits`);
  return response.data;
};

export const getFruit = async (fruitId) => {
  const response = await axios.get(`${API_URL}/fruit/${fruitId}`);
  return response.data;
};

export const harvestFruit = async (data) => {
  const response = await axios.post(`${API_URL}/harvest`, data);
  return response.data;
};

export const recordStep = async (data) => {
  const response = await axios.post(`${API_URL}/record-step`, data);
  return response.data;
};

export const updateRegion = async (data) => {
  const response = await axios.post(`${API_URL}/update-region`, data);
  return response.data;
};

export const getPopularFruit = async () => {
  const response = await axios.get(`${API_URL}/popular`);
  return response.data;
};

export const getAllFarms = async () => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    {
      id: "1",
      name: "Nông trại Tiền Giang",
      location: "Tiền Giang",
      owner: "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC",
      ownerAddress: "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC",
    },
    {
      id: "2",
      name: "Nông trại Bình Thuận",
      location: "Bình Thuận",
      owner: "0x1234567890abcdef1234567890abcdef12345678",
      ownerAddress: "0x1234567890abcdef1234567890abcdef12345678",
    },
  ];
};

export const getFarm = async (farmId) => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  const farms = await getAllFarms();
  return farms.find((farm) => farm.id === farmId) || null;
};

export const registerFarm = async (farmData) => {
  // Giả lập đăng ký nông trại, bạn có thể thay bằng API thật
  return { id: "3", ...farmData };
};

export const updateFarmConditions = async (farmId, conditions) => {
  // Giả lập cập nhật điều kiện nông trại, bạn có thể thay bằng API thật
  return { id: farmId, conditions };
};

export const getAllManagers = async () => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return [
    {
      id: "1",
      name: "Manager 1",
      walletAddress: "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC",
    },
    {
      id: "2",
      name: "Manager 2",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    },
  ];
};

export const addManager = async (managerData) => {
  // Giả lập thêm quản lý, bạn có thể thay bằng API thật
  return { id: "3", ...managerData };
};

export const revokeManagerRole = async (managerId) => {
  // Giả lập thu hồi quyền quản lý, bạn có thể thay bằng API thật
  console.log(`Revoking manager role for ID: ${managerId}`);
  return { success: true };
};

export const getBlockchainInfo = async () => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return {
    network: "Ganache",
    contractStatus: "Active",
    currentBlock: 123456,
    contractAddress: "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d",
    version: "1.0.0",
    deploymentDate: Date.now() - 1000000,
    lastUpdated: Date.now(),
  };
};

export const getSystemStats = async () => {
  // Giả lập dữ liệu, bạn có thể thay bằng API thật
  return {
    totalFarms: 5,
    totalBatches: 10,
    totalTransactions: 500,
    totalUsers: 100,
    recentActivities: [
      {
        message: "Lô trái cây mới được thu hoạch",
        timestamp: Date.now() - 100000,
      },
      { message: "Giao dịch mới được ghi nhận", timestamp: Date.now() - 50000 },
    ],
  };
};

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
