// fruit-supply-chain-frontend/src/services/fruitService.js
import axios from "axios";

const API_URL = "http://localhost:3000";

// Lấy danh sách sản phẩm
export const getFruitProducts = async (email) => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      params: { email }, // Truyền email qua query parameter
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching fruit products:", error);
    throw new Error("Không thể lấy danh sách sản phẩm từ API");
  }
};

// Lấy sản phẩm theo ID
export const getFruitProductById = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit product with ID ${productId}:`, error);
    throw new Error(
      `Không thể lấy thông tin sản phẩm với ID ${productId} từ API`
    );
  }
};

// Thêm sản phẩm mới
export const addFruitProduct = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/products`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding fruit product:", error);
    throw new Error("Không thể thêm sản phẩm mới");
  }
};

// Kiểm tra thông tin giao dịch mua sản phẩm
export const purchaseProduct = async (productId, buyerAddress, quantity) => {
  try {
    const response = await axios.post(`${API_URL}/purchase-product`, {
      productId,
      buyerAddress,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Error processing purchase request:", error);
    throw new Error("Không thể xử lý yêu cầu mua sản phẩm");
  }
};

// Thêm sản phẩm vào kho sau khi giao dịch thành công
export const addToInventory = async (
  productId,
  deliveryHubId,
  quantity,
  price
) => {
  try {
    const response = await axios.post(`${API_URL}/add-to-inventory`, {
      productId,
      deliveryHubId,
      quantity,
      price,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding to inventory:", error);
    throw new Error("Không thể thêm sản phẩm vào kho");
  }
};

// Lấy danh sách sản phẩm trong kho của đại lý
export const getInventory = async (deliveryHubId) => {
  try {
    const response = await axios.get(`${API_URL}/inventory/${deliveryHubId}`);
    return response.data.map((item) => ({
      ...item,
      productdate: item.productdate || new Date().toISOString(),
      expirydate:
        item.expirydate ||
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw new Error("Không thể lấy danh sách sản phẩm trong kho");
  }
};
