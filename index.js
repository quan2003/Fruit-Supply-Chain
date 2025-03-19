const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// Kết nối với Ganache
const web3 = new Web3("http://127.0.0.1:7545");

// Thông tin contract
const contractAddress = "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d";
const contractABI = require("./build/contracts/FruitSupplyChain.json").abi;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Tài khoản từ Ganache
const account = "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC";

// Middleware kiểm tra quyền (simplified version)
const checkAuth = async (req, res, next) => {
  // Trong thực tế, bạn cần có một hệ thống xác thực đầy đủ
  // Đây chỉ là mẫu đơn giản
  const userAddress = req.headers["x-ethereum-address"];
  if (!userAddress) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const isAuthorized = await contract.methods
      .authorizedManagers(userAddress)
      .call();
    if (isAuthorized) {
      req.userAddress = userAddress;
      next();
    } else {
      res.status(403).json({ error: "Not authorized" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==== DANH MỤC TRÁI CÂY ====

// API: Thêm danh mục trái cây
app.post("/catalog", checkAuth, async (req, res) => {
  const {
    fruitType,
    description,
    growingSeason,
    nutritionalValue,
    storageConditions,
    commonVarieties,
  } = req.body;

  try {
    await contract.methods
      .addFruitCatalog(
        fruitType,
        description,
        growingSeason,
        nutritionalValue,
        storageConditions,
        commonVarieties
      )
      .send({ from: req.userAddress || account, gas: 500000 });

    res.json({ message: "Fruit catalog added", fruitType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy thông tin danh mục trái cây
app.get("/catalog/:fruitType", async (req, res) => {
  const fruitType = req.params.fruitType;

  try {
    const catalog = await contract.methods.getFruitCatalog(fruitType).call();
    res.json({
      name: catalog[0],
      description: catalog[1],
      growingSeason: catalog[2],
      nutritionalValue: catalog[3],
      storageConditions: catalog[4],
      commonVarieties: catalog[5],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy tất cả các loại trái cây
app.get("/catalogs", async (req, res) => {
  try {
    const fruitTypes = await contract.methods.getAllFruitTypes().call();
    res.json({ fruitTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== NÔNG TRẠI ====

// API: Đăng ký nông trại
app.post("/farm", async (req, res) => {
  const { farmId, location, climate, soil, currentConditions } = req.body;
  const userAddress = req.headers["x-ethereum-address"] || account;

  try {
    await contract.methods
      .registerFarm(farmId, location, climate, soil, currentConditions)
      .send({ from: userAddress, gas: 500000 });

    res.json({ message: "Farm registered", farmId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Cập nhật điều kiện nông trại
app.put("/farm/:farmId", async (req, res) => {
  const farmId = req.params.farmId;
  const { conditions } = req.body;
  const userAddress = req.headers["x-ethereum-address"] || account;

  try {
    await contract.methods
      .updateFarmConditions(farmId, conditions)
      .send({ from: userAddress, gas: 300000 });

    res.json({ message: "Farm conditions updated", farmId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy thông tin nông trại
app.get("/farm/:farmId", async (req, res) => {
  const farmId = req.params.farmId;

  try {
    const farm = await contract.methods.getFarmData(farmId).call();
    res.json({
      location: farm[0],
      climate: farm[1],
      soil: farm[2],
      lastUpdated: new Date(farm[3] * 1000).toISOString(),
      currentConditions: farm[4],
      owner: farm[5],
      fruitIds: farm[6],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy tất cả các nông trại
app.get("/farms", async (req, res) => {
  try {
    const farms = await contract.methods.getAllFarms().call();
    res.json({ farms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== TRÁI CÂY ====

// API: Thu hoạch trái cây (mở rộng)
app.post("/harvest", async (req, res) => {
  const { fruitType, origin, farmId, quality } = req.body;
  const userAddress = req.headers["x-ethereum-address"] || account;

  try {
    await contract.methods
      .harvestFruit(fruitType, origin, farmId, quality)
      .send({ from: userAddress, gas: 500000 });

    const fruitId = await contract.methods.fruitCount().call();
    res.json({ message: "Fruit harvested", fruitId: fruitId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Ghi bước
app.post("/record-step", async (req, res) => {
  const { fruitId, step } = req.body;
  const userAddress = req.headers["x-ethereum-address"] || account;

  try {
    await contract.methods
      .recordStep(fruitId, step)
      .send({ from: userAddress, gas: 300000 });

    res.json({ message: `Step ${step} recorded` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Thêm khuyến nghị
app.post("/recommendation", checkAuth, async (req, res) => {
  const { fruitId, recommendation } = req.body;

  try {
    await contract.methods
      .addRecommendation(fruitId, recommendation)
      .send({ from: req.userAddress || account, gas: 300000 });

    res.json({ message: "Recommendation added", fruitId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tra cứu trái cây
app.get("/fruit/:id", async (req, res) => {
  const fruitId = req.params.id;

  try {
    const fruit = await contract.methods.getFruit(fruitId).call();
    res.json({
      fruitType: fruit[0],
      origin: fruit[1],
      producer: fruit[2],
      history: fruit[3],
      harvestDate: new Date(fruit[4] * 1000).toISOString(),
      quality: fruit[5],
      recommendations: fruit[6],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== QUẢN LÝ HỆ THỐNG ====

// API: Thêm quản lý
app.post("/manager", checkAuth, async (req, res) => {
  const { address } = req.body;

  try {
    await contract.methods
      .addManager(address)
      .send({ from: req.userAddress || account, gas: 100000 });

    res.json({ message: "Manager added", address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Xóa quản lý
app.delete("/manager/:address", checkAuth, async (req, res) => {
  const address = req.params.address;

  try {
    await contract.methods
      .removeManager(address)
      .send({ from: req.userAddress || account, gas: 100000 });

    res.json({ message: "Manager removed", address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== PHÂN TÍCH DỮ LIỆU ====

// API: Phân tích xu hướng
app.get("/analytics/trends", async (req, res) => {
  try {
    // Trong thực tế, bạn sẽ phải truy vấn nhiều dữ liệu từ contract
    // và thực hiện phân tích phức tạp hơn

    // Mô phỏng kết quả phân tích
    res.json({
      popularFruits: ["Xoài", "Thanh Long", "Chuối"],
      growingRegions: {
        "Đồng bằng sông Cửu Long": ["Xoài", "Sầu riêng", "Chuối"],
        "Tây Nguyên": ["Bơ", "Thanh Long"],
        "Miền Trung": ["Thanh Long", "Dứa"],
      },
      qualityTrends: {
        Xoài: "Tăng",
        "Thanh Long": "Giảm nhẹ",
        Chuối: "Ổn định",
      },
      recommendations: [
        "Nên đầu tư vào trồng Xoài tại Đồng bằng sông Cửu Long",
        "Cần cải thiện kỹ thuật canh tác Thanh Long tại Miền Trung",
        "Thị trường Bơ có tiềm năng phát triển cao",
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
