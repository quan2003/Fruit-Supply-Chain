import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import contractData from "../deployedContract.json";

function convertABIIfNeeded(abi) {
  if (abi.length > 0 && typeof abi[0] === "object") {
    console.log("ABI đã ở định dạng đúng");
    return abi;
  }
  console.log("Chuyển đổi ABI từ signature format sang full JSON format");
  const convertedABI = abi.map((item) => {
    if (typeof item !== "string") return item;
    if (item.startsWith("event ")) {
      const eventName = item.substring(6, item.indexOf("("));
      const paramsStr = item.substring(
        item.indexOf("(") + 1,
        item.indexOf(")")
      );
      const params = paramsStr ? paramsStr.split(",") : [];
      return {
        type: "event",
        name: eventName,
        inputs: params.map((param, index) => {
          const parts = param.trim().split(" ");
          const indexed = parts.includes("indexed");
          const type = parts[indexed ? 1 : 0];
          return { name: `param${index}`, type: type, indexed: indexed };
        }),
        anonymous: false,
      };
    } else if (item.startsWith("function ")) {
      const functionStr = item.substring(9);
      const functionName = functionStr.substring(0, functionStr.indexOf("("));
      const paramsStr = functionStr.substring(
        functionStr.indexOf("(") + 1,
        functionStr.indexOf(")")
      );
      const params = paramsStr ? paramsStr.split(",") : [];
      const isView = functionStr.includes(" view ");
      const isPure = functionStr.includes(" pure ");
      const isPayable = functionStr.includes(" payable ");
      let outputs = [];
      if (functionStr.includes("returns")) {
        const returnsStr = functionStr.substring(
          functionStr.indexOf("returns") + 8
        );
        const outputsStr = returnsStr.substring(
          returnsStr.indexOf("(") + 1,
          returnsStr.indexOf(")")
        );
        outputs = outputsStr
          ? outputsStr
              .split(",")
              .map((output, index) => ({ name: ``, type: output.trim() }))
          : [];
      }
      return {
        type: "function",
        name: functionName,
        inputs: params.map((param, index) => ({
          name: `param${index}`,
          type: param.trim(),
        })),
        outputs: outputs,
        stateMutability: isPayable
          ? "payable"
          : isView
          ? "view"
          : isPure
          ? "pure"
          : "nonpayable",
      };
    } else if (item === "constructor()") {
      return { type: "constructor", inputs: [], stateMutability: "nonpayable" };
    }
    return {
      type: "function",
      name: item,
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    };
  });
  console.log("ABI đã chuyển đổi:", convertedABI);
  return convertedABI;
}

const contractAddress = contractData.address;
const contractABI = convertABIIfNeeded(contractData.abi);

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);
  const [userError, setUserError] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      setLoading(true);
      if (!window.ethereum) {
        console.error("MetaMask không được cài đặt!");
        setWalletError("Vui lòng cài đặt MetaMask để tiếp tục!");
        setLoading(false);
        return;
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        console.log("Contract Address:", contractAddress);
        if (!contractABI || !contractAddress) {
          throw new Error("ABI hoặc địa chỉ hợp đồng không hợp lệ");
        }

        const contractInstance = new web3Instance.eth.Contract(
          contractABI,
          contractAddress
        );
        console.log("Contract methods:", Object.keys(contractInstance.methods));
        setContract(contractInstance);

        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkUserAndWallet(accounts[0]);
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("disconnect", handleDisconnect);
      } catch (error) {
        console.error("Lỗi khi khởi tạo Web3:", error);
        setWalletError(
          "Không thể khởi tạo Web3. Vui lòng kiểm tra kết nối MetaMask!"
        );
      } finally {
        setLoading(false);
      }
    };

    initWeb3();
  }, []);

  const handleAccountsChanged = async (accounts) => {
    const newAccount = accounts[0] || null;
    setAccount(newAccount);
    if (newAccount) await checkUserAndWallet(newAccount);
    else setWalletError("Ví MetaMask đã ngắt kết nối!");
  };

  const handleDisconnect = () => {
    setAccount(null);
    setWalletError("Ví MetaMask đã ngắt kết nối!");
  };

  const connectWallet = async () => {
    if (!web3) throw new Error("Web3 chưa được khởi tạo!");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      await checkUserAndWallet(accounts[0]);
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      if (error.code === -32002)
        throw new Error("Yêu cầu kết nối đang chờ xử lý trong MetaMask!");
      throw error;
    }
  };

  const checkUserAndWallet = async (currentAccount) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.email) {
        setUserError("Vui lòng đăng nhập để sử dụng chức năng này!");
        setWalletError(null);
        return;
      }

      const response = await axios.get("http://localhost:3000/check-role", {
        headers: { "x-ethereum-address": currentAccount },
      });

      const { walletAddress, role } = response.data;
      if (role !== user.role) {
        setUserError("Vai trò của bạn đã thay đổi. Vui lòng đăng nhập lại!");
        setWalletError(null);
        return;
      }

      if (
        walletAddress &&
        walletAddress.toLowerCase() !== currentAccount.toLowerCase()
      ) {
        setWalletError("Địa chỉ ví MetaMask không khớp với tài khoản của bạn!");
        setUserError(null);
      } else {
        setWalletError(null);
        setUserError(null);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra user và ví:", error);
      setWalletError("Không thể xác thực ví MetaMask!");
      setUserError(null);
    }
  };

  const updateWalletAddress = async (email) => {
    if (!account) throw new Error("Ví MetaMask chưa được kết nối!");
    try {
      await axios.post("http://localhost:3000/update-wallet", {
        email,
        walletAddress: account,
      });
      setWalletError(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật ví:", error);
      throw new Error("Không thể cập nhật ví!");
    }
  };

  const checkNodeSync = async () => {
    try {
      const blockNumber = await web3.eth.getBlockNumber();
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId, "Block Number:", blockNumber);
      if (!blockNumber) throw new Error("Node chưa đồng bộ hóa!");
      return { networkId, blockNumber };
    } catch (error) {
      console.error("Lỗi kiểm tra node:", error);
      throw new Error(
        "Không thể kết nối với node Ethereum! Vui lòng kiểm tra Hardhat Network."
      );
    }
  };

  const testContract = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được khởi tạo đúng!");
      const code = await web3.eth.getCode(contractAddress);
      console.log("Bytecode tại địa chỉ:", code);
      if (code === "0x")
        throw new Error("Hợp đồng không tồn tại tại địa chỉ này!");
      const owner = await contract.methods.owner().call();
      console.log("Owner:", owner);
      return true;
    } catch (error) {
      console.error("Lỗi kiểm tra hợp đồng:", error);
      throw new Error(
        "Hợp đồng hoặc ABI không hợp lệ! Chi tiết: " + error.message
      );
    }
  };

  const executeTransaction = async ({
    type,
    productId,
    price,
    quantity,
    inventoryId,
  }) => {
    if (!web3 || !contract || !account)
      throw new Error("Web3 chưa được khởi tạo!");
    if (userError) throw new Error(userError);
    if (walletError) throw new Error(walletError);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "DeliveryHub") {
      throw new Error("Bạn không có quyền thực hiện hành động này!");
    }

    if (type === "listProductForSale") {
      try {
        await checkNodeSync();
        await testContract();

        const owner = await contract.methods.owner().call();
        const isManager = await contract.methods
          .authorizedManagers(account)
          .call();
        console.log(
          "Owner:",
          owner,
          "Is Manager:",
          isManager,
          "Account:",
          account
        );

        if (owner.toLowerCase() !== account.toLowerCase() && !isManager) {
          throw new Error(
            `Bạn không có quyền thêm fruit catalog! Vui lòng chuyển sang tài khoản owner (${owner}) hoặc yêu cầu owner cấp quyền manager cho tài khoản ${account}.`
          );
        }

        const product = (
          await axios.get(`http://localhost:3000/products/${productId}`, {
            headers: { "x-ethereum-address": account },
          })
        ).data;
        const farm = (
          await axios.get(`http://localhost:3000/farms/${product.farm_id}`, {
            headers: { "x-ethereum-address": account },
          })
        ).data;
        const {
          name: fruitType,
          origin = "Việt Nam",
          quality = "Tốt",
        } = product;
        const farmId = farm.farm_name;

        let catalogExists = false;
        try {
          const catalog = await contract.methods
            .getFruitCatalog(fruitType)
            .call();
          catalogExists = catalog && catalog[0];
        } catch (e) {
          console.error("Lỗi khi kiểm tra fruit catalog:", e);
        }

        if (!catalogExists) {
          const gasEstimate = await contract.methods
            .addFruitCatalog(
              fruitType,
              `Mô tả về ${fruitType}`,
              "Tháng 8 - Tháng 12",
              "Chứa nhiều vitamin",
              "Bảo quản khô ráo",
              [`${fruitType} Giống 1`, `${fruitType} Giống 2`]
            )
            .estimateGas({ from: account });
          const gasEstimateNumber = Number(gasEstimate); // Chuyển BigInt thành number
          const gasLimit = Math.floor(gasEstimateNumber * 1.5);
          await contract.methods
            .addFruitCatalog(
              fruitType,
              `Mô tả về ${fruitType}`,
              "Tháng 8 - Tháng 12",
              "Chứa nhiều vitamin",
              "Bảo quản khô ráo",
              [`${fruitType} Giống 1`, `${fruitType} Giống 2`]
            )
            .send({ from: account, gas: gasLimit });
          console.log("Đã thêm fruit catalog:", fruitType);
        }

        let farmExists = false;
        try {
          const farmData = await contract.methods.getFarmData(farmId).call();
          farmExists = farmData && farmData[0];
        } catch (e) {
          console.error("Lỗi khi kiểm tra farm:", e);
        }

        if (!farmExists) {
          const gasEstimate = await contract.methods
            .registerFarm(
              farmId,
              farm.location || "Unknown",
              farm.weather_condition || "Unknown",
              "Đất phù sa",
              farm.current_conditions || "19.65°C"
            )
            .estimateGas({ from: account });
          const gasEstimateNumber = Number(gasEstimate); // Chuyển BigInt thành number
          const gasLimit = Math.floor(gasEstimateNumber * 1.5);
          await contract.methods
            .registerFarm(
              farmId,
              farm.location || "Unknown",
              farm.weather_condition || "Unknown",
              "Đất phù sa",
              farm.current_conditions || "19.65°C"
            )
            .send({ from: account, gas: gasLimit });
          console.log("Đã đăng ký farm:", farmId);
        }

        const inventoryItem = (
          await axios.get(
            `http://localhost:3000/inventory/by-id/${inventoryId}`,
            { headers: { "x-ethereum-address": account } }
          )
        ).data;
        let fruitId = inventoryItem?.fruit_id || 0;

        if (!fruitId) {
          const gasEstimate = await contract.methods
            .harvestFruit(fruitType, origin, farmId, quality)
            .estimateGas({ from: account });
          const gasEstimateNumber = Number(gasEstimate); // Chuyển BigInt thành number
          const gasLimit = Math.floor(gasEstimateNumber * 1.5);
          const tx = await contract.methods
            .harvestFruit(fruitType, origin, farmId, quality)
            .send({ from: account, gas: gasLimit });
          fruitId = parseInt(await contract.methods.fruitCount().call(), 10);
          await axios.put(
            `http://localhost:3000/inventory/${inventoryId}/fruit-id`,
            { fruitId },
            { headers: { "x-ethereum-address": account } }
          );
          console.log("Đã thu hoạch fruit với ID:", fruitId);
        }

        const priceInWei = web3.utils.toWei(price.toString(), "ether");
        const gasEstimate = await contract.methods
          .listProductForSale(fruitId, priceInWei, quantity)
          .estimateGas({ from: account });
        const gasEstimateNumber = Number(gasEstimate); // Chuyển BigInt thành number
        const gasLimit = Math.floor(gasEstimateNumber * 1.5);
        const tx = await contract.methods
          .listProductForSale(fruitId, priceInWei, quantity)
          .send({ from: account, gas: gasLimit });
        const listingId = tx.events.ProductListed.returnValues.listingId;
        console.log("Đã đăng bán sản phẩm với Listing ID:", listingId);

        return { transactionHash: tx.transactionHash, listingId };
      } catch (error) {
        console.error("Lỗi giao dịch chi tiết:", error);
        throw new Error("Lỗi không xác định: " + error.message);
      }
    } else {
      throw new Error("Loại giao dịch không được hỗ trợ!");
    }
  };
  // Hàm mới để thêm manager
  const addManager = async (managerAddress) => {
    if (!web3 || !contract || !account)
      throw new Error("Web3 chưa được khởi tạo!");

    try {
      // Kiểm tra trạng thái node trước khi thực hiện giao dịch
      await checkNodeSync();

      // Kiểm tra xem tài khoản hiện tại có phải là owner không
      const owner = await contract.methods.owner().call();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(
          `Chỉ owner (${owner}) mới có thể thêm manager! Vui lòng chuyển sang tài khoản owner.`
        );
      }

      // Ước lượng gas
      const gasEstimate = await contract.methods
        .addManager(managerAddress)
        .estimateGas({ from: account });

      // Chuyển BigInt thành số để tính toán
      const gasEstimateNumber = Number(gasEstimate);
      if (isNaN(gasEstimateNumber)) {
        throw new Error("Không thể chuyển đổi gas estimate thành số!");
      }

      // Tính gasLimit (tăng 50%)
      const gasLimit = Math.floor(gasEstimateNumber * 1.5);
      console.log(
        "Gas Estimate for addManager:",
        gasEstimateNumber,
        "Gas Limit:",
        gasLimit
      );

      // Thực hiện giao dịch
      const tx = await contract.methods
        .addManager(managerAddress)
        .send({ from: account, gas: gasLimit });
      console.log(
        `Đã cấp quyền manager cho ${managerAddress}. Transaction Hash:`,
        tx.transactionHash
      );

      // Kiểm tra lại trạng thái manager
      const isManager = await contract.methods
        .authorizedManagers(managerAddress)
        .call();
      console.log(`${managerAddress} hiện là manager:`, isManager);

      if (!isManager) {
        throw new Error(
          "Giao dịch thành công nhưng địa chỉ này không được cấp quyền manager!"
        );
      }

      return { transactionHash: tx.transactionHash };
    } catch (error) {
      console.error("Lỗi khi thêm manager:", error);

      // Xử lý lỗi chi tiết hơn
      if (error.message.includes("revert")) {
        throw new Error(
          "Giao dịch bị từ chối bởi hợp đồng thông minh. Kiểm tra logic hợp đồng hoặc quyền truy cập."
        );
      } else if (error.message.includes("gas")) {
        throw new Error(
          "Lỗi liên quan đến gas. Vui lòng thử tăng gas limit hoặc kiểm tra số dư tài khoản."
        );
      } else if (error.message.includes("network")) {
        throw new Error(
          "Lỗi mạng. Vui lòng kiểm tra kết nối với Hardhat Network hoặc MetaMask."
        );
      }

      throw new Error("Không thể thêm manager: " + error.message);
    }
  };
  const value = {
    web3,
    account,
    contract,
    connectWallet,
    executeTransaction,
    addManager, // Thêm hàm addManager vào context
    loading,
    walletError,
    userError,
    updateWalletAddress,
    setWalletError,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
