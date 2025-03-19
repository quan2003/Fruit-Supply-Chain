// fruit-supply-chain-frontend/src/contexts/Web3Context.jsx
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
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);

          const contractInstance = new web3Instance.eth.Contract(
            FruitSupplyChainABI,
            contractAddress
          );
          setContract(contractInstance);

          window.ethereum.on("accountsChanged", (accounts) => {
            setAccount(accounts[0]);
          });

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

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [contractAddress]);

  const getFruit = async (fruitId) => {
    if (!contract) {
      throw new Error(
        "Vui lòng kết nối ví MetaMask để thực hiện hành động này"
      );
    }
    try {
      const result = await contract.methods.getFruit(fruitId).call();
      return {
        fruitType: result[0],
        origin: result[1],
        producer: result[2],
        history: result[3],
      };
    } catch (err) {
      throw new Error(`Lỗi khi lấy thông tin trái cây: ${err.message}`);
    }
  };

  const harvestFruit = async (fruitType, origin) => {
    if (!contract || !account) {
      throw new Error(
        "Vui lòng kết nối ví MetaMask để thực hiện hành động này"
      );
    }
    try {
      const result = await contract.methods
        .harvestFruit(fruitType, origin)
        .send({ from: account, gas: 300000 });
      return result;
    } catch (err) {
      throw new Error(`Lỗi khi thu hoạch trái cây: ${err.message}`);
    }
  };

  const value = {
    web3,
    account,
    contract,
    loading,
    error,
    getFruit,
    harvestFruit,
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
