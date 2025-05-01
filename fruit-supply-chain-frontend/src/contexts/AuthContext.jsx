import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { account, loading: web3Loading, walletError } = useWeb3();
  const [isManager, setIsManager] = useState(false);
  const [isFarmer, setIsFarmer] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isDeliveryHub, setIsDeliveryHub] = useState(false);
  const [isGovernment, setIsGovernment] = useState(false);
  const [userFarms, setUserFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (
        !parsedUser ||
        !parsedUser.id ||
        !parsedUser.email ||
        !parsedUser.role
      ) {
        localStorage.removeItem("user");
        return null;
      }
      return parsedUser;
    }
    return null;
  });

  const [storedAccount, setStoredAccount] = useState(() => {
    return localStorage.getItem("account") || null;
  });

  useEffect(() => {
    if (account) {
      setStoredAccount(account);
      localStorage.setItem("account", account);

      // Chỉ cập nhật user nếu walletAddress thay đổi
      if (user && user.walletAddress !== account) {
        const updatedUser = { ...user, walletAddress: account };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    }
  }, [account, user]);

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true);
      setError(null);

      try {
        if (web3Loading) {
          return;
        }

        console.log("User after load:", user);
        console.log("IsGovernment:", user?.role === "Government");
        console.log("Account:", storedAccount);

        if (!user) {
          setIsFarmer(false);
          setIsManager(false);
          setIsCustomer(false);
          setIsDeliveryHub(false);
          setIsGovernment(false);
          setUserFarms([]);
          return;
        }

        setIsFarmer(user.role === "Producer");
        setIsManager(user.role === "Admin");
        setIsCustomer(user.role === "Customer");
        setIsDeliveryHub(user.role === "DeliveryHub");
        setIsGovernment(user.role === "Government");

        if (user.role === "Producer" && storedAccount) {
          const response = await fetch(
            `http://localhost:3000/farms/user?email=${user.email}`,
            {
              headers: {
                "Content-Type": "application/json",
                "x-ethereum-address": storedAccount,
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
        } else {
          setUserFarms([]); // Đặt lại userFarms nếu không phải Producer
        }
      } catch (error) {
        setError(error.message);
        setUserFarms([]);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user?.email, user?.role, storedAccount, web3Loading]); // Chỉ phụ thuộc vào email và role của user

  useEffect(() => {
    if (walletError && walletError.includes("không khớp")) {
      logout();
    }
  }, [walletError]);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post("http://localhost:3000/login", {
        email,
        password,
        role,
      });
      const userData = response.data.user;
      if (!userData || !userData.id || !userData.email || !userData.role) {
        throw new Error("Dữ liệu người dùng không hợp lệ!");
      }

      const updatedUser = {
        ...userData,
        walletAddress: storedAccount || account || userData.wallet_address,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại!";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setUserFarms([]);
    setIsFarmer(false);
    setIsManager(false);
    setIsCustomer(false);
    setIsDeliveryHub(false);
    setIsGovernment(false);
    setError(null);
    setStoredAccount(null);
    localStorage.removeItem("user");
    localStorage.removeItem("account");
  };

  const value = {
    user,
    isManager,
    isFarmer,
    isCustomer,
    isDeliveryHub,
    isGovernment,
    userFarms,
    loading,
    error,
    login,
    logout,
    checkFarmOwnership: (farmId) => {
      return userFarms.some((farm) => farm.id === farmId);
    },
    account: storedAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
