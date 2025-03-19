// fruit-supply-chain-frontend/src/services/fruitService.js
import {
  getFruit,
  harvestFruit,
  recordStep,
  getAllFruitCatalogs,
  addRecommendation,
} from "./api";

export const getFruitById = async (fruitId) => {
  try {
    const fruit = await getFruit(fruitId);
    return fruit;
  } catch (error) {
    console.error(`Error fetching fruit with ID ${fruitId}:`, error);
    throw error;
  }
};

export const getFruitCount = async () => {
  try {
    // Giả lập dữ liệu, bạn có thể thay bằng API thật
    return 10;
  } catch (error) {
    console.error("Error fetching fruit count:", error);
    throw error;
  }
};

export const harvestFruitService = async (data) => {
  try {
    const result = await harvestFruit(data);
    return result;
  } catch (error) {
    console.error("Error harvesting fruit:", error);
    throw error;
  }
};

export const recordStepService = async (data) => {
  try {
    const result = await recordStep(data);
    return result;
  } catch (error) {
    console.error("Error recording step:", error);
    throw error;
  }
};

export const getAllFruitCatalogsService = async () => {
  try {
    const catalogs = await getAllFruitCatalogs();
    return catalogs;
  } catch (error) {
    console.error("Error fetching fruit catalogs:", error);
    throw error;
  }
};

export const addRecommendationService = async (data) => {
  try {
    const result = await addRecommendation(data);
    return result;
  } catch (error) {
    console.error("Error adding recommendation:", error);
    throw error;
  }
};
