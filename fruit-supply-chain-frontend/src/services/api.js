// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:3000";

// Tạo instance axios với baseURL cố định
const api = axios.create({
  baseURL: API_URL,
});

// === Quản lý trái cây ===
export const getAllFruits = async () => {
  try {
    const response = await api.get("/all-fruits");
    return response.data;
  } catch (error) {
    console.error("Error fetching all fruits:", error);
    throw error;
  }
};

export const getFruit = async (fruitId) => {
  try {
    const response = await api.get(`/fruit/${fruitId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit with ID ${fruitId}:`, error);
    throw error;
  }
};

export const harvestFruit = async (data) => {
  try {
    const response = await api.post("/harvest", data);
    return response.data;
  } catch (error) {
    console.error("Error harvesting fruit:", error);
    throw error;
  }
};

export const recordStep = async (data) => {
  try {
    const response = await api.post("/record-step", data);
    return response.data;
  } catch (error) {
    console.error("Error recording step:", error);
    throw error;
  }
};

export const updateRegion = async (data) => {
  try {
    const response = await api.post("/update-region", data);
    return response.data;
  } catch (error) {
    console.error("Error updating region:", error);
    throw error;
  }
};

export const getPopularFruit = async () => {
  try {
    const response = await api.get("/popular");
    return response.data;
  } catch (error) {
    console.error("Error fetching popular fruit:", error);
    throw error;
  }
};

// === Quản lý sản phẩm ===
export const getAllFruitProducts = async () => {
  try {
    const response = await api.get("/products");
    console.log("API response from /products:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all fruit products:", error);
    // Dữ liệu giả lập nếu API thất bại
    const fakeData = [
      {
        id: "1",
        name: "Táo Fuji",
        productcode: "TAO001",
        category: "ban cho",
        description: "Táo ngon, ngọt, giòn",
        price: 50000,
        quantity: 100,
        imageurl: "https://via.placeholder.com/150",
        productiondate: "2025-01-01",
        expirydate: "2025-06-01",
      },
      {
        id: "2",
        name: "Chuối Đà Lạt",
        productcode: "CHUOI001",
        category: "nhap vao",
        description: "Chuối ngọt, thơm",
        price: 30000,
        quantity: 200,
        imageurl: "https://via.placeholder.com/150",
        productiondate: "2025-02-01",
        expirydate: "2025-04-01",
      },
    ];
    console.log("Returning fake data:", fakeData);
    return fakeData;
  }
};

export const getFruitProduct = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);
    console.log(`API response for product ${productId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit product with ID ${productId}:`, error);
    const products = await getAllFruitProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
};

export const createFruitProduct = async (productData) => {
  try {
    const response = await api.post("/products", productData);
    console.log("API response for creating product:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating fruit product:", error);
    return { id: Date.now().toString(), ...productData };
  }
};

// === Quản lý nông trại ===
export const getAllFarms = async () => {
  try {
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
  } catch (error) {
    console.error("Error fetching all farms:", error);
    throw error;
  }
};

export const getFarm = async (farmId) => {
  try {
    const farms = await getAllFarms();
    const farm = farms.find((f) => f.id === farmId);
    if (!farm) throw new Error(`Farm with ID ${farmId} not found`);
    return farm;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw error;
  }
};

export const registerFarm = async (farmData) => {
  try {
    return { id: "3", ...farmData };
  } catch (error) {
    console.error("Error registering farm:", error);
    throw error;
  }
};

export const updateFarmConditions = async (farmId, conditions) => {
  try {
    return { id: farmId, conditions };
  } catch (error) {
    console.error(`Error updating conditions for farm ${farmId}:`, error);
    throw error;
  }
};

// === Quản lý người quản lý ===
export const getAllManagers = async () => {
  try {
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
  } catch (error) {
    console.error("Error fetching all managers:", error);
    throw error;
  }
};

export const addManager = async (managerData) => {
  try {
    return { id: "3", ...managerData };
  } catch (error) {
    console.error("Error adding manager:", error);
    throw error;
  }
};

export const revokeManagerRole = async (managerId) => {
  try {
    console.log(`Revoking manager role for ID: ${managerId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error revoking manager role for ID ${managerId}:`, error);
    throw error;
  }
};

// === Thông tin blockchain và hệ thống ===
export const getBlockchainInfo = async () => {
  try {
    return {
      network: "Ganache",
      contractStatus: "Active",
      currentBlock: 123456,
      contractAddress: "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d",
      version: "1.0.0",
      deploymentDate: Date.now() - 1000000,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching blockchain info:", error);
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
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
        {
          message: "Giao dịch mới được ghi nhận",
          timestamp: Date.now() - 50000,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

// === Thống kê và hoạt động ===
export const getFruitStatistics = async () => {
  try {
    return {
      totalFruits: 10,
      totalFarms: 5,
      popularFruits: ["Xoài", "Thanh Long", "Chuối"],
    };
  } catch (error) {
    console.error("Error fetching fruit statistics:", error);
    throw error;
  }
};

export const getRecentActivities = async (account) => {
  try {
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
  } catch (error) {
    console.error(
      `Error fetching recent activities for account ${account}:`,
      error
    );
    throw error;
  }
};

// === Danh mục trái cây ===
export const getAllFruitCatalogs = async () => {
  try {
    return [
      {
        id: "1",
        name: "Xoài",
        origin: "Tiền Giang",
        description: "Xoài ngọt, chất lượng cao",
      },
      {
        id: "2",
        name: "Thanh Long",
        origin: "Bình Thuận",
        description: "Thanh long đỏ, tươi ngon",
      },
    ];
  } catch (error) {
    console.error("Error fetching fruit catalogs:", error);
    throw error;
  }
};

export const addRecommendation = async (data) => {
  try {
    return { id: "rec1", ...data };
  } catch (error) {
    console.error("Error adding recommendation:", error);
    throw error;
  }
};
