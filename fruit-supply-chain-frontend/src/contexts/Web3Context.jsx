import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import FruitSupplyChainABI from "../utils/FruitSupplyChainABI.json";

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contractAddress =
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d";

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        // Kiểm tra xem MetaMask đã được cài đặt chưa
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Yêu cầu quyền truy cập tài khoản
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);

          // Khởi tạo contract
          const contractInstance = new web3Instance.eth.Contract(
            FruitSupplyChainABI,
            contractAddress
          );
          setContract(contractInstance);

          // Lắng nghe sự kiện thay đổi tài khoản
          window.ethereum.on("accountsChanged", (accounts) => {
            setAccount(accounts[0]);
          });

          // Lắng nghe sự kiện thay đổi mạng
          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        } else {
          setError("Vui lòng cài đặt MetaMask để sử dụng ứng dụng này");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initWeb3();

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [contractAddress]);

  const value = {
    web3,
    account,
    contract,
    loading,
    error,
    connectWallet: async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        return accounts[0];
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
