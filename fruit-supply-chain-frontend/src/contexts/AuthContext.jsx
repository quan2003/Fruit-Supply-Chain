import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { account } = useWeb3();
  const [isManager, setIsManager] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [userFarms, setUserFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    // Khôi phục user từ localStorage khi khởi động
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const checkUserRole = async () => {
      if (account) {
        try {
          const managerStatus = false; // Giả lập: không phải manager
          setIsManager(managerStatus);

          const farms = [
            {
              id: "1",
              location: "Tiền Giang",
              climate: "Nhiệt đới",
              soil: "Đất phù sa",
              lastUpdated: Date.now(),
              currentConditions: "Tốt",
              owner: account,
              fruitIds: ["1", "2"],
            },
          ];

          const userOwnedFarms = farms.filter(
            (farm) => farm.owner.toLowerCase() === account.toLowerCase()
          );

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
  }, [account]);

  const login = (userData) => {
    setUser(userData);
    // Đồng bộ với localStorage
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setUserFarms([]);
    setIsFarmer(false);
    setIsManager(false);
    // Xóa localStorage
    localStorage.removeItem("user");
  };

  const value = {
    user,
    isManager,
    isFarmer,
    userFarms,
    loading,
    login,
    logout,
    checkFarmOwnership: (farmId) => {
      return userFarms.some((farm) => farm.id === farmId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
