import React, { createContext, useContext, useState, useEffect } from "react";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);

  // 🟢 Hàm kết nối ví MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Vui lòng cài đặt MetaMask!");
      throw new Error("MetaMask chưa được cài đặt.");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        return accounts[0];
      } else {
        setAccount(null);
        throw new Error("Không có tài khoản nào được chọn.");
      }
    } catch (error) {
      console.error("Lỗi khi kết nối MetaMask:", error);
      setAccount(null);
      throw new Error(error.message || "Không thể kết nối ví MetaMask.");
    }
  };

  // 🟢 Kiểm tra ví đã kết nối khi trang load
  useEffect(() => {
    if (!window.ethereum) return;

    const checkWalletConnection = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        // 🟢 Kiểm tra nếu người dùng đã đăng nhập trước đó
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const isLoggedIn = !!user.role;

        if (accounts.length > 0 && isLoggedIn) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra kết nối ví:", error);
        setAccount(null);
      }
    };

    checkWalletConnection();

    // 🟢 Lắng nghe sự thay đổi tài khoản trong MetaMask
    const handleAccountsChanged = (newAccounts) => {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const isLoggedIn = !!user.role;

      if (newAccounts.length > 0 && isLoggedIn) {
        setAccount(newAccounts[0]);
      } else {
        setAccount(null);
      }
    };

    // 🟢 Lắng nghe sự kiện MetaMask ngắt kết nối
    const handleDisconnect = () => {
      setAccount(null);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      // 🟢 Dọn dẹp listener khi component unmount
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <Web3Context.Provider value={{ account, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};

// 🟢 Hook tùy chỉnh để sử dụng Web3Context
export const useWeb3 = () => useContext(Web3Context);
