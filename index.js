// backend/index.js
const express = require("express");
const { Web3 } = require("web3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Kết nối với Ganache (cổng 8545) - Không cần thiết nữa vì giao dịch sẽ được thực hiện từ frontend
// const web3 = new Web3("http://127.0.0.1:8545");

// Thông tin contract - Không cần thiết nữa
// const contractAddress = "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d";
// const contractABI = require("./build/contracts/FruitSupplyChain.json").abi;
// const contract = new web3.eth.Contract(contractABI, contractAddress);

// Tài khoản từ Ganache - Không cần thiết nữa
// const account = "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC";

// Danh sách role hợp lệ dựa trên database
const validRoles = [
  "Producer",
  "ThirdParty",
  "DeliveryHub",
  "Customer",
  "Admin",
];

// Middleware kiểm tra quyền - Không cần thiết nếu không sử dụng smart contract
const checkAuth = async (req, res, next) => {
  const userAddress = req.headers["x-ethereum-address"];
  if (!userAddress) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Bỏ phần kiểm tra smart contract
  req.userAddress = userAddress;
  next();
};

// ==== ĐĂNG KÝ VÀ ĐĂNG NHẬP ====

app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin! 😅" });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ! 😅" });
    }

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
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, role]
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
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ! 😅" });
    }

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
        id: user.rows[0].id, // Thêm id để sử dụng trong getInventory
        name: user.rows[0].name,
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
    if (!walletAddress) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp địa chỉ ví! 😅" });
    }

    const walletExists = await pool.query(
      "SELECT * FROM users WHERE wallet_address = $1 AND email != $2",
      [walletAddress, email]
    );
    if (walletExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Địa chỉ ví đã được sử dụng! 😅" });
    }

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

// ==== LẤY FARM CỦA PRODUCER ====

app.get("/farms/user", async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ message: "Vui lòng cung cấp email! 😅" });
    }

    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'Producer'",
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng! 😅" });
    }

    const producerId = user.rows[0].id;
    const farms = await pool.query(
      "SELECT * FROM farms WHERE producer_id = $1",
      [producerId]
    );

    res.json(farms.rows);
  } catch (error) {
    console.error("Lỗi khi lấy farm:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

// ==== API LẤY DANH SÁCH FARMS ====

app.get("/farms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM farms");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching farms:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API LẤY FARM THEO ID ====

app.get("/farms/:id", async (req, res) => {
  const farmId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM farms WHERE id = $1", [
      farmId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Farm not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching farm:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API LẤY DANH SÁCH USERS ====

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API LẤY USER THEO ID ====

app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API MUA SẢN PHẨM (GIAO DỊCH BLOCKCHAIN ĐƯỢC CHUYỂN SANG FRONTEND) ====

app.post("/purchase-product", async (req, res) => {
  const { productId, buyerAddress, quantity } = req.body;

  try {
    console.log("Received purchase request:", {
      productId,
      buyerAddress,
      quantity,
    });

    // Kiểm tra dữ liệu đầu vào
    if (!productId || !buyerAddress || !quantity) {
      console.log("Missing required fields");
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
    }

    // Lấy thông tin sản phẩm
    console.log("Fetching product with ID:", productId);
    const productResult = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    if (productResult.rows.length === 0) {
      console.log("Product not found");
      return res.status(404).json({ message: "Sản phẩm không tồn tại! 😅" });
    }
    const product = productResult.rows[0];
    console.log("Product found:", product);

    // Lấy thông tin farm của sản phẩm
    console.log("Fetching farm with ID:", product.farm_id);
    const farmResult = await pool.query("SELECT * FROM farms WHERE id = $1", [
      product.farm_id,
    ]);
    if (farmResult.rows.length === 0) {
      console.log("Farm not found");
      return res.status(404).json({ message: "Nông trại không tồn tại! 😅" });
    }
    const farm = farmResult.rows[0];
    console.log("Farm found:", farm);

    // Lấy thông tin người bán (producer)
    console.log("Fetching producer with ID:", farm.producer_id);
    const producerResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'Producer'",
      [farm.producer_id]
    );
    if (producerResult.rows.length === 0) {
      console.log("Producer not found");
      return res.status(404).json({ message: "Người bán không tồn tại! 😅" });
    }
    const producer = producerResult.rows[0];
    console.log("Producer found:", producer);

    // Lấy thông tin đại lý (buyer)
    console.log("Fetching buyer with wallet address:", buyerAddress);
    const buyerResult = await pool.query(
      "SELECT * FROM users WHERE wallet_address = $1 AND role = 'DeliveryHub'",
      [buyerAddress]
    );
    if (buyerResult.rows.length === 0) {
      console.log("Buyer not found");
      return res.status(404).json({ message: "Đại lý không tồn tại! 😅" });
    }
    const buyer = buyerResult.rows[0];
    console.log("Buyer found:", buyer);

    // Tính tổng số tiền (giá sản phẩm * số lượng)
    const totalPrice = product.price * quantity;
    const totalPriceInWei = (
      BigInt(Math.round(totalPrice * 100)) * BigInt(10 ** 16)
    ).toString(); // Chuyển đổi sang Wei (1 ETH = 10^18 Wei, giá tính bằng AGT)
    console.log("Total price in Wei:", totalPriceInWei);

    // Trả về thông tin để frontend thực hiện giao dịch blockchain
    res.status(200).json({
      message:
        "Thông tin giao dịch đã được xác nhận. Vui lòng thực hiện giao dịch từ ví MetaMask.",
      totalPriceInWei: totalPriceInWei,
      producerAddress: producer.wallet_address,
      deliveryHubId: buyer.id,
      productId: product.id,
      quantity: quantity,
      price: product.price,
    });
  } catch (error) {
    console.error("Error processing purchase request:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// ==== API LẤY DANH SÁCH KHO CỦA ĐẠI LÝ ====

app.get("/inventory/:deliveryHubId", async (req, res) => {
  const deliveryHubId = req.params.deliveryHubId;

  try {
    console.log(`Fetching inventory for deliveryHubId: ${deliveryHubId}`); // Thêm log để debug

    const result = await pool.query(
      "SELECT i.*, p.name, p.productcode, p.imageurl, p.description, p.productdate AS product_productdate, p.expirydate AS product_expirydate FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.delivery_hub_id = $1",
      [deliveryHubId]
    );

    console.log(`Inventory query result: ${JSON.stringify(result.rows)}`); // Thêm log để kiểm tra dữ liệu trả về

    // Xử lý dữ liệu trả về: ưu tiên productdate và expirydate từ inventory, nếu không có thì lấy từ products
    const inventoryData = result.rows.map((item) => ({
      ...item,
      productdate: item.productdate || item.product_productdate,
      expirydate: item.expirydate || item.product_expirydate,
    }));

    res.json(inventoryData);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// ==== API CẬP NHẬT GIÁ SẢN PHẨM TRONG KHO ====

app.put("/inventory/:inventoryId/price", async (req, res) => {
  const inventoryId = req.params.inventoryId;
  const { newPrice } = req.body;

  try {
    if (!newPrice || newPrice <= 0) {
      return res.status(400).json({ message: "Giá mới không hợp lệ! 😅" });
    }

    const result = await pool.query(
      "UPDATE inventory SET price = $1 WHERE id = $2 RETURNING *",
      [newPrice, inventoryId]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Sản phẩm trong kho không tồn tại! 😅" });
    }

    res.status(200).json({
      message: "Cập nhật giá thành công!",
      inventoryItem: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API ĐƯA SẢN PHẨM LÊN BÁN CHO NGƯỜI TIÊU DÙNG ====

app.post("/sell-product", async (req, res) => {
  const { inventoryId, quantity } = req.body;

  try {
    // Kiểm tra dữ liệu đầu vào
    if (!inventoryId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
    }

    // Lấy thông tin sản phẩm trong kho
    const inventoryResult = await pool.query(
      "SELECT * FROM inventory WHERE id = $1",
      [inventoryId]
    );
    if (inventoryResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Sản phẩm trong kho không tồn tại! 😅" });
    }
    const inventoryItem = inventoryResult.rows[0];

    // Kiểm tra số lượng
    if (inventoryItem.quantity < quantity) {
      return res
        .status(400)
        .json({ message: "Số lượng trong kho không đủ! 😅" });
    }

    // Thêm sản phẩm vào danh sách bán (outgoing_products)
    const outgoingResult = await pool.query(
      "INSERT INTO outgoing_products (product_id, delivery_hub_id, quantity, price, listed_date, status) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'Available') RETURNING *",
      [
        inventoryItem.product_id,
        inventoryItem.delivery_hub_id,
        quantity,
        inventoryItem.price,
      ]
    );

    // Cập nhật số lượng trong kho
    const newQuantity = inventoryItem.quantity - quantity;
    if (newQuantity === 0) {
      await pool.query("DELETE FROM inventory WHERE id = $1", [inventoryId]);
    } else {
      await pool.query("UPDATE inventory SET quantity = $1 WHERE id = $2", [
        newQuantity,
        inventoryId,
      ]);
    }

    res.status(200).json({
      message: "Sản phẩm đã được đưa lên bán thành công!",
      outgoingProduct: outgoingResult.rows[0],
    });
  } catch (error) {
    console.error("Error selling product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API LẤY DANH SÁCH SẢN PHẨM ĐANG BÁN ====

app.get("/outgoing-products/:deliveryHubId", async (req, res) => {
  const deliveryHubId = req.params.deliveryHubId;

  try {
    const result = await pool.query(
      "SELECT op.*, p.name, p.productcode, p.imageurl, p.description FROM outgoing_products op JOIN products p ON op.product_id = p.id WHERE op.delivery_hub_id = $1 AND op.status = 'Available'",
      [deliveryHubId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching outgoing products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==== API THÊM SẢN PHẨM VÀO KHO SAU KHI GIAO DỊCH THÀNH CÔNG ====

app.post("/add-to-inventory", async (req, res) => {
  const { productId, deliveryHubId, quantity, price, productdate, expirydate } =
    req.body;

  try {
    console.log("Adding to inventory:", {
      productId,
      deliveryHubId,
      quantity,
      price,
      productdate,
      expirydate,
    });

    // Kiểm tra các trường bắt buộc
    if (!productId || !deliveryHubId || !quantity || !price) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
    }

    // Gán giá trị mặc định cho productdate và expirydate nếu không có
    const defaultProductDate = productdate || new Date().toISOString();
    const defaultExpiryDate =
      expirydate ||
      new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();

    const inventoryResult = await pool.query(
      "INSERT INTO inventory (product_id, delivery_hub_id, quantity, price, productdate, expirydate, received_date) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *",
      [
        productId,
        deliveryHubId,
        quantity,
        price,
        defaultProductDate,
        defaultExpiryDate,
      ]
    );
    console.log("Inventory item added:", inventoryResult.rows[0]);

    res.status(200).json({
      message: "Sản phẩm đã được thêm vào kho.",
      inventoryItem: inventoryResult.rows[0],
    });
  } catch (error) {
    console.error("Error adding to inventory:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
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
    // Bỏ phần sử dụng smart contract
    res.json({ message: "Fruit catalog added", fruitType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/catalog/:fruitType", async (req, res) => {
  const fruitType = req.params.fruitType;

  try {
    // Bỏ phần sử dụng smart contract, trả về dữ liệu giả lập
    res.json({
      name: fruitType,
      description: "Mô tả giả lập",
      growingSeason: "Mùa hè",
      nutritionalValue: "Giàu vitamin C",
      storageConditions: "Bảo quản ở nhiệt độ mát",
      commonVarieties: ["Giống 1", "Giống 2"],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/catalogs", async (req, res) => {
  try {
    // Bỏ phần sử dụng smart contract, trả về dữ liệu giả lập
    res.json({ fruitTypes: ["Bưởi", "Xoài", "Thanh Long"] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== NÔNG TRẠI ====

app.post("/farm", async (req, res) => {
  const { farmId, location, climate, soil, currentConditions, email } =
    req.body;

  try {
    if (
      !farmId ||
      !location ||
      !climate ||
      !soil ||
      !currentConditions ||
      !email
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin! 😅" });
    }

    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'Producer'",
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng! 😅" });
    }

    const producerId = user.rows[0].id;

    const validQualities = [
      "Nắng",
      "Mưa",
      "Khô hanh",
      "Ẩm ướt",
      "Sương mù",
      "Gió mạnh",
    ];
    let quality = "Nắng";
    for (const validQuality of validQualities) {
      if (currentConditions.includes(validQuality)) {
        quality = validQuality;
        break;
      }
    }

    const newFarm = await pool.query(
      "INSERT INTO farms (producer_id, farm_name, location, weather_condition, yield, quality, current_conditions) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [producerId, farmId, location, climate, 0, quality, currentConditions]
    );

    res.json({ message: "Farm registered", farmId: newFarm.rows[0].id });
  } catch (error) {
    console.error("Lỗi khi tạo farm:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

app.put("/farm/:farmId", async (req, res) => {
  const farmId = req.params.farmId;
  const { conditions } = req.body;

  try {
    // Bỏ phần sử dụng smart contract
    res.json({ message: "Farm conditions updated", farmId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/farm/:farmId", async (req, res) => {
  const farmId = req.params.farmId;

  try {
    // Bỏ phần sử dụng smart contract, trả về dữ liệu từ database
    const farm = await pool.query("SELECT * FROM farms WHERE id = $1", [
      farmId,
    ]);
    if (farm.rows.length === 0) {
      return res.status(404).json({ message: "Farm not found" });
    }
    res.json(farm.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/farms", async (req, res) => {
  try {
    // Bỏ phần sử dụng smart contract, trả về dữ liệu từ database
    const farms = await pool.query("SELECT * FROM farms");
    res.json(farms.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== TRÁI CÂY ====

app.post("/harvest", async (req, res) => {
  const { fruitType, origin, farmId, quality } = req.body;

  try {
    // Bỏ phần sử dụng smart contract
    res.json({ message: "Fruit harvested", fruitId: "1" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/record-step", async (req, res) => {
  const { fruitId, step } = req.body;

  try {
    // Bỏ phần sử dụng smart contract
    res.json({ message: `Step ${step} recorded` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/recommendation", checkAuth, async (req, res) => {
  const { fruitId, recommendation } = req.body;

  try {
    // Bỏ phần sử dụng smart contract
    res.json({ message: "Recommendation added", fruitId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/fruit/:id", async (req, res) => {
  const fruitId = req.params.id;

  try {
    // Bỏ phần sử dụng smart contract, trả về dữ liệu giả lập
    res.json({
      fruitType: "Bưởi",
      origin: "Tỉnh Thái Nguyên",
      producer: "nguoi dan",
      history: ["Harvested", "Processed"],
      harvestDate: new Date().toISOString(),
      quality: "Nắng",
      recommendations: ["Bảo quản ở nhiệt độ mát"],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== QUẢN LÝ HỆ THỐNG ====

app.post("/manager", checkAuth, async (req, res) => {
  const { address } = req.body;

  try {
    // Bỏ phần sử dụng smart contract
    res.json({ message: "Manager added", address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/manager/:address", checkAuth, async (req, res) => {
  const address = req.params.address;

  try {
    // Bỏ phần sử dụng smart contract
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
  const { email } = req.query;

  try {
    if (email) {
      // Nếu có email, lọc sản phẩm theo producer
      const user = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND role = 'Producer'",
        [email]
      );
      if (user.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng! 😅" });
      }
      const producerId = user.rows[0].id;

      const farms = await pool.query(
        "SELECT id FROM farms WHERE producer_id = $1",
        [producerId]
      );
      const farmIds = farms.rows.map((farm) => farm.id);

      if (farmIds.length === 0) {
        return res.json([]);
      }

      const result = await pool.query(
        "SELECT * FROM products WHERE farm_id = ANY($1)",
        [farmIds]
      );
      res.json(result.rows);
    } else {
      // Nếu không có email, lấy tất cả sản phẩm
      const result = await pool.query("SELECT * FROM products");
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  console.log("Dữ liệu nhận được từ frontend:", req.body, req.file);

  const {
    name,
    productcode,
    category,
    description,
    price,
    quantity,
    productdate,
    expirydate,
    farm_id,
    email, // Thêm email để kiểm tra producer
  } = req.body;
  const image = req.file;

  try {
    if (
      !name ||
      !productcode ||
      !category ||
      !description ||
      !price ||
      !quantity ||
      !productdate ||
      !expirydate ||
      !farm_id ||
      !image ||
      !email
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin! 😅" });
    }

    // Kiểm tra producer
    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'Producer'",
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng! 😅" });
    }
    const producerId = user.rows[0].id;

    // Kiểm tra farm có thuộc producer không
    const farm = await pool.query(
      "SELECT * FROM farms WHERE id = $1 AND producer_id = $2",
      [farm_id, producerId]
    );
    if (farm.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Farm không thuộc producer này! 😅" });
    }

    const imageUrl = `/uploads/${image.filename}`;

    const result = await pool.query(
      "INSERT INTO products (name, productcode, category, description, price, quantity, imageurl, productdate, expirydate, farm_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        name,
        productcode,
        category,
        description,
        price,
        quantity,
        imageUrl,
        productdate,
        expirydate,
        farm_id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving product to database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Phục vụ file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
