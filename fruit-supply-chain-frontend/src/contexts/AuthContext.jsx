import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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

  const isGovernment = authState.user?.role === "Government";

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

    if (!account) {
      console.log("Bỏ qua loadUserFromApi: Thiếu account");
      setAuthState({
        user: null,
        error: null,
        loading: false,
      });
      setIsUserLoaded(false);
      localStorage.removeItem("user");
      localStorage.removeItem("account");
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, loading: true }));
      console.log("Bắt đầu gọi API /auth/user với walletAddress:", account);

      const headers = {
        "x-ethereum-address": account,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(
        `http://localhost:3000/auth/user?walletAddress=${account}`,
        { headers, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("account");
          setIsUserLoaded(false);
          setShouldLoadUser(true);
        }
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
      setIsUserLoaded(false);
    }
  };

  useEffect(() => {
    if (account && !web3Loading && shouldLoadUser) {
      loadUserFromApi();
    } else {
      setAuthState({
        user: null,
        error: null,
        loading: false,
      });
      setIsUserLoaded(false);
      localStorage.removeItem("user");
      localStorage.removeItem("account");
    }
  }, [account, web3Loading, shouldLoadUser]);

  const logout = useCallback(async () => {
    if (!account) {
      console.log("Không có account, bỏ qua gọi /logout");
      setAuthState({
        user: null,
        error: null,
        loading: false,
      });
      setIsUserLoaded(false);
      setShouldLoadUser(false);
      localStorage.removeItem("user");
      localStorage.removeItem("account");
      // Không gọi resetAccount ở đây
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi đăng xuất");
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error.message);
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
    // Chỉ gọi resetAccount nếu cần thiết, ví dụ khi người dùng thực sự đăng xuất thủ công
  }, [account]);

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

      await loadUserFromApi();

      return userData;
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
