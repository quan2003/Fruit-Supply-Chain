import api from "./api";

export const addManager = async (address) => {
  try {
    const response = await api.post("/manager", { address });
    return response.data;
  } catch (error) {
    console.error("Error adding manager:", error);
    throw error;
  }
};

export const removeManager = async (address) => {
  try {
    const response = await api.delete(`/manager/${address}`);
    return response.data;
  } catch (error) {
    console.error("Error removing manager:", error);
    throw error;
  }
};
