// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:3000";

// Tạo instance axios với baseURL cố định
const api = axios.create({
  baseURL: API_URL,
});

// Hàm lấy token hoặc địa chỉ ví từ context (giả định)
const getAuthHeaders = () => {
  const walletAddress =
    localStorage.getItem("walletAddress") ||
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Thay bằng logic thực tế để lấy wallet address
  return { "x-ethereum-address": walletAddress };
};

// === Quản lý trái cây ===
export const getAllFruits = async () => {
  try {
    const response = await api.get("/all-fruits", {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all fruits:", error);
    throw error;
  }
};

export const getFruit = async (fruitId) => {
  try {
    const response = await api.get(`/fruit/${fruitId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit with ID ${fruitId}:`, error);
    throw error;
  }
};

export const harvestFruit = async (data) => {
  try {
    const response = await api.post("/harvest", data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error harvesting fruit:", error);
    throw error;
  }
};

export const recordStep = async (data) => {
  try {
    const response = await api.post("/record-step", data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error recording step:", error);
    throw error;
  }
};

export const updateRegion = async (data) => {
  try {
    const response = await api.post("/update-region", data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error updating region:", error);
    throw error;
  }
};

export const getPopularFruit = async () => {
  try {
    const response = await api.get("/popular", { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching popular fruit:", error);
    throw error;
  }
};

// === Quản lý sản phẩm ===
export const getAllFruitProducts = async () => {
  try {
    const response = await api.get("/products", { headers: getAuthHeaders() });
    console.log("API response from /products:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all fruit products:", error);
    throw error;
  }
};

export const getFruitProduct = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`, {
      headers: getAuthHeaders(),
    });
    console.log(`API response for product ${productId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit product with ID ${productId}:`, error);
    throw error;
  }
};

export const createFruitProduct = async (formData) => {
  try {
    const response = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    console.log("API response for creating product:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating fruit product:", error);
    throw error;
  }
};

// === Quản lý nông trại ===
export const getAllFarms = async () => {
  try {
    const response = await api.get("/farms", { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching all farms:", error);
    throw error;
  }
};

export const getFarm = async (farmId) => {
  try {
    const response = await api.get(`/farms/${farmId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw error;
  }
};

export const registerFarm = async (farmData) => {
  try {
    const response = await api.post("/farm", farmData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error registering farm:", error);
    throw error;
  }
};

export const updateFarmConditions = async (farmId, conditions) => {
  try {
    const response = await api.put(
      `/farm/${farmId}`,
      { conditions },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating conditions for farm ${farmId}:`, error);
    throw error;
  }
};

// === Quản lý người quản lý ===
export const getAllManagers = async () => {
  try {
    const response = await api.get("/users", { headers: getAuthHeaders() });
    return response.data.filter((user) => user.role === "Admin");
  } catch (error) {
    console.error("Error fetching all managers:", error);
    throw error;
  }
};

export const addManager = async (managerData) => {
  try {
    const response = await api.post("/manager", managerData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error adding manager:", error);
    if (error.response) {
      // Backend trả về lỗi cụ thể (như 404, 400, v.v.)
      if (error.response.status === 404) {
        const message =
          error.response.data.message ||
          "Không tìm thấy endpoint hoặc người dùng với địa chỉ ví này!";
        throw new Error(message);
      } else if (error.response.status === 400) {
        throw new Error(
          error.response.data.message || "Địa chỉ ví không hợp lệ!"
        );
      } else {
        throw new Error(error.response.data.message || "Lỗi khi thêm quản lý!");
      }
    } else if (error.request) {
      // Không nhận được phản hồi từ backend
      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối!"
      );
    } else {
      throw new Error("Lỗi không xác định khi thêm quản lý!");
    }
  }
};
// === Thông tin blockchain và hệ thống ===
export const getBlockchainInfo = async () => {
  try {
    const response = await api.get("/contract-address", {
      headers: getAuthHeaders(),
    });
    return {
      network: "Localhost",
      contractStatus: "Active",
      currentBlock: "N/A", // Có thể lấy từ blockchain nếu cần
      contractAddress: response.data.address,
      version: "1.0.0",
      deploymentDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching blockchain info:", error);
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
    const response = await api.get("/stats", { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      totalFarms: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalShipments: 0,
      totalProductsListed: 0,
      totalTransactions: 0,
      recentActivities: [],
    }; // Trả về dữ liệu mặc định để tránh crash
  }
};

// === Thống kê và hoạt động ===
export const getFruitStatistics = async () => {
  try {
    const response = await api.get("/analytics/trends", {
      headers: getAuthHeaders(),
    });
    return {
      totalFruits: response.data.popularFruits.length,
      totalFarms: Object.keys(response.data.growingRegions).length,
      popularFruits: response.data.popularFruits,
    };
  } catch (error) {
    console.error("Error fetching fruit statistics:", error);
    throw error;
  }
};

export const getRecentActivities = async (account) => {
  try {
    const response = await api.get("/stats", { headers: getAuthHeaders() });
    return response.data.recentActivities || [];
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
    const response = await api.get("/catalogs", { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching fruit catalogs:", error);
    throw error;
  }
};

export const addRecommendation = async (data) => {
  try {
    const response = await api.post("/recommendation", data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error adding recommendation:", error);
    throw error;
  }
};
export const revokeManagerRole = async (walletAddress) => {
  try {
    const response = await api.delete(`/manager/${walletAddress}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error revoking manager role for wallet ${walletAddress}:`,
      error
    );
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Không tìm thấy quản lý với địa chỉ ví này!");
      } else if (error.response.status === 400) {
        throw new Error(
          error.response.data.message || "Địa chỉ ví không hợp lệ!"
        );
      } else if (error.response.status === 403) {
        throw new Error(
          error.response.data.message ||
            "Không có quyền thực hiện hành động này!"
        );
      } else {
        throw new Error(
          error.response.data.message || "Lỗi khi thu hồi quyền quản lý!"
        );
      }
    } else if (error.request) {
      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối!"
      );
    } else {
      throw new Error("Lỗi không xác định khi thu hồi quyền quản lý!");
    }
  }
};
export const searchUsers = async (role = "", search = "") => {
  try {
    const response = await api.get("/users", {
      headers: getAuthHeaders(),
      params: { role, search },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};
