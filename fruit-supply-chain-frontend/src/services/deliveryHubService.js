import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Hàm lấy header với x-ethereum-address
const getEthereumHeaders = () => {
  const address = window.ethereum?.selectedAddress;
  if (!address || !/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(
      "Ví MetaMask chưa được kết nối hoặc địa chỉ ví không hợp lệ! Vui lòng kết nối ví để tiếp tục."
    );
  }
  console.log("Địa chỉ ví gửi trong header:", address);
  return { "x-ethereum-address": address };
};

// Lấy danh sách lô hàng đến
export const getIncomingShipments = async () => {
  try {
    const response = await axios.get(`${API_URL}/incoming-shipments`, {
      headers: getEthereumHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lô hàng đến:", error);
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Không thể tải danh sách lô hàng đến"
    );
  }
};

// Lấy danh sách lô hàng đi
export const getOutgoingShipments = async () => {
  try {
    const response = await axios.get(`${API_URL}/outgoing-shipments`, {
      headers: getEthereumHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lô hàng đi:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách lô hàng đi"
    );
  }
};

// Lấy danh sách sản phẩm trong kho
export const getInventory = async (deliveryHubId) => {
  try {
    console.log("Lấy danh sách kho cho deliveryHubId:", deliveryHubId);
    const headers = getEthereumHeaders();
    const response = await axios.get(`${API_URL}/inventory/${deliveryHubId}`, {
      headers,
    });
    console.log("Kết quả kho:", response.data);
    response.data.forEach((item) => {
      console.log("Item trong kho:", item);
      if (!item.product_id || !item.fruit_id) {
        console.warn("Item thiếu product_id hoặc fruit_id:", item);
      }
    });
    return response.data.map((item) => ({
      ...item,
      productdate: item.productdate || new Date().toISOString(),
      expirydate:
        item.expirydate ||
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kho:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách sản phẩm trong kho"
    );
  }
};
// Nhận lô hàng
export const receiveShipment = async (shipmentId) => {
  try {
    const response = await axios.post(
      `${API_URL}/receive-shipment`,
      { shipmentId },
      { headers: getEthereumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi nhận lô hàng:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Không thể nhận lô hàng"
    );
  }
};

// Gửi lô hàng đến khách hàng
export const shipToCustomer = async (shipmentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/ship-to-customer`,
      shipmentData,
      { headers: getEthereumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi lô hàng đến khách hàng:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể gửi lô hàng đến khách hàng"
    );
  }
};

// Đăng bán sản phẩm cho người tiêu dùng
export const sellProductToConsumer = async (productData) => {
  try {
    console.log("Đăng bán sản phẩm với dữ liệu:", productData);

    if (!productData.inventoryId) {
      throw new Error("Thiếu thông tin ID sản phẩm trong kho");
    }

    // Chuyển đổi listingId từ BigInt thành string
    if (typeof productData.listingId === "bigint") {
      productData.listingId = productData.listingId.toString();
    }

    const endpoint = `${API_URL}/sell-product`;

    const response = await axios.post(endpoint, productData, {
      headers: {
        "Content-Type": "application/json",
        ...getEthereumHeaders(),
      },
    });

    console.log("Kết quả đăng bán sản phẩm:", response.data);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi đăng bán sản phẩm:", error);
    if (error.response) {
      console.error("Trạng thái phản hồi:", error.response.status);
      console.error("Dữ liệu phản hồi:", error.response.data);
      throw new Error(
        error.response.data.message ||
          error.message ||
          "Không thể đăng bán sản phẩm"
      );
    }
    throw error;
  }
};

// Xác minh giao dịch blockchain
export const verifyTransaction = async (transactionHash) => {
  try {
    const response = await axios.post(
      `${API_URL}/verify-transaction`,
      { transactionHash },
      { headers: getEthereumHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xác minh giao dịch:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể xác minh giao dịch blockchain"
    );
  }
};

// Lấy danh sách sản phẩm đang bán từ trung tâm phân phối
export const getOutgoingProducts = async (deliveryHubId) => {
  try {
    console.log(
      "Lấy danh sách sản phẩm đang bán cho deliveryHubId:",
      deliveryHubId
    );
    const response = await axios.get(
      `${API_URL}/outgoing-products/${deliveryHubId}`,
      { headers: getEthereumHeaders() }
    );
    console.log("Kết quả sản phẩm đang bán:", response.data);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách sản phẩm đang bán"
    );
  }
};

// Lấy danh sách khách hàng
export const getCustomers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getEthereumHeaders(),
    });
    return response.data.filter((user) => user.role === "Customer");
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách hàng:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách khách hàng"
    );
  }
};

// Lấy thống kê trung tâm phân phối
export const getDeliveryHubStats = async (deliveryHubId) => {
  try {
    const response = await axios.get(`${API_URL}/stats/${deliveryHubId}`, {
      headers: getEthereumHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thống kê trung tâm phân phối:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể tải thống kê trung tâm phân phối"
    );
  }
};

// Theo dõi lô hàng
export const trackShipment = async (shipmentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/track-shipment/${shipmentId}`,
      {
        headers: getEthereumHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi theo dõi lô hàng:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể theo dõi lô hàng"
    );
  }
};

// Thêm vào kho sau khi mua
export const addToInventory = async (
  productId,
  deliveryHubId,
  quantity,
  price,
  productdate,
  expirydate,
  transactionHash
) => {
  try {
    const payload = {
      productId,
      deliveryHubId,
      quantity,
      price,
      productdate,
      expirydate,
      transactionHash,
    };

    const response = await axios.post(`${API_URL}/add-to-inventory`, payload, {
      headers: getEthereumHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm vào kho:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Không thể thêm sản phẩm vào kho"
    );
  }
};
