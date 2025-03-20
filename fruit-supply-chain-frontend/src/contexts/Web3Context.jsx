// src/contexts/Web3Context.jsx
import React, { createContext, useContext, useState } from "react";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);

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
      throw new Error("MetaMask not installed");
    }
  };

  return (
    <Web3Context.Provider value={{ account, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
