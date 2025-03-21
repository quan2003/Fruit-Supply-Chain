// src/services/fruitService.js
import {
  getFruit,
  harvestFruit,
  recordStep,
  getAllFruitCatalogs,
  addRecommendation,
  getFruitProduct,
  getAllFruitProducts,
  createFruitProduct,
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

export const getFruitProducts = async () => {
  try {
    const products = await getAllFruitProducts();
    return products;
  } catch (error) {
    console.error("Error fetching fruit products:", error);
    throw error;
  }
};

export const getFruitProductById = async (productId) => {
  try {
    const product = await getFruitProduct(productId);
    return product;
  } catch (error) {
    console.error(`Error fetching fruit product with ID ${productId}:`, error);
    throw error;
  }
};

export const addFruitProduct = async (formData) => {
  try {
    const result = await createFruitProduct(formData);
    console.log("Kết quả từ API:", result);
    return result;
  } catch (error) {
    console.error("Error adding fruit product:", error);
    throw error;
  }
};
