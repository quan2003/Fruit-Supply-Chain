// fruit-supply-chain-frontend/src/services/fruitService.js
import axios from "axios";

const API_URL = "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lấy danh sách sản phẩm
export const getFruitProducts = async (email, headers = {}) => {
  try {
    const response = await axiosInstance.get("/products", {
      params: { email },
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching fruit products:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy danh sách sản phẩm từ API"
    );
  }
};

// Lấy sản phẩm theo ID
export const getFruitProductById = async (productId, headers = {}) => {
  try {
    const response = await axiosInstance.get(`/products/${productId}`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit product with ID ${productId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        `Không thể lấy thông tin sản phẩm với ID ${productId} từ API`
    );
  }
};

// Thêm sản phẩm mới
export const addFruitProduct = async (productData, headers = {}) => {
  try {
    const response = await axiosInstance.post("/products", productData, {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding fruit product:", error);
    throw new Error(error.response?.data?.message || "Không thể thêm sản phẩm");
  }
};

// Kiểm tra thông tin giao dịch mua sản phẩm
export const purchaseProduct = async (
  productId,
  buyerAddress,
  quantity,
  headers = {}
) => {
  try {
    // Kiểm tra buyerAddress hợp lệ
    if (!buyerAddress || !/^(0x)?[0-9a-fA-F]{40}$/.test(buyerAddress)) {
      throw new Error("Địa chỉ ví người mua không hợp lệ");
    }

    // Đảm bảo có header x-ethereum-address
    const finalHeaders = {
      ...headers,
      "x-ethereum-address": buyerAddress,
    };

    console.log("Headers being sent to purchase-product:", finalHeaders);

    const response = await axiosInstance.post(
      "/purchase-product",
      {
        productId,
        buyerAddress,
        quantity,
      },
      {
        headers: finalHeaders,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error processing purchase request:", error);
    throw new Error(
      error.response?.data?.message || "Không thể xử lý yêu cầu mua sản phẩm"
    );
  }
};

// Thêm sản phẩm vào kho sau khi giao dịch thành công
export const addToInventory = async (
  productId,
  deliveryHubId,
  quantity,
  price,
  productdate,
  expirydate,
  transactionHash,
  headers = {}
) => {
  try {
    // Kiểm tra xem headers có x-ethereum-address hay không
    if (!headers["x-ethereum-address"]) {
      throw new Error("Thiếu địa chỉ ví trong headers");
    }

    const finalHeaders = {
      ...headers,
      "x-ethereum-address": headers["x-ethereum-address"],
    };

    console.log("Headers being sent to add-to-inventory:", finalHeaders);

    const response = await axiosInstance.post(
      "/add-to-inventory",
      {
        productId,
        deliveryHubId,
        quantity,
        price,
        productdate,
        expirydate,
        transactionHash,
      },
      {
        headers: finalHeaders,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding to inventory:", error);
    throw new Error(
      error.response?.data?.message || "Không thể thêm sản phẩm vào kho"
    );
  }
};

// Lấy danh sách sản phẩm trong kho của đại lý
export const getInventory = async (deliveryHubId, headers = {}) => {
  try {
    const response = await axiosInstance.get(`/inventory/${deliveryHubId}`, {
      headers: {
        ...headers,
      },
    });
    return response.data.map((item) => ({
      ...item,
      productdate: item.productdate || new Date().toISOString(),
      expirydate:
        item.expirydate ||
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw new Error(
      error.response?.data?.message ||
        "Không thể lấy danh sách sản phẩm trong kho"
    );
  }
};

// Lấy danh sách farm của người dùng
export const getUserFarms = async (email, headers = {}) => {
  try {
    const response = await axiosInstance.get("/farms/user", {
      params: { email },
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user farms:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy danh sách farm từ API"
    );
  }
};

// Tạo farm mới
export const createFarm = async (farmData, headers = {}) => {
  try {
    const response = await axiosInstance.post("/farm", farmData, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating farm:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Không thể tạo farm. Vui lòng kiểm tra thông tin và thử lại.";
    throw new Error(errorMessage);
  }
};
