import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { web3, account, contract } = useWeb3();
  const [isManager, setIsManager] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [userFarms, setUserFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (contract && account) {
        try {
          // Kiểm tra xem người dùng có phải là quản lý không
          const managerStatus = await contract.methods
            .authorizedManagers(account)
            .call();
          setIsManager(managerStatus);

          // Lấy danh sách các nông trại
          const farmIds = await contract.methods.getAllFarms().call();

          // Mảng chứa các promise để lấy thông tin của từng nông trại
          const farmPromises = farmIds.map((farmId) =>
            contract.methods.getFarmData(farmId).call()
          );

          // Chờ tất cả các promise hoàn thành
          const farms = await Promise.all(farmPromises);

          // Lọc ra những nông trại thuộc về người dùng hiện tại
          const userOwnedFarms = farms
            .filter(
              (farm, index) => farm[5].toLowerCase() === account.toLowerCase()
            )
            .map((farm, index) => ({
              id: farmIds[index],
              location: farm[0],
              climate: farm[1],
              soil: farm[2],
              lastUpdated: farm[3],
              currentConditions: farm[4],
              owner: farm[5],
              fruitIds: farm[6],
            }));

          setUserFarms(userOwnedFarms);
          setIsFarmer(userOwnedFarms.length > 0);
        } catch (error) {
          console.error("Error checking user role:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkUserRole();
  }, [contract, account]);

  const value = {
    isManager,
    isFarmer,
    userFarms,
    loading,
    checkFarmOwnership: (farmId) => {
      return userFarms.some((farm) => farm.id === farmId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
