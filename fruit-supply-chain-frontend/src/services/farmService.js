// fruit-supply-chain-frontend/src/services/farmService.js
import axios from "axios";

const API_URL = "http://localhost:3000";

export const getAllFarmsService = async () => {
  try {
    const response = await axios.get(`${API_URL}/farms`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all farms:", error);
    throw new Error("Không thể lấy danh sách nông trại từ API");
  }
};

export const getFarmByIdService = async (farmId) => {
  try {
    const response = await axios.get(`${API_URL}/farms/${farmId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw new Error(
      `Không thể lấy thông tin nông trại với ID ${farmId} từ API`
    );
  }
};

export const registerFarmService = async (farmData) => {
  try {
    const response = await axios.post(`${API_URL}/farms`, farmData);
    return response.data;
  } catch (error) {
    console.error("Error registering farm:", error);
    throw new Error("Không thể đăng ký nông trại");
  }
};

export const updateFarmConditionsService = async (farmId, conditions) => {
  try {
    const response = await axios.put(
      `${API_URL}/farms/${farmId}/conditions`,
      conditions
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
