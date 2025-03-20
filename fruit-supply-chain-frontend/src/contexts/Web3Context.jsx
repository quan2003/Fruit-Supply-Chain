// src/contexts/Web3Context.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);

  // Hàm kết nối ví MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          return accounts[0];
        } else {
          setAccount(null);
          throw new Error(
            "Không có tài khoản nào được chọn. Vui lòng chọn một tài khoản trong MetaMask."
          );
        }
      } catch (error) {
        console.error("Lỗi khi kết nối ví MetaMask:", error);
        setAccount(null);
        throw new Error(
          error.message || "Không thể kết nối ví MetaMask. Vui lòng thử lại!"
        );
      }
    } else {
      console.error("Vui lòng cài đặt MetaMask!");
      throw new Error(
        "MetaMask chưa được cài đặt. Vui lòng cài đặt MetaMask để tiếp tục!"
      );
    }
  };

  // Kiểm tra ví đã kết nối hay chưa khi trang load
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          const user = JSON.parse(localStorage.getItem("user")) || {};
          const isLoggedIn = !!user.role;

          if (accounts.length > 0 && isLoggedIn) {
            setAccount(accounts[0]); // Chỉ lưu account nếu người dùng đã đăng nhập
          } else {
            setAccount(null); // Nếu không có tài khoản hoặc chưa đăng nhập, đặt account về null
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra kết nối ví MetaMask:", error);
          setAccount(null);
        }

        // Lắng nghe sự kiện thay đổi tài khoản
        window.ethereum.on("accountsChanged", (newAccounts) => {
          const user = JSON.parse(localStorage.getItem("user")) || {};
          const isLoggedIn = !!user.role;
          if (newAccounts.length > 0 && isLoggedIn) {
            setAccount(newAccounts[0]);
          } else {
            setAccount(null); // Nếu người dùng ngắt kết nối ví hoặc chưa đăng nhập
          }
        });

        // Lắng nghe sự kiện ngắt kết nối
        window.ethereum.on("disconnect", () => {
          setAccount(null);
        });
      }
    };

    checkWalletConnection();
  }, []);

  return (
    <Web3Context.Provider value={{ account, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
