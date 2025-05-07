import React, { createContext, useContext, useState, useEffect } from "react";
import { useWeb3 } from "./Web3Context";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { account, web3Loading, resetAccount } = useWeb3();
  const [authState, setAuthState] = useState({
    user: null,
    error: null,
    loading: true,
  });
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [shouldLoadUser, setShouldLoadUser] = useState(true);

  // Tính isGovernment từ user.role
  const isGovernment = authState.user?.role === "Government";

  // Tải dữ liệu từ localStorage khi khởi tạo
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccount = localStorage.getItem("account");

    if (storedUser && storedAccount) {
      console.log("Khôi phục user từ localStorage:", storedUser);
      setAuthState((prev) => ({
        ...prev,
        user: JSON.parse(storedUser),
        error: null,
        loading: false,
      }));
      setIsUserLoaded(true);
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const loadUserFromApi = async () => {
    console.log("loadUserFromApi called with:", {
      account,
      web3Loading,
      isUserLoaded,
      shouldLoadUser,
    });

    if (!shouldLoadUser || !account || web3Loading || isUserLoaded) {
      console.log("Bỏ qua loadUserFromApi do không thỏa mãn điều kiện:", {
        account,
        web3Loading,
        isUserLoaded,
        shouldLoadUser,
      });
      if (!web3Loading && account && !isUserLoaded) {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, loading: true }));
      console.log("Bắt đầu gọi API /auth/user với walletAddress:", account);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(
        `http://localhost:3000/auth/user?walletAddress=${account}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không tìm thấy người dùng: ${errorText}`);
      }

      const userData = await response.json();
      console.log("User loaded from API:", userData);

      const updatedUser = {
        ...userData,
        walletAddress: account,
      };

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        error: null,
        loading: false,
      }));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("account", account);
      setIsUserLoaded(true);
    } catch (error) {
      console.error("Lỗi khi tải người dùng từ API:", error.message);
      setAuthState((prev) => ({
        ...prev,
        user: null,
        error: error.message,
        loading: false,
      }));
      setIsUserLoaded(true);
    }
  };

  useEffect(() => {
    if (account && !shouldLoadUser) {
      setShouldLoadUser(true);
    }

    loadUserFromApi();
  }, [account, web3Loading, isUserLoaded, shouldLoadUser]);

  const logout = async () => {
    try {
      await fetch("http://localhost:3000/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account }),
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }

    setAuthState({
      user: null,
      error: null,
      loading: false,
    });
    setIsUserLoaded(false);
    setShouldLoadUser(false);
    localStorage.removeItem("user");
    localStorage.removeItem("account");
    resetAccount();
  };

  const login = () => {
    setShouldLoadUser(true);
  };

  const loginWithCredentials = async (email, password, role) => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đăng nhập thất bại!");
      }

      const data = await response.json();
      const userData = data.user;

      // Cập nhật walletAddress vào backend
      const updateResponse = await fetch(
        "http://localhost:3000/update-wallet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, walletAddress: account }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Không thể cập nhật ví MetaMask!");
      }

      // Cập nhật trạng thái user trong AuthContext
      const updatedUser = {
        ...userData,
        walletAddress: account,
      };

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        error: null,
        loading: false,
      }));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("account", account);
      setIsUserLoaded(true);

      // Gọi lại loadUserFromApi để đảm bảo trạng thái được đồng bộ
      await loadUserFromApi();

      return userData; // Trả về dữ liệu người dùng để sử dụng trong LoginPage
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        account,
        isGovernment,
        loading: authState.loading,
        error: authState.error,
        logout,
        login,
        loginWithCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
