import api from "./api";

export const getAllFarms = async () => {
  try {
    const response = await api.get("/farms");
    return response.data.farms;
  } catch (error) {
    console.error("Error fetching farms:", error);
    throw error;
  }
};

export const getFarmById = async (farmId) => {
  try {
    const response = await api.get(`/farm/${farmId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw error;
  }
};

export const registerFarm = async (farmData) => {
  try {
    const response = await api.post("/farm", farmData);
    return response.data;
  } catch (error) {
    console.error("Error registering farm:", error);
    throw error;
  }
};

export const updateFarmConditions = async (farmId, conditions) => {
  try {
    const response = await api.put(`/farm/${farmId}`, { conditions });
    return response.data;
  } catch (error) {
    console.error(
      `Error updating farm conditions for farm ID ${farmId}:`,
      error
    );
    throw error;
  }
};
