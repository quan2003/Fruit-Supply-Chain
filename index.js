// backend/index.js
const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();

// Tăng giới hạn kích thước body lên 50mb (hoặc tùy chỉnh theo nhu cầu)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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

// ==== ĐĂNG KÝ VÀ ĐĂNG NHẬP ====

app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại! 😅" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, role]
    );

    res
      .status(201)
      .json({ message: "Đăng ký thành công! 🎉", user: newUser.rows[0] });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = $2",
      [email, role]
    );
    if (user.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không đúng! 😅" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không đúng! 😅" });
    }

    res.status(200).json({
      message: "Đăng nhập thành công! 🎉",
      user: {
        email: user.rows[0].email,
        role: user.rows[0].role,
        walletAddress: user.rows[0].wallet_address,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

app.post("/update-wallet", async (req, res) => {
  const { email, walletAddress } = req.body;

  try {
    const updatedUser = await pool.query(
      "UPDATE users SET wallet_address = $1 WHERE email = $2 RETURNING *",
      [walletAddress, email]
    );
    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng! 😅" });
    }

    res.status(200).json({ message: "Cập nhật ví MetaMask thành công! 🎉" });
  } catch (error) {
    console.error("Lỗi khi cập nhật ví:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

// ==== DANH MỤC TRÁI CÂY ====

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

app.get("/catalogs", async (req, res) => {
  try {
    const fruitTypes = await contract.methods.getAllFruitTypes().call();
    res.json({ fruitTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== NÔNG TRẠI ====

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

app.get("/farms", async (req, res) => {
  try {
    const farms = await contract.methods.getAllFarms().call();
    res.json({ farms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== TRÁI CÂY ====

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

app.get("/analytics/trends", async (req, res) => {
  try {
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

// ==== SẢN PHẨM ====

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/products", async (req, res) => {
  const {
    name,
    productcode,
    category,
    description,
    price,
    quantity,
    imageurl,
    productiondate,
    expirydate,
  } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO products (name, productcode, category, description, price, quantity, imageurl, productiondate, expirydate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        name,
        productcode,
        category,
        description,
        price,
        quantity,
        imageurl,
        productiondate,
        expirydate,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving product to database:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
