import axios from "axios";

const API_URL = "http://localhost:3000";

// Hàm tiện ích để thêm header x-ethereum-address
const addAuthHeader = (headers = {}, account) => {
  // Đảm bảo account là chuỗi, nếu không thì trả về chuỗi rỗng
  const address = typeof account === "string" ? account : "";
  if (!address) {
    console.warn("Account không hợp lệ, gửi header với giá trị rỗng");
  }
  return {
    ...headers,
    "x-ethereum-address": address,
  };
};

// Lấy danh sách tất cả nông trại
export const getAllFarmsService = async (account, headers = {}) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log("Gọi API /farms với account:", account, "Header:", authHeaders);
    const response = await axios.get(`${API_URL}/farms`, {
      headers: authHeaders,
    });
    console.log("Dữ liệu farms nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all farms:", error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
    }
    throw new Error("Không thể lấy danh sách nông trại từ API");
  }
};

// Lấy thông tin nông trại theo ID
export const getFarmByIdService = async (farmId, account, headers = {}) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      `Gọi API /farms/${farmId} với account:`,
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.get(`${API_URL}/farms/${farmId}`, {
      headers: authHeaders,
    });
    console.log("Dữ liệu farm nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
    }
    throw new Error(
      `Không thể lấy thông tin nông trại với ID ${farmId} từ API`
    );
  }
};

// Lấy thông tin producer theo ID
export const getProducerByIdService = async (
  producerId,
  account,
  headers = {}
) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      `Gọi API /producers/${producerId} với account:`,
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.get(`${API_URL}/producers/${producerId}`, {
      headers: authHeaders,
    });
    console.log("Dữ liệu producer nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching producer with ID ${producerId}:`, error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
    }
    throw new Error(
      `Không thể lấy thông tin producer với ID ${producerId} từ API`
    );
  }
};

// Đăng ký nông trại mới
export const registerFarmService = async (farmData, account, headers = {}) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      "Gọi API POST /farms với farmData:",
      farmData,
      "account:",
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.post(`${API_URL}/farms`, farmData, {
      headers: authHeaders,
    });
    console.log("Dữ liệu đăng ký farm nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error registering farm:", error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
    }
    throw new Error("Không thể đăng ký nông trại");
  }
};

// Cập nhật điều kiện nông trại
export const updateFarmConditionsService = async (
  farmId,
  conditions,
  account,
  headers = {}
) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      `Gọi API PUT /farms/${farmId}/conditions với conditions:`,
      conditions,
      "account:",
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.put(
      `${API_URL}/farms/${farmId}/conditions`,
      conditions,
      {
        headers: authHeaders,
      }
    );
    console.log("Dữ liệu cập nhật farm nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating farm conditions for farm ID ${farmId}:`,
      error
    );
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
    }
    throw new Error(`Không thể cập nhật điều kiện nông trại với ID ${farmId}`);
  }
};

// Lấy thống kê nông trại
export const getFarmStats = async (email, account, headers = {}) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      "Gọi API /farms/stats với email:",
      email,
      "và account:",
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.get(`${API_URL}/farms/stats?email=${email}`, {
      headers: authHeaders,
    });
    console.log("Dữ liệu stats nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching farm stats:", error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
      if (error.response.status === 401) {
        throw new Error("Xác thực thất bại: " + error.response.data.error);
      }
    }
    throw new Error("Không thể lấy thống kê farm từ API");
  }
};

// Lấy dữ liệu sản lượng
export const getYieldData = async (email, account, headers = {}) => {
  try {
    const authHeaders = addAuthHeader(headers, account);
    console.log(
      "Gọi API /farms/yield với email:",
      email,
      "và account:",
      account,
      "Header:",
      authHeaders
    );
    const response = await axios.get(`${API_URL}/farms/yield?email=${email}`, {
      headers: authHeaders,
    });
    console.log("Dữ liệu yield nhận được:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching yield data:", error);
    if (error.response) {
      console.log("Lỗi từ server:", error.response.data);
      if (error.response.status === 401) {
        throw new Error("Xác thực thất bại: " + error.response.data.error);
      }
    }
    throw new Error("Không thể lấy dữ liệu sản lượng từ API");
  }
};
