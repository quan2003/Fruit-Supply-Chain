import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import contractData from "../contracts/FruitSupplyChain.json";
import governmentRegulatorData from "../contracts/GovernmentRegulator.json";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3State, setWeb3State] = useState({
    account: null,
    web3: null,
    contract: null,
    governmentRegulator: null,
    loading: true,
    walletError: null,
    userError: null,
    contractError: null,
    isInitialized: false,
  });

  const updateWalletAddress = async (email) => {
    if (!web3State.account) {
      throw new Error("Không có ví MetaMask nào được kết nối!");
    }

    const response = await fetch("http://localhost:3000/update-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, walletAddress: web3State.account }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể cập nhật ví MetaMask!");
    }
    console.log("Cập nhật ví thành công:", await response.json());
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask không được cài đặt!");
      }

      const web3 = new Web3(window.ethereum);
      console.log("Đã khởi tạo Provider");

      const chainId = await web3.eth.getChainId();
      console.log("Chain ID:", chainId);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      const contractAddresses = await fetch(
        "http://localhost:3000/contract-address"
      ).then((res) => res.json());
      console.log(
        "Địa chỉ FruitSupplyChain từ API:",
        contractAddresses.FruitSupplyChain
      );
      console.log(
        "Địa chỉ GovernmentRegulator từ API:",
        contractAddresses.GovernmentRegulator
      );

      const contractBytecode = await web3.eth.getCode(
        contractAddresses.FruitSupplyChain
      );
      console.log(
        "Bytecode tại địa chỉ FruitSupplyChain:",
        contractBytecode.substring(0, 100) + "..."
      );

      const governmentRegulatorBytecode = await web3.eth.getCode(
        contractAddresses.GovernmentRegulator
      );
      console.log(
        "Bytecode tại địa chỉ GovernmentRegulator:",
        governmentRegulatorBytecode.substring(0, 100) + "..."
      );

      const contract = new web3.eth.Contract(
        contractData.abi,
        contractAddresses.FruitSupplyChain
      );
      console.log("Hợp đồng FruitSupplyChain:", contract);

      const governmentRegulator = new web3.eth.Contract(
        governmentRegulatorData.abi,
        contractAddresses.GovernmentRegulator
      );
      console.log("Hợp đồng GovernmentRegulator:", governmentRegulator);

      console.log("Tài khoản:", account);
      setWeb3State((prev) => ({
        ...prev,
        account,
        web3,
        contract,
        governmentRegulator,
        loading: false,
        walletError: null,
        userError: null,
        contractError: null,
        isInitialized: true,
      }));
      console.log("Đã đặt isInitialized = true, web3Loading = false");

      return account;
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      setWeb3State((prev) => ({
        ...prev,
        walletError: error.message,
        loading: false,
        isInitialized: false,
      }));
      throw error;
    }
  };

  const resetAccount = () => {
    setWeb3State((prev) => ({
      ...prev,
      account: null,
      contract: null,
      governmentRegulator: null,
      loading: false,
      isInitialized: false,
    }));
    console.log("Reset account state");
  };

  const executeTransaction = async ({
    type,
    productId,
    fruitId,
    price,
    quantity,
    inventoryId,
  }) => {
    if (!web3State.web3 || !web3State.contract || !web3State.account) {
      throw new Error("Web3 hoặc hợp đồng chưa được khởi tạo!");
    }

    try {
      if (type === "listProductForSale") {
        if (!productId || !fruitId || !price || !quantity || !inventoryId) {
          throw new Error("Thiếu thông tin cần thiết để đăng bán sản phẩm!");
        }

        const priceInWei = web3State.web3.utils.toWei(
          price.toString(),
          "ether"
        );

        const gasEstimate = await web3State.contract.methods
          .listProductForSale(fruitId, priceInWei, quantity, true)
          .estimateGas({ from: web3State.account });

        const result = await web3State.contract.methods
          .listProductForSale(fruitId, priceInWei, quantity, true)
          .send({
            from: web3State.account,
            gas: (BigInt(gasEstimate) + BigInt(gasEstimate / 5n)).toString(),
          });

        const listingId = result.events.ProductListed.returnValues.listingId;

        console.log("Giao dịch listProductForSale thành công:", result);
        return {
          transactionHash: result.transactionHash,
          listingId: listingId,
          fruitId: fruitId,
        };
      } else {
        throw new Error("Loại giao dịch không được hỗ trợ: " + type);
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện giao dịch:", error);
      throw new Error(
        error.message || "Không thể thực hiện giao dịch blockchain!"
      );
    }
  };

  const addManager = async (managerAddress) => {
    if (!web3State.web3 || !web3State.contract || !web3State.account) {
      throw new Error("Web3 hoặc hợp đồng chưa được khởi tạo!");
    }
    try {
      if (!web3State.web3.utils.isAddress(managerAddress)) {
        throw new Error("Địa chỉ ví không hợp lệ!");
      }

      const gasEstimate = await web3State.contract.methods
        .addManager(managerAddress)
        .estimateGas({ from: web3State.account });

      const result = await web3State.contract.methods
        .addManager(managerAddress)
        .send({
          from: web3State.account,
          gas: (BigInt(gasEstimate) + BigInt(gasEstimate / 5n)).toString(),
        });

      console.log("Giao dịch addManager thành công:", result);
      return { transactionHash: result.transactionHash };
    } catch (error) {
      console.error("Lỗi khi thêm manager:", error);
      throw new Error(error.message || "Không thể thêm manager!");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connectWallet();
          } else {
            setWeb3State((prev) => ({
              ...prev,
              loading: false,
              isInitialized: false,
            }));
          }
        } catch (error) {
          console.error("Lỗi khi khởi tạo Web3:", error);
          setWeb3State((prev) => ({
            ...prev,
            walletError: error.message,
            loading: false,
            isInitialized: false,
          }));
        }

        // Xử lý sự kiện accountsChanged
        window.ethereum.on("accountsChanged", async (accounts) => {
          console.log("Accounts changed:", accounts);
          if (accounts.length === 0) {
            console.log("No accounts available, resetting...");
            resetAccount();
          } else {
            try {
              await connectWallet();
            } catch (error) {
              console.error("Lỗi khi xử lý accountsChanged:", error);
              resetAccount();
            }
          }
        });

        // Xử lý sự kiện chainChanged
        window.ethereum.on("chainChanged", async () => {
          console.log("Chain changed, resetting state and reconnecting...");
          resetAccount();
          try {
            await connectWallet();
          } catch (error) {
            console.error("Lỗi khi xử lý chainChanged:", error);
            resetAccount();
          }
        });
      } else {
        setWeb3State((prev) => ({
          ...prev,
          walletError: "MetaMask không được cài đặt!",
          loading: false,
          isInitialized: false,
        }));
      }
    };

    init();

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        ...web3State,
        connectWallet,
        updateWalletAddress,
        resetAccount,
        executeTransaction,
        addManager,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
