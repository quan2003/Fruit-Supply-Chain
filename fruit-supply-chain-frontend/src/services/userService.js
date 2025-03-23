import axios from "axios";

const API_URL = "http://localhost:3000";

// Lấy thông tin người dùng dựa trên userId
export const getUserByIdService = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}:`, error);
    throw new Error(
      `Không thể lấy thông tin người dùng với ID ${userId} từ API`
    );
  }
};

// Lấy tất cả người dùng
export const getAllUsersService = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Không thể lấy danh sách người dùng từ API");
  }
};
