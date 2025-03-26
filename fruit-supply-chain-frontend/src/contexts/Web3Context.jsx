import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";

// ABI của smart contract FruitSupplyChain
const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "fruitType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CatalogAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "farmId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "conditions",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "FarmUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fruitId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "ProductListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "fruitId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "recommendation",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "RecommendationAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "fruitId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "step",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "StepRecorded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_fruitType",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "string",
        name: "_growingSeason",
        type: "string",
      },
      {
        internalType: "string",
        name: "_nutritionalValue",
        type: "string",
      },
      {
        internalType: "string",
        name: "_storageConditions",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "_commonVarieties",
        type: "string[]",
      },
    ],
    name: "addFruitCatalog",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_manager",
        type: "address",
      },
    ],
    name: "addManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fruitId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_recommendation",
        type: "string",
      },
    ],
    name: "addRecommendation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "authorizedManagers",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "farms",
    outputs: [
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "climate",
        type: "string",
      },
      {
        internalType: "string",
        name: "soil",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "currentConditions",
        type: "string",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "fruitCatalogs",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "growingSeason",
        type: "string",
      },
      {
        internalType: "string",
        name: "nutritionalValue",
        type: "string",
      },
      {
        internalType: "string",
        name: "storageConditions",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fruitCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "fruits",
    outputs: [
      {
        internalType: "string",
        name: "fruitType",
        type: "string",
      },
      {
        internalType: "string",
        name: "origin",
        type: "string",
      },
      {
        internalType: "address",
        name: "producer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "harvestDate",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "quality",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllActiveListings",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllFarms",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllFruitTypes",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_farmId",
        type: "string",
      },
    ],
    name: "getFarmData",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fruitId",
        type: "uint256",
      },
    ],
    name: "getFruit",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_fruitType",
        type: "string",
      },
    ],
    name: "getFruitCatalog",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "getListedProduct",
    outputs: [
      {
        internalType: "uint256",
        name: "fruitId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "listedTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_seller",
        type: "address",
      },
    ],
    name: "getSellerListings",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_fruitType",
        type: "string",
      },
      {
        internalType: "string",
        name: "_origin",
        type: "string",
      },
      {
        internalType: "string",
        name: "_farmId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_quality",
        type: "string",
      },
    ],
    name: "harvestFruit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fruitId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
    ],
    name: "listProductForSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "listedProducts",
    outputs: [
      {
        internalType: "uint256",
        name: "fruitId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "listedTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "listingCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "listingIds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fruitId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_step",
        type: "string",
      },
    ],
    name: "recordStep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_farmId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_location",
        type: "string",
      },
      {
        internalType: "string",
        name: "_climate",
        type: "string",
      },
      {
        internalType: "string",
        name: "_soil",
        type: "string",
      },
      {
        internalType: "string",
        name: "_currentConditions",
        type: "string",
      },
    ],
    name: "registerFarm",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "registeredFarms",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "registeredFruitTypes",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_manager",
        type: "address",
      },
    ],
    name: "removeManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "sellerListings",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_farmId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_conditions",
        type: "string",
      },
    ],
    name: "updateFarmConditions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Địa chỉ smart contract đã deploy
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

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

      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        try {
          // Khởi tạo contract
          const contractInstance = new web3Instance.eth.Contract(
            contractABI,
            contractAddress
          );
          setContract(contractInstance);

          // Kiểm tra xem người dùng đã kết nối ví trước đó chưa
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await checkUserAndWallet(accounts[0]);
          }

          // Lắng nghe sự kiện thay đổi tài khoản
          window.ethereum.on("accountsChanged", async (accounts) => {
            const newAccount = accounts[0] || null;
            setAccount(newAccount);
            if (newAccount) {
              await checkUserAndWallet(newAccount);
            } else {
              setWalletError("Ví MetaMask đã ngắt kết nối!");
            }
          });

          // Lắng nghe sự kiện ngắt kết nối
          window.ethereum.on("disconnect", () => {
            setAccount(null);
            setWalletError("Ví MetaMask đã ngắt kết nối!");
          });
        } catch (error) {
          console.error("Lỗi khi khởi tạo Web3:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.error("MetaMask không được cài đặt!");
        setLoading(false);
      }
    };

    initWeb3();
  }, []);

  const connectWallet = async () => {
    if (!web3) {
      throw new Error("Web3 chưa được khởi tạo!");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      await checkUserAndWallet(accounts[0]);
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
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
        headers: {
          "x-ethereum-address": currentAccount,
        },
      });

      const storedWalletAddress = response.data.walletAddress;
      const storedRole = response.data.role;

      // Kiểm tra vai trò user từ database
      if (storedRole !== user.role) {
        setUserError("Vai trò của bạn đã thay đổi. Vui lòng đăng nhập lại!");
        setWalletError(null);
        return;
      }

      if (
        storedWalletAddress &&
        storedWalletAddress.toLowerCase() !== currentAccount.toLowerCase()
      ) {
        setWalletError(
          "Địa chỉ ví MetaMask không khớp với tài khoản của bạn. Vui lòng cập nhật ví!"
        );
        setUserError(null);
      } else {
        setWalletError(null);
        setUserError(null);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra user và ví:", error);
      setWalletError("Không thể xác thực ví MetaMask. Vui lòng thử lại!");
      setUserError(null);
    }
  };

  const updateWalletAddress = async (email) => {
    if (!account) {
      throw new Error("Ví MetaMask chưa được kết nối!");
    }

    try {
      await axios.post("http://localhost:3000/update-wallet", {
        email: email,
        walletAddress: account,
      });
      setWalletError(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật ví:", error);
      throw new Error("Không thể cập nhật ví. Vui lòng thử lại!");
    }
  };

  const executeTransaction = async ({
    type,
    productId,
    price,
    quantity,
    inventoryId,
  }) => {
    if (!web3 || !contract || !account) {
      throw new Error(
        "Web3, contract hoặc account chưa được khởi tạo! Vui lòng kết nối ví MetaMask."
      );
    }

    if (userError) {
      throw new Error(userError);
    }

    if (walletError) {
      throw new Error(walletError);
    }

    // Kiểm tra vai trò user trước khi thực hiện giao dịch
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "DeliveryHub") {
      throw new Error(
        "Bạn không có quyền thực hiện hành động này! Vui lòng đăng nhập với vai trò DeliveryHub."
      );
    }

    try {
      if (type === "listProductForSale") {
        // Lấy thông tin sản phẩm từ database
        const productResponse = await axios.get(
          `http://localhost:3000/products/${productId}`,
          {
            headers: {
              "x-ethereum-address": account,
            },
          }
        );
        const product = productResponse.data;

        if (!product) {
          throw new Error("Không tìm thấy sản phẩm trong database!");
        }

        // Lấy thông tin farm từ database
        const farmResponse = await axios.get(
          `http://localhost:3000/farms/${product.farm_id}`,
          {
            headers: {
              "x-ethereum-address": account,
            },
          }
        );
        const farm = farmResponse.data;

        if (!farm) {
          throw new Error("Không tìm thấy farm trong database!");
        }

        const fruitType = product.name;
        const origin = product.origin || "Việt Nam";
        const farmId = farm.farm_name;
        const quality = product.quality || "Tốt";

        // Kiểm tra xem fruitType đã tồn tại trong fruitCatalogs chưa
        try {
          await contract.methods.getFruitCatalog(fruitType).call();
        } catch (error) {
          console.log(
            `Fruit type ${fruitType} not found in catalog, adding...`
          );
          await contract.methods
            .addFruitCatalog(
              fruitType,
              `Mô tả về ${fruitType}`,
              "Tháng 8 - Tháng 12",
              `Chứa nhiều vitamin C, chất xơ`,
              "Bảo quản ở nơi khô ráo, thoáng mát",
              [`${fruitType} Giống 1`, `${fruitType} Giống 2`]
            )
            .send({ from: account });
        }

        // Kiểm tra xem farmId đã tồn tại trong smart contract chưa
        try {
          await contract.methods.getFarmData(farmId).call();
        } catch (error) {
          console.log(`Farm ${farmId} not found, registering...`);
          await contract.methods
            .registerFarm(
              farmId,
              farm.location || "Unknown Location",
              farm.weather_condition || "Unknown Climate",
              "Đất phù sa",
              farm.current_conditions || "19.65°C, Ẩm ướt"
            )
            .send({ from: account });
        }

        // Kiểm tra xem fruitId đã tồn tại chưa
        let fruitId;
        const inventoryResponse = await axios.get(
          `http://localhost:3000/inventory/by-id/${inventoryId}`,
          {
            headers: {
              "x-ethereum-address": account,
            },
          }
        );
        const inventoryItem = inventoryResponse.data;

        if (inventoryItem && inventoryItem.fruit_id) {
          fruitId = parseInt(inventoryItem.fruit_id, 10);
        } else {
          // Gọi harvestFruit nếu fruitId chưa tồn tại
          const harvestTx = await contract.methods
            .harvestFruit(fruitType, origin, farmId, quality)
            .send({ from: account });

          fruitId = await contract.methods.fruitCount().call();

          // Cập nhật fruit_id vào database
          await axios.put(
            `http://localhost:3000/inventory/${inventoryId}/fruit-id`,
            { fruitId: fruitId },
            {
              headers: {
                "x-ethereum-address": account,
              },
            }
          );
        }

        // Chuyển giá từ AGT sang Wei (giả sử 1 AGT = 1 Ether)
        const priceInWei = web3.utils.toWei(price.toString(), "ether");

        // Gọi hàm listProductForSale trên smart contract
        const tx = await contract.methods
          .listProductForSale(fruitId, priceInWei, quantity)
          .send({ from: account });

        // Lấy listingId từ event ProductListed
        if (!tx.events || !tx.events.ProductListed) {
          throw new Error(
            "Không thể đăng bán sản phẩm: Event ProductListed không được emit"
          );
        }

        const listingId = tx.events.ProductListed.returnValues.listingId;

        return {
          transactionHash: tx.transactionHash,
          listingId: listingId,
        };
      } else {
        throw new Error("Loại giao dịch không được hỗ trợ!");
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện giao dịch:", error);
      throw error;
    }
  };

  const getSellerListings = async () => {
    if (!web3 || !contract || !account) {
      throw new Error("Web3, contract hoặc account chưa được khởi tạo!");
    }

    try {
      const listingIds = await contract.methods
        .getSellerListings(account)
        .call();
      const listings = [];

      for (let listingId of listingIds) {
        try {
          const listing = await contract.methods
            .getListedProduct(listingId)
            .call();
          if (listing.isActive) {
            listings.push({
              listingId: listingId,
              fruitId: listing.fruitId,
              price: web3.utils.fromWei(listing.price, "ether"),
              quantity: Number(listing.quantity),
              seller: listing.seller,
              isActive: listing.isActive,
              listedTimestamp: Number(listing.listedTimestamp),
            });
          }
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin listing ${listingId}:`, error);
          continue;
        }
      }

      return listings;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch blockchain:", error);
      return [];
    }
  };

  const value = {
    web3,
    account,
    contract,
    connectWallet,
    executeTransaction,
    getSellerListings,
    loading,
    walletError,
    userError,
    updateWalletAddress,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
