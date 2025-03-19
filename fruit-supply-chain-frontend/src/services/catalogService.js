import api from "./api";

export const getAllCatalogs = async () => {
  try {
    const response = await api.get("/catalogs");
    return response.data.fruitTypes;
  } catch (error) {
    console.error("Error fetching catalogs:", error);
    throw error;
  }
};

export const getCatalogByType = async (fruitType) => {
  try {
    const response = await api.get(`/catalog/${fruitType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching catalog for fruit type ${fruitType}:`, error);
    throw error;
  }
};

export const addCatalog = async (catalogData) => {
  try {
    const response = await api.post("/catalog", catalogData);
    return response.data;
  } catch (error) {
    console.error("Error adding catalog:", error);
    throw error;
  }
};

// src/services/analyticsService.js
import api from "./api";

export const getTrends = async () => {
  try {
    const response = await api.get("/analytics/trends");
    return response.data;
  } catch (error) {
    console.error("Error fetching trends:", error);
    throw error;
  }
};

export const getRecentEvents = async (limit = 10) => {
  try {
    const response = await api.get(`/recent-events?limit=${limit}`);
    return response.data.events;
  } catch (error) {
    console.error("Error fetching recent events:", error);
    throw error;
  }
};
