import api from "./api";

export const getFruitCount = async () => {
  try {
    const response = await api.get("/fruit-count");
    return response.data.count;
  } catch (error) {
    console.error("Error fetching fruit count:", error);
    throw error;
  }
};

export const getFruitById = async (fruitId) => {
  try {
    const response = await api.get(`/fruit/${fruitId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fruit with ID ${fruitId}:`, error);
    throw error;
  }
};

export const harvestFruit = async (fruitData) => {
  try {
    const response = await api.post("/harvest", fruitData);
    return response.data;
  } catch (error) {
    console.error("Error harvesting fruit:", error);
    throw error;
  }
};

export const recordStep = async (stepData) => {
  try {
    const response = await api.post("/record-step", stepData);
    return response.data;
  } catch (error) {
    console.error("Error recording step:", error);
    throw error;
  }
};

export const addRecommendation = async (recommendationData) => {
  try {
    const response = await api.post("/recommendation", recommendationData);
    return response.data;
  } catch (error) {
    console.error("Error adding recommendation:", error);
    throw error;
  }
};
export const getAllFruitCatalogs = async () => {
  try {
    const response = await api.get("/fruit-catalogs"); // Đảm bảo endpoint này đúng
    return response.data;
  } catch (error) {
    console.error("Error fetching fruit catalogs:", error);
    throw error;
  }
};

