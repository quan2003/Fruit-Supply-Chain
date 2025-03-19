// fruit-supply-chain-frontend/src/services/farmService.js
import {
  getAllFarms,
  getFarm,
  registerFarm,
  updateFarmConditions,
} from "./api";

export const getAllFarmsService = async () => {
  try {
    const farms = await getAllFarms();
    return farms;
  } catch (error) {
    console.error("Error fetching farms:", error);
    throw error;
  }
};

export const getFarmByIdService = async (farmId) => {
  try {
    const farm = await getFarm(farmId);
    return farm;
  } catch (error) {
    console.error(`Error fetching farm with ID ${farmId}:`, error);
    throw error;
  }
};

export const registerFarmService = async (farmData) => {
  try {
    const newFarm = await registerFarm(farmData);
    return newFarm;
  } catch (error) {
    console.error("Error registering farm:", error);
    throw error;
  }
};

export const updateFarmConditionsService = async (farmId, conditions) => {
  try {
    const updatedFarm = await updateFarmConditions(farmId, conditions);
    return updatedFarm;
  } catch (error) {
    console.error(
      `Error updating farm conditions for farm ID ${farmId}:`,
      error
    );
    throw error;
  }
};
