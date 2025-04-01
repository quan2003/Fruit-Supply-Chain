import axios from "axios";

const API_URL = "http://localhost:3000";

export const getAllFarmsService = async (headers = {}) => {
  try {
    const response = await axios.get(`${API_URL}/farms`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all farms:", error);
    throw new Error("Không thể lấy danh sách nông trại từ API");
  }
};

export const getFarmByIdService = async (farmId, headers = {}) => {
  try {
    const response = await axios.get(`${API_URL}/farms/${farmId}`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw new Error(
      `Không thể lấy thông tin nông trại với ID ${farmId} từ API`
    );
  }
};

export const getProducerByIdService = async (producerId, headers = {}) => {
  try {
    const response = await axios.get(`${API_URL}/producers/${producerId}`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching producer with ID ${producerId}:`, error);
    throw new Error(
      `Không thể lấy thông tin producer với ID ${producerId} từ API`
    );
  }
};

export const registerFarmService = async (farmData, headers = {}) => {
  try {
    const response = await axios.post(`${API_URL}/farms`, farmData, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error registering farm:", error);
    throw new Error("Không thể đăng ký nông trại");
  }
};

export const updateFarmConditionsService = async (
  farmId,
  conditions,
  headers = {}
) => {
  try {
    const response = await axios.put(
      `${API_URL}/farms/${farmId}/conditions`,
      conditions,
      {
        headers: {
          ...headers,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error updating farm conditions for farm ID ${farmId}:`,
      error
    );
    throw new Error(`Không thể cập nhật điều kiện nông trại với ID ${farmId}`);
  }
};

// Thêm hàm getFarmStats
export const getFarmStats = async (email, headers = {}) => {
  try {
    const response = await axios.get(`${API_URL}/farms/stats?email=${email}`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching farm stats:", error);
    throw new Error("Không thể lấy thống kê farm từ API");
  }
};

// Thêm hàm getYieldData
export const getYieldData = async (email, headers = {}) => {
  try {
    const response = await axios.get(`${API_URL}/farms/yield?email=${email}`, {
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching yield data:", error);
    throw new Error("Không thể lấy dữ liệu sản lượng từ API");
  }
};
