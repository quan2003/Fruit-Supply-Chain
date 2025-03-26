import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { account, loading: web3Loading } = useWeb3();
  const [isManager, setIsManager] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [userFarms, setUserFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true);
      setError(null);

      try {
        if (web3Loading) {
          return;
        }

        if (!user) {
          setIsFarmer(false);
          setIsManager(false);
          setUserFarms([]);
          return;
        }

        setIsFarmer(user.role === "Producer");
        setIsManager(user.role === "Admin");

        if (user.role === "Producer" && account) {
          const response = await fetch(
            `http://localhost:3000/farms/user?email=${user.email}`,
            {
              headers: {
                "Content-Type": "application/json",
                "x-ethereum-address": account,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Không thể lấy danh sách farm"
            );
          }

          const farms = await response.json();
          setUserFarms(farms);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra vai trò người dùng:", error);
        setError(error.message);
        setUserFarms([]);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, account, web3Loading]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setUserFarms([]);
    setIsFarmer(false);
    setIsManager(false);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    isManager,
    isFarmer,
    userFarms,
    loading,
    error,
    login,
    logout,
    checkFarmOwnership: (farmId) => {
      return userFarms.some((farm) => farm.id === farmId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
