import React, { createContext, useContext, useState, useEffect } from "react";
import { Web3 } from "web3";
import axios from "axios";
import contractData from "../contracts/FruitSupplyChain.json";

const getContractAddress = async () => {
  try {
    const response = await axios.get("http://localhost:3000/contract-address");
    console.log("Địa chỉ hợp đồng từ backend:", response.data.address);
    if (
      !response.data.address ||
      !Web3.utils.isAddress(response.data.address)
    ) {
      throw new Error(
        "Địa chỉ hợp đồng không hợp lệ: " + response.data.address
      );
    }
    return response.data.address;
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ hợp đồng từ backend:", error);
    throw new Error(
      "Không thể lấy địa chỉ hợp đồng từ backend: " + error.message
    );
  }
};

const contractABI = contractData.abi;

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

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [contractError, setContractError] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      setLoading(true);
      if (!window.ethereum) {
        console.error("MetaMask không được cài đặt!");
        setWalletError("Vui lòng cài đặt MetaMask để tiếp tục!");
        setLoading(false);
        return;
      }

      let web3Instance = null;
      try {
        web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const chainId = await web3Instance.eth.getChainId();
        console.log("Chain ID:", chainId);
        const chainIdNumber = Number(chainId);
        if (chainIdNumber !== 1337) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x539" }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x539",
                    chainName: "Hardhat Localhost",
                    rpcUrls: ["http://127.0.0.1:8545/"],
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    blockExplorerUrls: null,
                  },
                ],
              });
            } else {
              throw new Error(
                `Vui lòng chuyển MetaMask sang Hardhat Localhost (Chain ID: 1337)! Hiện tại: ${chainIdNumber}`
              );
            }
          }
          const newChainId = await web3Instance.eth.getChainId();
          if (Number(newChainId) !== 1337) {
            throw new Error(
              `Vui lòng chuyển MetaMask sang Hardhat Localhost (Chain ID: 1337)! Hiện tại: ${newChainId}`
            );
          }
        }

        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length === 0) {
          setWalletError("Vui lòng kết nối ví MetaMask để tiếp tục!");
        } else {
          setAccount(accounts[0]);
          await checkUserAndWallet(accounts[0]);
        }

        const address = await getContractAddress();
        setContractAddress(address);
        console.log("Contract Address:", address);

        const abi = convertABIIfNeeded(contractABI);
        if (!abi) throw new Error("ABI không hợp lệ!");
        const contractInstance = new web3Instance.eth.Contract(abi, address);
        console.log("Contract methods:", Object.keys(contractInstance.methods));
        setContract(contractInstance);

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("disconnect", handleDisconnect);
      } catch (error) {
        console.error("Lỗi khi khởi tạo Web3:", error);
        setContractError(
          "Không thể khởi tạo hợp đồng thông minh: " + error.message
        );
        setContract(null);
      } finally {
        setLoading(false);
      }
    };

    initWeb3();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts) => {
    const newAccount = accounts[0] || null;
    console.log("Tài khoản MetaMask thay đổi:", newAccount);
    setAccount(newAccount);
    if (newAccount) {
      await checkUserAndWallet(newAccount);
    } else {
      setWalletError("Ví MetaMask đã ngắt kết nối! Vui lòng kết nối lại.");
    }
  };

  const handleDisconnect = () => {
    console.log("Ví MetaMask đã ngắt kết nối");
    setAccount(null);
    setWalletError("Ví MetaMask đã ngắt kết nối! Vui lòng kết nối lại.");
  };

  const connectWallet = async (web3Instance = web3) => {
    if (!web3Instance) throw new Error("Web3 chưa được khởi tạo!");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Kết nối ví MetaMask thành công:", accounts);
      setAccount(accounts[0]);
      setWalletError(null); // Xóa lỗi khi kết nối thành công
      await checkUserAndWallet(accounts[0]);
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      if (error.code === -32002) {
        setWalletError("Yêu cầu kết nối đang chờ xử lý trong MetaMask!");
      } else {
        setWalletError("Không thể kết nối ví MetaMask: " + error.message);
      }
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

      if (!currentAccount) {
        setWalletError("Không tìm thấy địa chỉ ví MetaMask!");
        setUserError(null);
        return;
      }

      console.log("Gọi API /check-role với địa chỉ ví:", currentAccount);
      const response = await axios.get("http://localhost:3000/check-role", {
        headers: { "x-ethereum-address": currentAccount },
      });

      const { walletAddress, role } = response.data;
      console.log("Kết quả từ API /check-role:", { walletAddress, role });
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
      if (error.response && error.response.status === 401) {
        setWalletError(
          "Địa chỉ ví MetaMask không được liên kết với tài khoản. Vui lòng cập nhật ví trong hệ thống."
        );
      } else {
        setWalletError("Không thể xác thực ví MetaMask: " + error.message);
      }
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
      throw new Error("Không thể cập nhật ví: " + error.message);
    }
  };

  const checkNodeSync = async () => {
    try {
      if (!web3) throw new Error("Web3 chưa được khởi tạo!");
      const isListening = await web3.eth.net.isListening();
      if (!isListening) {
        throw new Error(
          "Hardhat Network không đang chạy! Vui lòng khởi động node bằng lệnh 'npx hardhat node'."
        );
      }

      const blockNumber = await web3.eth.getBlockNumber();
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId, "Block Number:", blockNumber);

      if (Number(networkId) !== 1337) {
        throw new Error(
          `Sai mạng! Đang kết nối với Network ID ${networkId}, yêu cầu Hardhat Network (1337).`
        );
      }
      if (blockNumber === undefined || blockNumber === null) {
        throw new Error(
          "Node không phản hồi! Vui lòng kiểm tra Hardhat Network."
        );
      }
      return { networkId, blockNumber };
    } catch (error) {
      console.error("Lỗi kiểm tra node:", error);
      throw new Error(
        error.message.includes("Hardhat Network không đang chạy") ||
        error.message.includes("Node không phản hồi")
          ? error.message
          : "Không thể kết nối với node Ethereum: " + error.message
      );
    }
  };

  const testContract = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được khởi tạo đúng!");
      if (!contractAddress)
        throw new Error("Địa chỉ hợp đồng không được định nghĩa!");
      const code = await web3.eth.getCode(contractAddress);
      console.log(`Bytecode tại địa chỉ ${contractAddress}:`, code);
      if (code === "0x") {
        throw new Error(
          `Hợp đồng không tồn tại tại địa chỉ: ${contractAddress}! Vui lòng kiểm tra file D:\\fruit-supply-chain\\contract-address.txt hoặc triển khai lại hợp đồng bằng 'npx hardhat run scripts/deploy.js --network localhost'.`
        );
      }
      const owner = await contract.methods.owner().call();
      console.log("Owner:", owner);
      return true;
    } catch (error) {
      console.error("Lỗi kiểm tra hợp đồng:", error);
      throw new Error(
        `Hợp đồng hoặc ABI không hợp lệ! Chi tiết: ${error.message}`
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
      throw new Error("Web3, contract hoặc account chưa được khởi tạo!");
    if (userError) throw new Error(userError);
    if (walletError) throw new Error(walletError);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "DeliveryHub") {
      throw new Error("Bạn không có quyền thực hiện hành động này!");
    }

    if (type === "listProductForSale") {
      try {
        const { networkId, blockNumber } = await checkNodeSync();
        console.log(
          "Node synced - Network ID:",
          networkId,
          "Block Number:",
          blockNumber
        );

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
            `Bạn không có quyền thực hiện giao dịch này! Owner: ${owner}, Account: ${account}`
          );
        }

        const productResponse = await axios.get(
          `http://localhost:3000/products/${productId}`,
          { headers: { "x-ethereum-address": account } }
        );
        const product = productResponse.data;
        const farmResponse = await axios.get(
          `http://localhost:3000/farms/${product.farm_id}`,
          { headers: { "x-ethereum-address": account } }
        );
        const farm = farmResponse.data;

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
          catalogExists = catalog[0].length > 0;
        } catch (e) {
          console.log("Catalog chưa tồn tại, sẽ thêm mới:", e.message);
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
          await contract.methods
            .addFruitCatalog(
              fruitType,
              `Mô tả về ${fruitType}`,
              "Tháng 8 - Tháng 12",
              "Chứa nhiều vitamin",
              "Bảo quản khô ráo",
              [`${fruitType} Giống 1`, `${fruitType} Giống 2`]
            )
            .send({
              from: account,
              gas: Math.floor(Number(gasEstimate) * 1.5),
            });
          console.log("Đã thêm fruit catalog:", fruitType);
        }

        let farmExists = false;
        try {
          const farmData = await contract.methods.getFarmData(farmId).call();
          farmExists = farmData[0].length > 0;
        } catch (e) {
          console.log("Farm chưa tồn tại, sẽ đăng ký mới:", e.message);
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
          await contract.methods
            .registerFarm(
              farmId,
              farm.location || "Unknown",
              farm.weather_condition || "Unknown",
              "Đất phù sa",
              farm.current_conditions || "19.65°C"
            )
            .send({
              from: account,
              gas: Math.floor(Number(gasEstimate) * 1.5),
            });
          console.log("Đã đăng ký farm:", farmId);
        }

        const inventoryResponse = await axios.get(
          `http://localhost:3000/inventory/by-id/${inventoryId}`,
          { headers: { "x-ethereum-address": account } }
        );
        let fruitId = inventoryResponse.data?.fruit_id || 0;

        if (!fruitId) {
          const gasEstimate = await contract.methods
            .harvestFruit(fruitType, origin, farmId, quality)
            .estimateGas({ from: account });
          const tx = await contract.methods
            .harvestFruit(fruitType, origin, farmId, quality)
            .send({
              from: account,
              gas: Math.floor(Number(gasEstimate) * 1.5),
            });
          fruitId = Number(await contract.methods.fruitCount().call());
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
        const tx = await contract.methods
          .listProductForSale(fruitId, priceInWei, quantity)
          .send({ from: account, gas: Math.floor(Number(gasEstimate) * 1.5) });
        const listingId = tx.events.ProductListed.returnValues.listingId;

        console.log("Đã đăng bán sản phẩm với Listing ID:", listingId);
        return { transactionHash: tx.transactionHash, listingId };
      } catch (error) {
        console.error("Lỗi giao dịch chi tiết:", error);
        throw new Error(
          error.message.includes("Hardhat Network") ||
          error.message.includes("Node không phản hồi")
            ? error.message
            : "Không thể thực hiện giao dịch: " + error.message
        );
      }
    } else {
      throw new Error("Loại giao dịch không được hỗ trợ!");
    }
  };

  const addManager = async (managerAddress) => {
    if (!web3 || !contract || !account)
      throw new Error("Web3 chưa được khởi tạo!");

    try {
      await checkNodeSync();

      const owner = await contract.methods.owner().call();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(
          `Chỉ owner (${owner}) mới có thể thêm manager! Vui lòng chuyển sang tài khoản owner.`
        );
      }

      const gasEstimate = await contract.methods
        .addManager(managerAddress)
        .estimateGas({ from: account });

      const gasEstimateNumber = Number(gasEstimate);
      if (isNaN(gasEstimateNumber)) {
        throw new Error("Không thể chuyển đổi gas estimate thành số!");
      }

      const gasLimit = Math.floor(gasEstimateNumber * 1.5);
      console.log(
        "Gas Estimate for addManager:",
        gasEstimateNumber,
        "Gas Limit:",
        gasLimit
      );

      const tx = await contract.methods
        .addManager(managerAddress)
        .send({ from: account, gas: gasLimit });
      console.log(
        `Đã cấp quyền manager cho ${managerAddress}. Transaction Hash:`,
        tx.transactionHash
      );

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
    addManager,
    loading,
    walletError,
    userError,
    contractError,
    updateWalletAddress,
    setWalletError,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export default Web3Provider;
