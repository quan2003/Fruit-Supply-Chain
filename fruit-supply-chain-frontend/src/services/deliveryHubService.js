// fruit-supply-chain-frontend/src/services/deliveryHubService.js
import axios from "axios";

const API_URL = "http://localhost:3000";

// Mock data for development (giữ lại các mock khác nếu cần, nhưng xóa mockInventory)
const mockIncomingShipments = [
  {
    id: "969d3f59-d5de-4a2e-b432-234f5678d123",
    productName: "Xoài cát Hòa Lộc",
    fruitType: "Xoài",
    origin: "Tiền Giang",
    quantity: 50,
    shippedDate: "2025-03-15T08:30:00Z",
    shipperName: "Công ty vận chuyển ABC",
    shipperAddress: "0x1234567890abcdef1234567890abcdef12345678",
    status: "Đang vận chuyển",
  },
  {
    id: "d3b8ccd1-6e5a-4b9f-b234-456f456789a1",
    productName: "Thanh Long ruột đỏ",
    fruitType: "Thanh Long",
    origin: "Bình Thuận",
    quantity: 100,
    shippedDate: "2025-03-16T09:15:00Z",
    shipperName: "Dịch vụ vận tải Nhanh Chóng",
    shipperAddress: "0x2345678901abcdef2345678901abcdef23456789",
    status: "Đang vận chuyển",
  },
  {
    id: "cb147e98-0b29-4c3d-c345-567f56789ab2",
    productName: "Bưởi năm roi",
    fruitType: "Bưởi",
    origin: "Vĩnh Long",
    quantity: 30,
    shippedDate: "2025-03-14T10:45:00Z",
    shipperName: "Công ty vận chuyển ABC",
    shipperAddress: "0x1234567890abcdef1234567890abcdef12345678",
    status: "Đang vận chuyển",
  },
];

const mockOutgoingShipments = [
  {
    id: "4de59188-cc1f-4d4e-d456-678f6789abc3",
    productName: "Xoài cát Hòa Lộc",
    fruitType: "Xoài",
    origin: "Tiền Giang",
    quantity: 20,
    shippedDate: "2025-03-18T14:30:00Z",
    customerName: "Nguyễn Văn A",
    customerAddress: "0x3456789012abcdef3456789012abcdef34567890",
    deliveryAddress: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    status: "Đang vận chuyển",
  },
  {
    id: "e5fa72b3-1c5d-4e6f-e567-789f789abcd4",
    productName: "Thanh Long ruột đỏ",
    fruitType: "Thanh Long",
    origin: "Bình Thuận",
    quantity: 30,
    shippedDate: "2025-03-17T15:45:00Z",
    customerName: "Trần Thị B",
    customerAddress: "0x4567890123abcdef4567890123abcdef45678901",
    deliveryAddress: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    status: "Đã giao",
  },
];

const mockCustomers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    walletAddress: "0x3456789012abcdef3456789012abcdef34567890",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    walletAddress: "0x4567890123abcdef4567890123abcdef45678901",
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "levanc@example.com",
    address: "789 Đường Trần Hưng Đạo, Quận 5, TP.HCM",
    walletAddress: "0x5678901234abcdef5678901234abcdef56789012",
  },
];

/**
 * Lấy danh sách các lô hàng đến trung tâm phân phối
 */
export const getIncomingShipments = async () => {
  try {
    // Trong môi trường phát triển, sử dụng dữ liệu mock
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockIncomingShipments), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.get(
      `${API_URL}/delivery-hub/incoming-shipments`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching incoming shipments:", error);
    throw error;
  }
};

/**
 * Lấy danh sách các lô hàng gửi đi từ trung tâm phân phối
 */
export const getOutgoingShipments = async () => {
  try {
    // Trong môi trường phát triển, sử dụng dữ liệu mock
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockOutgoingShipments), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.get(
      `${API_URL}/delivery-hub/outgoing-shipments`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching outgoing shipments:", error);
    throw error;
  }
};

/**
 * Lấy danh sách tồn kho tại trung tâm phân phối
 */
export const getInventory = async (deliveryHubId) => {
  try {
    // Gọi API thực tế bất kể môi trường
    const response = await axios.get(`${API_URL}/inventory/${deliveryHubId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
};

/**
 * Ghi nhận nhận lô hàng từ nhà vận chuyển
 * @param {string} shipmentId - ID của lô hàng
 */
export const receiveShipment = async (shipmentId) => {
  try {
    // Trong môi trường phát triển, giả lập nhận lô hàng
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        console.log(`Received shipment with ID: ${shipmentId}`);
        setTimeout(() => resolve({ success: true }), 1000);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.post(
      `${API_URL}/delivery-hub/receive-shipment`,
      {
        shipmentId,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error receiving shipment:", error);
    throw error;
  }
};

/**
 * Gửi lô hàng đến khách hàng
 * @param {Object} shipmentData - Thông tin lô hàng
 */
export const shipToCustomer = async (shipmentData) => {
  try {
    // Trong môi trường phát triển, giả lập gửi lô hàng
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        console.log("Shipping to customer:", shipmentData);
        setTimeout(
          () =>
            resolve({
              success: true,
              shipmentId: `ship-${Math.random().toString(36).substring(2, 10)}`,
            }),
          1000
        );
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.post(
      `${API_URL}/delivery-hub/ship-to-customer`,
      shipmentData
    );
    return response.data;
  } catch (error) {
    console.error("Error shipping to customer:", error);
    throw error;
  }
};

/**
 * Lấy danh sách khách hàng
 */
export const getCustomers = async () => {
  try {
    // Trong môi trường phát triển, sử dụng dữ liệu mock
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockCustomers), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.get(`${API_URL}/customers`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

/**
 * Theo dõi trạng thái lô hàng đi
 * @param {string} shipmentId - ID của lô hàng
 */
export const trackShipment = async (shipmentId) => {
  try {
    // Trong môi trường phát triển, giả lập theo dõi lô hàng
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const mockStatus = {
          id: shipmentId,
          status: "Đang vận chuyển",
          lastUpdated: new Date().toISOString(),
          location: "TP.HCM",
          estimatedDelivery: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          steps: [
            {
              step: "Received By DeliveryHub",
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              actor: "Trung tâm phân phối A",
            },
            {
              step: "Shipped By DeliveryHub",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              actor: "Trung tâm phân phối A",
            },
          ],
        };
        setTimeout(() => resolve(mockStatus), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.get(
      `${API_URL}/delivery-hub/track-shipment/${shipmentId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error tracking shipment ${shipmentId}:`, error);
    throw error;
  }
};

/**
 * Lấy báo cáo hiệu suất của trung tâm phân phối
 */
export const getDeliveryHubStats = async () => {
  try {
    // Trong môi trường phát triển, giả lập báo cáo
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const mockStats = {
          totalReceived: 150,
          totalShipped: 120,
          currentInventory: 30,
          avgProcessingTime: 1.5, // in days
          topProducts: [
            { name: "Xoài cát Hòa Lộc", count: 45 },
            { name: "Thanh Long ruột đỏ", count: 30 },
            { name: "Bưởi năm roi", count: 20 },
          ],
          monthlySummary: [
            { month: "01/2025", received: 100, shipped: 90 },
            { month: "02/2025", received: 120, shipped: 110 },
            { month: "03/2025", received: 150, shipped: 120 },
          ],
        };
        setTimeout(() => resolve(mockStats), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await axios.get(`${API_URL}/delivery-hub/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery hub stats:", error);
    throw error;
  }
};
