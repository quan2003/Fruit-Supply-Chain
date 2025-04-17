import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context"; // Sửa đường dẫn
import axios from "axios";

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
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log("User loaded from localStorage:", parsedUser);
      // Validate that user.id exists
      if (!parsedUser || !parsedUser.id) {
        console.error("Invalid user data in localStorage, clearing...");
        localStorage.removeItem("user");
        return null;
      }
      return parsedUser;
    }
    return null;
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
          console.log("Không có user trong AuthContext");
          setIsFarmer(false);
          setIsManager(false);
          setUserFarms([]);
          return;
        }

        console.log("User trong AuthContext:", user);
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

  const login = async (email, password, role) => {
    try {
      console.log("Đăng nhập với thông tin:", { email, role });
      const response = await axios.post("http://localhost:3000/login", {
        email,
        password,
        role,
      });
      const userData = response.data.user;
      if (!userData || !userData.id) {
        console.error("Dữ liệu người dùng không hợp lệ:", userData);
        throw new Error("Dữ liệu người dùng không hợp lệ!");
      }
      console.log("Đăng nhập thành công, userData:", userData);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại!";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    console.log("Đăng xuất người dùng");
    setUser(null);
    setUserFarms([]);
    setIsFarmer(false);
    setIsManager(false);
    setError(null);
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

export default AuthProvider;
