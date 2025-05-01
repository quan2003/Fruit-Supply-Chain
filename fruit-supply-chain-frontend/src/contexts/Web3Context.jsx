import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers"; // Sử dụng ethers thay vì web3.js
import axios from "axios";
import contractData from "../contracts/FruitSupplyChain.json";
import governmentRegulatorData from "../contracts/GovernmentRegulator.json"; // Thêm ABI của GovernmentRegulator

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [fruitSupplyChain, setFruitSupplyChain] = useState(null);
  const [governmentRegulator, setGovernmentRegulator] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [contractError, setContractError] = useState(null);

  const contractABI = contractData.abi;
  const governmentRegulatorABI = governmentRegulatorData.abi;

  const getContractAddress = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/contract-address"
      );
      const address = response.data.address;
      if (!ethers.isAddress(address)) {
        throw new Error("Địa chỉ hợp đồng không hợp lệ: " + address);
      }
      return address;
    } catch (error) {
      throw new Error(
        "Không thể lấy địa chỉ hợp đồng từ backend: " + error.message
      );
    }
  };

  useEffect(() => {
    const initWeb3 = async () => {
      setLoading(true);
      setWalletError(null);
      setContractError(null);
      setUserError(null);

      try {
        if (!window.ethereum) {
          throw new Error("Vui lòng cài đặt MetaMask để tiếp tục!");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        console.log("Đã khởi tạo Provider");

        const chainId = Number(await provider.send("eth_chainId", []));
        console.log("Chain ID:", chainId);
        if (chainId !== 1337) {
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
                `Vui lòng chuyển MetaMask sang Hardhat Localhost (Chain ID: 1337)! Hiện tại: ${chainId}`
              );
            }
          }
          const newChainId = Number(await provider.send("eth_chainId", []));
          if (newChainId !== 1337) {
            throw new Error(
              `Vui lòng chuyển MetaMask sang Hardhat Localhost (Chain ID: 1337)! Hiện tại: ${newChainId}`
            );
          }
        }

        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length === 0) {
          setWalletError("Vui lòng kết nối ví MetaMask để tiếp tục!");
        } else {
          const signer = await provider.getSigner();
          setSigner(signer);
          setAccount(accounts[0]);
          await checkUserAndWallet(accounts[0]);
        }

        const fruitSupplyChainAddress = await getContractAddress();
        console.log("Địa chỉ FruitSupplyChain:", fruitSupplyChainAddress);
        setContractAddress(fruitSupplyChainAddress);

        // Kiểm tra mã bytecode tại địa chỉ hợp đồng
        const code = await provider.getCode(fruitSupplyChainAddress);
        if (code === "0x") {
          throw new Error(
            `Không có hợp đồng tại địa chỉ: ${fruitSupplyChainAddress}`
          );
        }

        const fruitSupplyChainContract = new ethers.Contract(
          fruitSupplyChainAddress,
          contractABI,
          provider
        );
        console.log("Hợp đồng FruitSupplyChain:", fruitSupplyChainContract);
        setFruitSupplyChain(fruitSupplyChainContract);

        const governmentRegulatorAddress =
          "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
        const governmentRegulatorContract = new ethers.Contract(
          governmentRegulatorAddress,
          governmentRegulatorABI,
          provider
        );
        setGovernmentRegulator(governmentRegulatorContract);

        // Kiểm tra các phương thức của hợp đồng
        if (
          typeof fruitSupplyChainContract.listProductForSale !== "function" ||
          typeof fruitSupplyChainContract.purchaseProduct !== "function"
        ) {
          throw new Error(
            "Hợp đồng FruitSupplyChain không có các hàm cần thiết!"
          );
        }
        if (
          typeof governmentRegulatorContract.createTripartyContract !==
            "function" ||
          typeof governmentRegulatorContract.signContract !== "function"
        ) {
          throw new Error(
            "Hợp đồng GovernmentRegulator không có các hàm cần thiết!"
          );
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("disconnect", handleDisconnect);
      } catch (error) {
        console.error("Lỗi khi khởi tạo Web3:", error);
        if (error.message.includes("MetaMask")) {
          setWalletError(error.message);
        } else if (error.message.includes("Hợp đồng")) {
          setContractError(error.message);
        } else {
          setContractError(
            "Không thể khởi tạo hợp đồng thông minh: " + error.message
          );
        }
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
    setAccount(newAccount);
    if (newAccount) {
      const signer = await provider.getSigner();
      setSigner(signer);
      await checkUserAndWallet(newAccount);
    } else {
      setWalletError("Ví MetaMask đã ngắt kết nối! Vui lòng kết nối lại.");
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setSigner(null);
    setWalletError("Ví MetaMask đã ngắt kết nối! Vui lòng kết nối lại.");
  };

  const connectWallet = async () => {
    if (!provider) throw new Error("Provider chưa được khởi tạo!");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = await provider.getSigner();
      setSigner(signer);
      setAccount(accounts[0]);
      setWalletError(null);
      await checkUserAndWallet(accounts[0]);
    } catch (error) {
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
      throw new Error("Không thể cập nhật ví: " + error.message);
    }
  };

  const checkNodeSync = async () => {
    try {
      if (!provider) throw new Error("Provider chưa được khởi tạo!");
      const isListening = await provider.send("net_listening", []);
      if (!isListening) {
        throw new Error(
          "Hardhat Network không đang chạy! Vui lòng khởi động node bằng lệnh 'npx hardhat node'."
        );
      }

      const blockNumber = await provider.getBlockNumber();
      const networkId = Number(await provider.send("net_version", []));
      if (networkId !== 1337) {
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
      if (!fruitSupplyChain || !governmentRegulator) {
        throw new Error("Contract chưa được khởi tạo đúng!");
      }
      if (!contractAddress) {
        throw new Error("Địa chỉ hợp đồng không được định nghĩa!");
      }
      const code = await provider.getCode(contractAddress);
      if (code === "0x") {
        throw new Error(
          `Hợp đồng không tồn tại tại địa chỉ: ${contractAddress}! Vui lòng kiểm tra file D:\\fruit-supply-chain\\contract-address.txt hoặc triển khai lại hợp đồng bằng 'npx hardhat run scripts/deploy.js --network localhost'.`
        );
      }
      const owner = await fruitSupplyChain.owner();
      return true;
    } catch (error) {
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
    listingId,
    totalPrice,
  }) => {
    if (!provider || !fruitSupplyChain || !governmentRegulator || !account) {
      throw new Error("Provider, contract hoặc account chưa được khởi tạo!");
    }
    if (userError) throw new Error(userError);
    if (walletError) throw new Error(walletError);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      throw new Error("Vui lòng đăng nhập để thực hiện hành động này!");
    }

    if (type === "listProductForSale" && user.role !== "DeliveryHub") {
      throw new Error("Chỉ DeliveryHub mới có thể đăng bán sản phẩm!");
    }
    if (type === "purchaseProduct" && user.role !== "Customer") {
      throw new Error("Chỉ Customer mới có thể mua sản phẩm!");
    }

    const contractWithSigner = fruitSupplyChain.connect(signer);

    if (type === "listProductForSale") {
      try {
        await checkNodeSync();
        await testContract();

        const owner = await contractWithSigner.owner();
        const isManager = await contractWithSigner.authorizedManagers(account);
        if (owner.toLowerCase() !== account.toLowerCase() && !isManager) {
          throw new Error(
            `Bạn không có quyền thực hiện giao dịch này! Owner: ${owner}, Account: ${account}`
          );
        }

        if (!productId || productId === "undefined" || isNaN(productId)) {
          throw new Error("ID sản phẩm không hợp lệ!");
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
          const catalog = await contractWithSigner.getFruitCatalog(fruitType);
          catalogExists = catalog[0].length > 0;
        } catch (e) {
          console.log("Catalog chưa tồn tại, sẽ thêm mới:", e.message);
        }

        if (!catalogExists) {
          const tx = await contractWithSigner.addFruitCatalog(
            fruitType,
            `Mô tả về ${fruitType}`,
            "Tháng 8 - Tháng 12",
            "Chứa nhiều vitamin",
            "Bảo quản khô ráo",
            [`${fruitType} Giống 1`, `${fruitType} Giống 2`]
          );
          await tx.wait();
          console.log("Đã thêm fruit catalog:", fruitType);
        }

        let farmExists = false;
        try {
          const farmData = await contractWithSigner.getFarmData(farmId);
          farmExists = farmData[0].length > 0;
        } catch (e) {
          console.log("Farm chưa tồn tại, sẽ đăng ký mới:", e.message);
        }

        if (!farmExists) {
          const tx = await contractWithSigner.registerFarm(
            farmId,
            farm.location || "Unknown",
            farm.weather_condition || "Unknown",
            "Đất phù sa",
            farm.current_conditions || "19.65°C"
          );
          await tx.wait();
          console.log("Đã đăng ký farm:", farmId);
        }

        const inventoryResponse = await axios.get(
          `http://localhost:3000/inventory/by-id/${inventoryId}`,
          { headers: { "x-ethereum-address": account } }
        );
        let fruitId = inventoryResponse.data?.fruit_id || 0;

        const fruitCount = await contractWithSigner.fruitCount();
        if (fruitId <= 0 || fruitId > Number(fruitCount)) {
          console.log("Fruit ID không hợp lệ, sẽ gọi harvestFruit...");
          const tx = await contractWithSigner.harvestFruit(
            fruitType,
            origin,
            farmId,
            quality,
            quantity
          );
          await tx.wait();
          fruitId = Number(await contractWithSigner.fruitCount());
          await axios.put(
            `http://localhost:3000/inventory/${inventoryId}/fruit-id`,
            { fruitId },
            { headers: { "x-ethereum-address": account } }
          );
          console.log("Đã thu hoạch fruit với ID:", fruitId);
        } else {
          const fruitData = await contractWithSigner.getFruit(fruitId);
          const fruitQuantity = Number(fruitData[7]);
          if (quantity > fruitQuantity) {
            console.log("Số lượng không đủ, sẽ gọi harvestFruit để bổ sung...");
            const tx = await contractWithSigner.harvestFruit(
              fruitType,
              origin,
              farmId,
              quality,
              quantity
            );
            await tx.wait();
            fruitId = Number(await contractWithSigner.fruitCount());
            await axios.put(
              `http://localhost:3000/inventory/${inventoryId}/fruit-id`,
              { fruitId },
              { headers: { "x-ethereum-address": account } }
            );
            console.log("Đã thu hoạch fruit với ID:", fruitId);
          }
        }

        const priceInWei = ethers.parseEther(price.toString());
        const tx = await contractWithSigner.listProductForSale(
          fruitId,
          priceInWei,
          quantity,
          true
        );
        const receipt = await tx.wait();
        const listingId = receipt.logs
          .filter(
            (log) =>
              log.topics[0] ===
              ethers.id("ProductListed(uint256,uint256,uint256,uint256,bool)")
          )[0]
          .args.listingId.toString();

        console.log("Đã đăng bán sản phẩm với Listing ID:", listingId);
        return { transactionHash: tx.hash, listingId };
      } catch (error) {
        throw new Error(
          error.message.includes("Hardhat Network") ||
          error.message.includes("Node không phản hồi")
            ? error.message
            : "Không thể thực hiện giao dịch: " + error.message
        );
      }
    } else if (type === "purchaseProduct") {
      try {
        await checkNodeSync();
        await testContract();

        const productResponse = await contractWithSigner.getListedProduct(
          listingId
        );
        if (!productResponse.isActive) {
          throw new Error(
            `Sản phẩm với Listing ID ${listingId} không còn khả dụng!`
          );
        }
        if (productResponse.quantity <= 0) {
          throw new Error(`Sản phẩm với Listing ID ${listingId} đã hết hàng!`);
        }
        if (
          ethers.parseEther(totalPrice.toString()) <
          ethers.parseEther(productResponse.price.toString())
        ) {
          throw new Error(
            `Số tiền không đủ để mua sản phẩm! Cần ít nhất ${ethers.formatEther(
              productResponse.price
            )} ETH`
          );
        }

        const balance = await provider.getBalance(account);
        if (balance < ethers.parseEther(totalPrice.toString())) {
          throw new Error(
            `Số dư ví không đủ! Cần ít nhất ${ethers.formatEther(
              totalPrice
            )} ETH, nhưng ví chỉ có ${ethers.formatEther(balance)} ETH`
          );
        }

        const tx = await contractWithSigner.purchaseProduct(listingId, {
          value: ethers.parseEther(totalPrice.toString()),
        });
        await tx.wait();

        console.log("Đã mua sản phẩm với Listing ID:", listingId);
        return { transactionHash: tx.hash };
      } catch (error) {
        throw new Error(
          error.message.includes("Hardhat Network") ||
          error.message.includes("Node không phản hồi")
            ? error.message
            : "Không thể thực hiện giao dịch mua sản phẩm: " + error.message
        );
      }
    } else {
      throw new Error("Loại giao dịch không được hỗ trợ!");
    }
  };

  const addManager = async (managerAddress) => {
    if (!provider || !fruitSupplyChain || !account) {
      throw new Error("Provider chưa được khởi tạo!");
    }
    try {
      await checkNodeSync();

      const contractWithSigner = fruitSupplyChain.connect(signer);
      const owner = await contractWithSigner.owner();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(
          `Chỉ owner (${owner}) mới có thể thêm manager! Vui lòng chuyển sang tài khoản owner.`
        );
      }

      const tx = await contractWithSigner.addManager(managerAddress);
      await tx.wait();

      const isManager = await contractWithSigner.authorizedManagers(
        managerAddress
      );
      if (!isManager) {
        throw new Error(
          "Giao dịch thành công nhưng địa chỉ này không được cấp quyền manager!"
        );
      }

      return { transactionHash: tx.hash };
    } catch (error) {
      throw new Error("Không thể thêm manager: " + error.message);
    }
  };

  const value = {
    provider,
    account,
    fruitSupplyChain,
    governmentRegulator,
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
