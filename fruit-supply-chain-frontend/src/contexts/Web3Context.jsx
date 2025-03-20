// src/contexts/Web3Context.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);

  // Hàm kết nối MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        return accounts[0];
      } catch (error) {
        console.error("Lỗi khi kết nối ví MetaMask:", error);
        throw error;
      }
    } else {
      console.error("Vui lòng cài đặt MetaMask!");
      alert("Vui lòng cài đặt MetaMask!");
      throw new Error("MetaMask not installed");
    }
  };

  // Theo dõi sự thay đổi tài khoản MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null); // Nếu người dùng đăng xuất khỏi MetaMask
        }
      });

      window.ethereum.on("disconnect", () => {
        setAccount(null);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("disconnect", () => {});
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ account, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};

// Hook tùy chỉnh để sử dụng Web3Context
export const useWeb3 = () => useContext(Web3Context);
