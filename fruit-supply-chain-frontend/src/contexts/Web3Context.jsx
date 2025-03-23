// src/contexts/Web3Context.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);

  // Hàm kết nối ví MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Yêu cầu kết nối ví MetaMask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);

          // Khởi tạo web3 với MetaMask làm provider
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          return accounts[0];
        } else {
          setAccount(null);
          setWeb3(null);
          throw new Error(
            "Không có tài khoản nào được chọn. Vui lòng chọn một tài khoản trong MetaMask."
          );
        }
      } catch (error) {
        console.error("Lỗi khi kết nối ví MetaMask:", error);
        setAccount(null);
        setWeb3(null);
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
            setAccount(accounts[0]);
            // Khởi tạo web3 với MetaMask làm provider
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
          } else {
            setAccount(null);
            setWeb3(null);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra kết nối ví MetaMask:", error);
          setAccount(null);
          setWeb3(null);
        }

        // Lắng nghe sự thay đổi tài khoản
        window.ethereum.on("accountsChanged", (newAccounts) => {
          const user = JSON.parse(localStorage.getItem("user")) || {};
          const isLoggedIn = !!user.role;
          if (newAccounts.length > 0 && isLoggedIn) {
            setAccount(newAccounts[0]);
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
          } else {
            setAccount(null);
            setWeb3(null);
          }
        });

        // Lắng nghe sự kiện ngắt kết nối
        window.ethereum.on("disconnect", () => {
          setAccount(null);
          setWeb3(null);
        });
      }
    };

    checkWalletConnection();
  }, []);

  return (
    <Web3Context.Provider value={{ account, web3, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
