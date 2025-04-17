import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import PinataClient from "@pinata/sdk";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Web3 from "web3";
import contractData from "./artifacts/contracts/FruitSupplyChain.sol/FruitSupplyChain.json" with { type: "json" };
// Load biến môi trường từ file .env
dotenv.config();

// Kiểm tra xem API Key và Secret của Pinata có được load đúng không
if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
  console.error(
    "Lỗi: Thiếu PINATA_API_KEY hoặc PINATA_API_SECRET trong file .env"
  );
  process.exit(1);
}

const API_URL = process.env.API_URL || "http://localhost:3000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cấu hình ejs sau khi app được khởi tạo
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình multer để lưu file tạm thời
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

// Khởi tạo Pinata Client với API Key và Secret từ file .env
const pinata = new PinataClient({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

// Danh sách role hợp lệ dựa trên database
const validRoles = [
  "Producer",
  "ThirdParty",
  "DeliveryHub",
  "Customer",
  "Admin",
];

// Đọc CONTRACT_ADDRESS từ file
let CONTRACT_ADDRESS = "";
try {
  const contractAddressPath = "D:\\fruit-supply-chain\\contract-address.txt";
  if (fs.existsSync(contractAddressPath)) {
    CONTRACT_ADDRESS = fs.readFileSync(contractAddressPath, "utf8").trim();
    console.log("Địa chỉ hợp đồng từ file:", CONTRACT_ADDRESS);
  } else {
    console.error(
      "File contract-address.txt không tồn tại tại đường dẫn:",
      contractAddressPath
    );
    throw new Error("File contract-address.txt không tồn tại!");
  }
} catch (error) {
  console.error("Lỗi khi đọc CONTRACT_ADDRESS từ file:", error);
  CONTRACT_ADDRESS = "";
  process.exit(1); // Thoát nếu không đọc được CONTRACT_ADDRESS
}

// Khởi tạo Web3 và contract sau khi có CONTRACT_ADDRESS
const web3 = new Web3("http://127.0.0.1:8545/");
const contractAbi = contractData.abi; // Lấy ABI từ file JSON
let contract;

try {
  if (!contractAbi || contractAbi.length === 0) {
    throw new Error("ABI của hợp đồng không hợp lệ!");
  }
  contract = new web3.eth.Contract(contractAbi, CONTRACT_ADDRESS);
  console.log("Khởi tạo contract thành công:", CONTRACT_ADDRESS);
} catch (error) {
  console.error("Lỗi khi khởi tạo contract:", error);
  process.exit(1); // Thoát nếu không khởi tạo được contract
}

// Middleware kiểm tra quyền
const checkAuth = async (req, res, next) => {
  const userAddress = req.headers["x-ethereum-address"];
  if (!userAddress) {
    return res.status(401).json({ error: "Yêu cầu xác thực ví MetaMask!" });
  }

  try {
    const normalizedAddress = userAddress.toLowerCase();
    const user = await pool.query(
      "SELECT * FROM users WHERE LOWER(wallet_address) = $1",
      [normalizedAddress]
    );
    if (user.rows.length === 0) {
      return res.status(401).json({
        error: "Địa chỉ ví không được liên kết với tài khoản nào!",
      });
    }
    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra xác thực:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
};

// Middleware kiểm tra vai trò
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu xác thực" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }
    next();
  };
};

// ==== API TRẢ VỀ ĐỊA CHỈ HỢP ĐỒNG ====
app.get("/contract-address", (req, res) => {
  try {
    const contractAddressPath = "D:\\fruit-supply-chain\\contract-address.txt";
    if (!fs.existsSync(contractAddressPath)) {
      throw new Error(
        `File contract-address.txt không tồn tại tại đường dẫn: ${contractAddressPath}`
      );
    }
    const address = fs.readFileSync(contractAddressPath, "utf8").trim();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Địa chỉ hợp đồng không hợp lệ trong file: ${address}`);
    }
    console.log("Địa chỉ hợp đồng từ file:", address);
    res.status(200).json({ address });
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ hợp đồng:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API KIỂM TRA VAI TRÒ NGƯỜI DÙNG ====
app.get("/check-role", checkAuth, async (req, res) => {
  try {
    res.status(200).json({
      role: req.user.role,
      email: req.user.email,
      name: req.user.name,
      walletAddress: req.user.wallet_address,
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra vai trò:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

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
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin! 😅" });
    }

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
        id: user.rows[0].id,
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
    if (!email || !walletAddress) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp email và địa chỉ ví! 😅" });
    }

    const walletExists = await pool.query(
      "SELECT * FROM users WHERE wallet_address = $1 AND email != $2",
      [walletAddress, email]
    );
    if (walletExists.rows.length > 0) {
      return res.status(400).json({
        message: "Địa chỉ ví đã được sử dụng bởi người dùng khác! 😅",
      });
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
app.get("/farms/user", checkAuth, checkRole(["Producer"]), async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ message: "Vui lòng cung cấp email! 😅" });
    }

    if (req.user.email !== email) {
      return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
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

    console.log("Dữ liệu farm trả về:", farms.rows);
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
    console.error("Lỗi khi lấy danh sách farms:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API LẤY THỐNG KÊ FARM (TỔNG SẢN PHẨM, SẢN PHẨM ĐÃ BÁN, DOANH THU) ====
app.get(
  "/farms/stats",
  checkAuth,
  checkRole(["Producer"]),
  async (req, res) => {
    const { email } = req.query;

    try {
      if (!email) {
        return res.status(400).json({ message: "Vui lòng cung cấp email! 😅" });
      }

      if (req.user.email !== email) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

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
        return res.json({
          totalProducts: 0,
          soldProducts: 0,
          totalRevenue: 0,
        });
      }

      const productsCount = await pool.query(
        "SELECT COUNT(*) FROM products WHERE farm_id = ANY($1)",
        [farmIds]
      );
      const totalProducts = parseInt(productsCount.rows[0].count);

      const soldProductsResult = await pool.query(
        `
        SELECT COALESCE(SUM(op.quantity), 0) as sold_products
        FROM outgoing_products op
        JOIN products p ON op.product_id = p.id
        WHERE p.farm_id = ANY($1)
        `,
        [farmIds]
      );
      const soldProducts = parseInt(soldProductsResult.rows[0].sold_products);

      const revenueResult = await pool.query(
        `
        SELECT COALESCE(SUM(op.price * op.quantity), 0) as total_revenue
        FROM outgoing_products op
        JOIN products p ON op.product_id = p.id
        WHERE p.farm_id = ANY($1)
        `,
        [farmIds]
      );
      const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);

      res.json({
        totalProducts,
        soldProducts,
        totalRevenue,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê farm:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY DỮ LIỆU SẢN LƯỢNG THEO THÁNG ====
app.get(
  "/farms/yield",
  checkAuth,
  checkRole(["Producer"]),
  async (req, res) => {
    const { email } = req.query;

    try {
      if (!email) {
        return res.status(400).json({ message: "Vui lòng cung cấp email! 😅" });
      }

      if (req.user.email !== email) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

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

      const yieldResult = await pool.query(
        `
      SELECT 
        TO_CHAR(productdate, 'YYYY-MM') as month,
        SUM(quantity) as yield
      FROM products
      WHERE farm_id = ANY($1)
      GROUP BY TO_CHAR(productdate, 'YYYY-MM')
      ORDER BY month
      `,
        [farmIds]
      );

      const yieldData = yieldResult.rows.map((row) => {
        const [year, month] = row.month.split("-");
        return {
          month: `Tháng ${parseInt(month)}/${year}`,
          yield: parseFloat(row.yield),
        };
      });

      if (yieldData.length === 0) {
        return res.json([
          { month: "Tháng 1", yield: 0 },
          { month: "Tháng 2", yield: 0 },
          { month: "Tháng 3", yield: 0 },
          { month: "Tháng 4", yield: 0 },
          { month: "Tháng 5", yield: 0 },
        ]);
      }

      res.json(yieldData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu sản lượng:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY FARM THEO ID ====
app.get("/farms/:id", async (req, res) => {
  const farmId = req.params.id;

  try {
    if (!/^\d+$/.test(farmId)) {
      return res.status(400).json({ message: "ID farm không hợp lệ! 😅" });
    }

    const result = await pool.query("SELECT * FROM farms WHERE id = $1", [
      farmId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy farm!" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lấy farm:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API LẤY DANH SÁCH USERS ====
app.get("/users", checkAuth, checkRole(["Admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách users:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API LẤY USER THEO ID ====
app.get("/users/:id", checkAuth, checkRole(["Admin"]), async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy user!" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lấy user:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API LẤY PRODUCER THEO ID ====
app.get("/producers/:id", async (req, res) => {
  const producerId = req.params.id;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'Producer'",
      [producerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy producer!" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lấy producer:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API MUA SẢN PHẨM ====
app.post(
  "/purchase-product",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const { productId, buyerAddress, quantity } = req.body;

    try {
      console.log("Nhận yêu cầu mua sản phẩm:", {
        productId,
        buyerAddress,
        quantity,
      });

      if (!productId || !buyerAddress || !quantity) {
        console.log("Thiếu các trường bắt buộc");
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      const productResult = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [productId]
      );
      if (productResult.rows.length === 0) {
        console.log("Không tìm thấy sản phẩm");
        return res.status(404).json({ message: "Sản phẩm không tồn tại! 😅" });
      }
      const product = productResult.rows[0];
      console.log("Tìm thấy sản phẩm:", product);

      const farmResult = await pool.query("SELECT * FROM farms WHERE id = $1", [
        product.farm_id,
      ]);
      if (farmResult.rows.length === 0) {
        console.log("Không tìm thấy farm");
        return res.status(404).json({ message: "Nông trại không tồn tại! 😅" });
      }
      const farm = farmResult.rows[0];
      console.log("Tìm thấy farm:", farm);

      const producerResult = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'Producer'",
        [farm.producer_id]
      );
      if (producerResult.rows.length === 0) {
        console.log("Không tìm thấy producer");
        return res.status(404).json({ message: "Người bán không tồn tại! 😅" });
      }
      const producer = producerResult.rows[0];
      console.log("Tìm thấy producer:", producer);

      const normalizedBuyerAddress = buyerAddress.toLowerCase();
      const buyerResult = await pool.query(
        "SELECT * FROM users WHERE LOWER(wallet_address) = $1 AND role = 'DeliveryHub'",
        [normalizedBuyerAddress]
      );
      if (buyerResult.rows.length === 0) {
        console.log("Không tìm thấy đại lý");
        return res.status(404).json({ message: "Đại lý không tồn tại! 😅" });
      }
      const buyer = buyerResult.rows[0];
      console.log("Tìm thấy đại lý:", buyer);

      const totalPrice = product.price * quantity;
      const totalPriceInWei = (
        BigInt(Math.round(totalPrice * 100)) * BigInt(10 ** 16)
      ).toString();
      console.log("Tổng giá (Wei):", totalPriceInWei);

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
      console.error("Lỗi khi xử lý yêu cầu mua sản phẩm:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY DANH SÁCH KHO CỦA ĐẠI LÝ ====
app.get(
  "/inventory/:deliveryHubId",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const deliveryHubId = req.params.deliveryHubId;

    try {
      console.log(`Lấy danh sách kho cho deliveryHubId: ${deliveryHubId}`);

      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const result = await pool.query(
        "SELECT i.*, p.name, p.productcode, p.category, p.imageurl, p.description, p.productdate AS product_productdate, p.expirydate AS product_expirydate FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.delivery_hub_id = $1 AND i.quantity > 0",
        [deliveryHubId]
      );

      console.log(`Kết quả truy vấn kho: ${JSON.stringify(result.rows)}`);

      const inventoryData = result.rows.map((item) => ({
        ...item,
        productdate: item.productdate || item.product_productdate,
        expirydate: item.expirydate || item.product_expirydate,
      }));

      res.json(inventoryData);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách kho:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API CẬP NHẬT GIÁ SẢN PHẨM TRONG KHO ====
app.put(
  "/inventory/:inventoryId/price",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const inventoryId = req.params.inventoryId;
    const { newPrice } = req.body;

    try {
      if (!newPrice || newPrice <= 0) {
        return res.status(400).json({ message: "Giá mới không hợp lệ! 😅" });
      }

      const inventoryResult = await pool.query(
        "SELECT * FROM inventory WHERE id = $1",
        [inventoryId]
      );
      if (inventoryResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm trong kho không tồn tại! 😅" });
      }

      if (req.user.id !== inventoryResult.rows[0].delivery_hub_id) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const result = await pool.query(
        "UPDATE inventory SET price = $1 WHERE id = $2 RETURNING *",
        [newPrice, inventoryId]
      );

      res.status(200).json({
        message: "Cập nhật giá thành công!",
        inventoryItem: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật giá:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API CẬP NHẬT FRUIT_ID TRONG KHO ====
app.put(
  "/inventory/:inventoryId/fruit-id",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const inventoryId = req.params.inventoryId;
    const { fruitId } = req.body;

    try {
      if (!fruitId || isNaN(fruitId)) {
        return res.status(400).json({ message: "fruitId không hợp lệ! 😅" });
      }

      const inventoryResult = await pool.query(
        "SELECT * FROM inventory WHERE id = $1",
        [inventoryId]
      );
      if (inventoryResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm trong kho không tồn tại! 😅" });
      }

      if (req.user.id !== inventoryResult.rows[0].delivery_hub_id) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const result = await pool.query(
        "UPDATE inventory SET fruit_id = $1 WHERE id = $2 RETURNING *",
        [fruitId, inventoryId]
      );

      res.status(200).json({
        message: "Cập nhật fruit_id thành công!",
        inventoryItem: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật fruit_id:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API ĐƯA SẢN PHẨM LÊN BÁN CHO NGƯỜI TIÊU DÙNG ====
app.post(
  "/sell-product",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const {
      inventoryId,
      quantity,
      price,
      transactionHash,
      listingId,
      fruitId,
    } = req.body;

    try {
      if (!inventoryId || !quantity || quantity <= 0) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      if (transactionHash) {
        console.log("Nhận được transaction hash:", transactionHash);
      }

      let inventoryResult = await pool.query(
        "SELECT * FROM inventory WHERE id = $1",
        [inventoryId]
      );
      if (inventoryResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm trong kho không tồn tại! 😅" });
      }
      const inventoryItem = inventoryResult.rows[0];

      if (req.user.id !== inventoryItem.delivery_hub_id) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      console.log(
        "Số lượng trong kho (inventory.quantity):",
        inventoryItem.quantity
      );
      console.log("Số lượng yêu cầu (quantity):", quantity);

      if (inventoryItem.quantity < quantity) {
        console.log("Không đủ số lượng trong kho để đăng bán");
        return res
          .status(400)
          .json({ message: "Số lượng trong kho không đủ! 😅" });
      }

      const sellingPrice = price || inventoryItem.price;

      const outgoingResult = await pool.query(
        "INSERT INTO outgoing_products (product_id, delivery_hub_id, quantity, price, listed_date, status, transaction_hash, listing_id, fruit_id) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'Available', $5, $6, $7) RETURNING *",
        [
          inventoryItem.product_id,
          inventoryItem.delivery_hub_id,
          quantity,
          sellingPrice,
          transactionHash || null,
          listingId || null,
          fruitId || null,
        ]
      );

      const newQuantity = inventoryItem.quantity - quantity;
      console.log(
        `Cập nhật số lượng trong inventory: inventoryId=${inventoryId}, oldQuantity=${inventoryItem.quantity}, quantityToSell=${quantity}, newQuantity=${newQuantity}`
      );

      if (newQuantity === 0) {
        // Xóa bản ghi trong inventory nếu số lượng về 0
        await pool.query("DELETE FROM inventory WHERE id = $1", [inventoryId]);
        console.log(`Đã xóa bản ghi inventory với id=${inventoryId} vì số lượng về 0`);
      } else {
        // Cập nhật số lượng nếu chưa về 0
        const updateResult = await pool.query(
          "UPDATE inventory SET quantity = $1 WHERE id = $2 RETURNING *",
          [newQuantity, inventoryId]
        );
        if (updateResult.rows.length === 0) {
          console.error("Không thể cập nhật số lượng trong inventory!");
          return res.status(500).json({
            message: "Không thể cập nhật số lượng trong kho!",
          });
        }
      }

      res.status(200).json({
        message: "Sản phẩm đã được đưa lên bán thành công!",
        outgoingProduct: outgoingResult.rows[0],
      });
    } catch (error) {
      console.error("Lỗi khi đăng bán sản phẩm:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API XÁC MINH TRANSACTION HASH ====
app.post("/verify-transaction", async (req, res) => {
  const { transactionHash } = req.body;

  try {
    if (!transactionHash) {
      return res.status(400).json({ message: "Yêu cầu transaction hash!" });
    }

    const existingTransaction = await pool.query(
      "SELECT * FROM outgoing_products WHERE transaction_hash = $1",
      [transactionHash]
    );

    if (existingTransaction.rows.length > 0) {
      return res.status(200).json({
        verified: true,
        message: "Giao dịch đã được xác minh",
        transaction: existingTransaction.rows[0],
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const verified = true;

    res.status(200).json({
      verified,
      message: verified
        ? "Xác minh giao dịch thành công"
        : "Xác minh giao dịch thất bại",
    });
  } catch (error) {
    console.error("Lỗi khi xác minh giao dịch:", error);
    res.status(500).json({
      verified: false,
      error: "Lỗi máy chủ nội bộ",
      message: error.message,
    });
  }
});

app.get(
  "/outgoing-products",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    try {
      console.log("User info:", req.user);
      const deliveryHubId = req.user.id;
      console.log("DeliveryHub ID:", deliveryHubId);

      const result = await pool.query(
        `SELECT op.*, 
         p.name, 
         p.productcode, 
         p.imageurl, 
         p.description 
        FROM outgoing_products op 
        JOIN products p ON op.product_id = p.id 
        WHERE op.delivery_hub_id = $1 AND op.status = 'Available'`,
        [deliveryHubId]
      );

      console.log("Danh sách sản phẩm đang bán:", result.rows);
      if (result.rows.length === 0) {
        console.log(
          "Không tìm thấy sản phẩm nào cho DeliveryHub ID:",
          deliveryHubId
        );
      }
      res.json(result.rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
      res.status(500).json({
        error: "Lỗi máy chủ nội bộ",
        details: error.message,
      });
    }
  }
);

// ==== API LẤY DANH SÁCH SẢN PHẨM ĐANG BÁN ====
app.get(
  "/outgoing-products/:deliveryHubId",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const deliveryHubId = req.params.deliveryHubId;

    try {
      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const result = await pool.query(
        "SELECT op.*, p.name, p.productcode, p.imageurl, p.description FROM outgoing_products op JOIN products p ON op.product_id = p.id WHERE op.delivery_hub_id = $1 AND op.status = 'Available'",
        [deliveryHubId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API THÊM SẢN PHẨM VÀO KHO SAU KHI GIAO DỊCH THÀNH CÔNG ====
app.post(
  "/add-to-inventory",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const {
      productId,
      deliveryHubId,
      quantity,
      price,
      productdate,
      expirydate,
      transactionHash,
    } = req.body;

    try {
      console.log("Thêm vào kho:", {
        productId,
        deliveryHubId,
        quantity,
        price,
        productdate,
        expirydate,
        transactionHash,
      });

      if (!productId || !deliveryHubId || !quantity || !price) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const defaultProductDate = productdate || new Date().toISOString();
      const defaultExpiryDate =
        expirydate ||
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();

      const inventoryResult = await pool.query(
        "INSERT INTO inventory (product_id, delivery_hub_id, quantity, price, productdate, expirydate, received_date, transaction_hash) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7) RETURNING *",
        [
          productId,
          deliveryHubId,
          quantity,
          price,
          defaultProductDate,
          defaultExpiryDate,
          transactionHash || null,
        ]
      );
      console.log("Đã thêm vào kho:", inventoryResult.rows[0]);

      res.status(200).json({
        message: "Sản phẩm đã được thêm vào kho.",
        inventoryItem: inventoryResult.rows[0],
      });
    } catch (error) {
      console.error("Lỗi khi thêm vào kho:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY THÔNG TIN BẢN GHI INVENTORY THEO INVENTORY ID ====
app.get(
  "/inventory/by-id/:inventoryId",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const inventoryId = req.params.inventoryId;

    try {
      console.log(
        `Lấy thông tin bản ghi inventory với inventoryId: ${inventoryId}`
      );

      const result = await pool.query(
        "SELECT i.*, p.name, p.productcode, p.category, p.imageurl, p.description, p.productdate AS product_productdate, p.expirydate AS product_expirydate FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.id = $1",
        [inventoryId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy bản ghi trong kho! 😅" });
      }

      const inventoryItem = result.rows[0];

      if (req.user.id !== inventoryItem.delivery_hub_id) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const inventoryData = {
        ...inventoryItem,
        productdate:
          inventoryItem.productdate || inventoryItem.product_productdate,
        expirydate:
          inventoryItem.expirydate || inventoryItem.product_expirydate,
      };

      res.json(inventoryData);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bản ghi inventory:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY DANH SÁCH LÔ HÀNG ĐẾN ====
app.get(
  "/incoming-shipments",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM shipments WHERE status = 'In Transit' AND recipient_type = 'DeliveryHub' AND recipient_id = $1",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lô hàng đến:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY DANH SÁCH LÔ HÀNG ĐI ====
app.get(
  "/outgoing-shipments",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM shipments WHERE status = 'In Transit' AND sender_type = 'DeliveryHub' AND sender_id = $1",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lô hàng đi:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API NHẬN LÔ HÀNG ====
app.post(
  "/receive-shipment",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const { shipmentId } = req.body;

    try {
      if (!shipmentId) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp shipmentId! 😅" });
      }

      const shipmentResult = await pool.query(
        "SELECT * FROM shipments WHERE id = $1 AND status = 'In Transit' AND recipient_type = 'DeliveryHub' AND recipient_id = $2",
        [shipmentId, req.user.id]
      );
      if (shipmentResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Lô hàng không tồn tại hoặc không thể nhận! 😅" });
      }
      const shipment = shipmentResult.rows[0];

      await pool.query(
        "UPDATE shipments SET status = 'Delivered', received_date = CURRENT_TIMESTAMP WHERE id = $1",
        [shipmentId]
      );

      const products = await pool.query(
        "SELECT * FROM shipment_products WHERE shipment_id = $1",
        [shipmentId]
      );

      for (const product of products.rows) {
        await pool.query(
          "INSERT INTO inventory (product_id, delivery_hub_id, quantity, price, productdate, expirydate, received_date) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) ON CONFLICT (product_id, delivery_hub_id) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity",
          [
            product.product_id,
            shipment.recipient_id,
            product.quantity,
            product.price || 0,
            product.productdate || new Date().toISOString(),
            product.expirydate ||
              new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ).toISOString(),
          ]
        );
      }

      res.status(200).json({ message: "Lô hàng đã được nhận thành công!" });
    } catch (error) {
      console.error("Lỗi khi nhận lô hàng:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API GỬI LÔ HÀNG ĐẾN KHÁCH HÀNG ====
app.post(
  "/ship-to-customer",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const { productId, deliveryHubId, customerId, quantity } = req.body;

    try {
      if (
        !productId ||
        !deliveryHubId ||
        !customerId ||
        !quantity ||
        quantity <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const inventoryResult = await pool.query(
        "SELECT * FROM inventory WHERE product_id = $1 AND delivery_hub_id = $2",
        [productId, deliveryHubId]
      );
      if (inventoryResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm không tồn tại trong kho! 😅" });
      }
      const inventoryItem = inventoryResult.rows[0];

      if (inventoryItem.quantity < quantity) {
        return res
          .status(400)
          .json({ message: "Số lượng trong kho không đủ! 😅" });
      }

      const customerResult = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'Customer'",
        [customerId]
      );
      if (customerResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Khách hàng không tồn tại! 😅" });
      }

      const shipmentResult = await pool.query(
        "INSERT INTO shipments (sender_id, sender_type, recipient_id, recipient_type, status, shipment_date) VALUES ($1, 'DeliveryHub', $2, 'Customer', 'In Transit', CURRENT_TIMESTAMP) RETURNING *",
        [deliveryHubId, customerId]
      );
      const shipment = shipmentResult.rows[0];

      await pool.query(
        "INSERT INTO shipment_products (shipment_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [shipment.id, productId, quantity, inventoryItem.price]
      );

      const newQuantity = inventoryItem.quantity - quantity;
      if (newQuantity === 0) {
        await pool.query(
          "DELETE FROM inventory WHERE product_id = $1 AND delivery_hub_id = $2",
          [productId, deliveryHubId]
        );
      } else {
        await pool.query(
          "UPDATE inventory SET quantity = $1 WHERE product_id = $2 AND delivery_hub_id = $3",
          [newQuantity, productId, deliveryHubId]
        );
      }

      res.status(200).json({
        message: "Lô hàng đã được gửi đi thành công!",
        shipment: shipment,
      });
    } catch (error) {
      console.error("Lỗi khi gửi lô hàng đến khách hàng:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API THỐNG KÊ ====
app.get(
  "/stats/:deliveryHubId",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const deliveryHubId = req.params.deliveryHubId;

    try {
      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const inventoryCount = await pool.query(
        "SELECT COUNT(*) FROM inventory WHERE delivery_hub_id = $1",
        [deliveryHubId]
      );
      const outgoingCount = await pool.query(
        "SELECT COUNT(*) FROM outgoing_products WHERE delivery_hub_id = $1 AND status = 'Available'",
        [deliveryHubId]
      );
      const shipmentCount = await pool.query(
        "SELECT COUNT(*) FROM shipments WHERE sender_id = $1 AND sender_type = 'DeliveryHub'",
        [deliveryHubId]
      );

      res.json({
        inventoryCount: parseInt(inventoryCount.rows[0].count),
        outgoingCount: parseInt(outgoingCount.rows[0].count),
        shipmentCount: parseInt(shipmentCount.rows[0].count),
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê trung tâm phân phối:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API THEO DÕI LÔ HÀNG ====
app.get("/track-shipment/:shipmentId", async (req, res) => {
  const shipmentId = req.params.shipmentId;

  try {
    const shipmentResult = await pool.query(
      "SELECT * FROM shipments WHERE id = $1",
      [shipmentId]
    );
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Lô hàng không tồn tại! 😅" });
    }
    const shipment = shipmentResult.rows[0];

    const products = await pool.query(
      "SELECT sp.*, p.name, p.imageurl FROM shipment_products sp JOIN products p ON sp.product_id = p.id WHERE sp.shipment_id = $1",
      [shipmentId]
    );

    res.json({
      shipment: shipment,
      products: products.rows,
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi lô hàng:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== DANH MỤC TRÁI CÂY ====
app.post("/catalog", checkAuth, checkRole(["Admin"]), async (req, res) => {
  const {
    fruitType,
    description,
    growingSeason,
    nutritionalValue,
    storageConditions,
    commonVarieties,
  } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO catalogs (fruit_type, description, growing_season, nutritional_value, storage_conditions, common_varieties) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        fruitType,
        description,
        growingSeason,
        nutritionalValue,
        storageConditions,
        commonVarieties.join(","),
      ]
    );
    res.json({ message: "Đã thêm danh mục trái cây", catalog: result.rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.get("/catalog/:fruitType", async (req, res) => {
  const fruitType = req.params.fruitType;

  try {
    const result = await pool.query(
      "SELECT * FROM catalogs WHERE fruit_type = $1",
      [fruitType]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.get("/catalogs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM catalogs");
    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== NÔNG TRẠI ====
app.post("/farm", checkAuth, checkRole(["Producer"]), async (req, res) => {
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

    if (req.user.email !== email) {
      return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
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

    res.json({ message: "Đã đăng ký farm", farmId: newFarm.rows[0].id });
  } catch (error) {
    console.error("Lỗi khi tạo farm:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra! Vui lòng thử lại nhé! 😓" });
  }
});

app.put(
  "/farm/:farmId",
  checkAuth,
  checkRole(["Producer"]),
  async (req, res) => {
    const farmId = req.params.farmId;
    const { conditions } = req.body;

    try {
      const farm = await pool.query(
        "SELECT * FROM farms WHERE id = $1 AND producer_id = $2",
        [farmId, req.user.id]
      );
      if (farm.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Farm không tồn tại hoặc không thuộc bạn! 😅" });
      }

      const updatedFarm = await pool.query(
        "UPDATE farms SET current_conditions = $1 WHERE id = $2 RETURNING *",
        [conditions, farmId]
      );

      res.json({
        message: "Đã cập nhật điều kiện farm",
        farm: updatedFarm.rows[0],
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

app.get("/farm/:farmId", async (req, res) => {
  const farmId = req.params.farmId;

  try {
    const farm = await pool.query("SELECT * FROM farms WHERE id = $1", [
      farmId,
    ]);
    if (farm.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy farm!" });
    }
    res.json(farm.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== TRÁI CÂY ====
app.post("/harvest", checkAuth, checkRole(["Producer"]), async (req, res) => {
  const { fruitType, origin, farmId, quality } = req.body;

  try {
    const farm = await pool.query(
      "SELECT * FROM farms WHERE id = $1 AND producer_id = $2",
      [farmId, req.user.id]
    );
    if (farm.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Farm không tồn tại hoặc không thuộc bạn! 😅" });
    }

    const result = await pool.query(
      "INSERT INTO fruits (fruit_type, origin, farm_id, quality, harvest_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *",
      [fruitType, origin, farmId, quality]
    );

    res.json({ message: "Đã thu hoạch trái cây", fruitId: result.rows[0].id });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.post("/record-step", checkAuth, async (req, res) => {
  const { fruitId, step } = req.body;

  try {
    const fruit = await pool.query("SELECT * FROM fruits WHERE id = $1", [
      fruitId,
    ]);
    if (fruit.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy trái cây!" });
    }

    await pool.query(
      "INSERT INTO fruit_history (fruit_id, step, recorded_date) VALUES ($1, $2, CURRENT_TIMESTAMP)",
      [fruitId, step]
    );

    res.json({ message: `Đã ghi nhận bước ${step}` });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.post(
  "/recommendation",
  checkAuth,
  checkRole(["ThirdParty"]),
  async (req, res) => {
    const { fruitId, recommendation } = req.body;

    try {
      const fruit = await pool.query("SELECT * FROM fruits WHERE id = $1", [
        fruitId,
      ]);
      if (fruit.rows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy trái cây!" });
      }

      await pool.query(
        "INSERT INTO fruit_recommendations (fruit_id, recommendation, recorded_date) VALUES ($1, $2, CURRENT_TIMESTAMP)",
        [fruitId, recommendation]
      );

      res.json({ message: "Đã thêm khuyến nghị", fruitId });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

app.get("/fruit/:id", async (req, res) => {
  const fruitId = req.params.id;

  try {
    const fruit = await pool.query("SELECT * FROM fruits WHERE id = $1", [
      fruitId,
    ]);
    if (fruit.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy trái cây!" });
    }
    const history = await pool.query(
      "SELECT * FROM fruit_history WHERE fruit_id = $1",
      [fruitId]
    );
    const recommendations = await pool.query(
      "SELECT * FROM fruit_recommendations WHERE fruit_id = $1",
      [fruitId]
    );

    res.json({
      ...fruit.rows[0],
      history: history.rows.map((h) => h.step),
      recommendations: recommendations.rows.map((r) => r.recommendation),
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin trái cây:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== QUẢN LÝ HỆ THỐNG ====
app.post("/manager", checkAuth, checkRole(["Admin"]), async (req, res) => {
  const { address } = req.body;

  try {
    const user = await pool.query(
      "UPDATE users SET role = 'Admin' WHERE wallet_address = $1 RETURNING *",
      [address]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.json({ message: "Đã thêm quản lý", address });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.delete(
  "/manager/:address",
  checkAuth,
  checkRole(["Admin"]),
  async (req, res) => {
    const address = req.params.address;

    try {
      const user = await pool.query(
        "UPDATE users SET role = 'Customer' WHERE wallet_address = $1 RETURNING *",
        [address]
      );
      if (user.rows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
      }

      res.json({ message: "Đã xóa quản lý", address });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== PHÂN TÍCH DỮ LIỆU ====
app.get("/analytics/trends", async (req, res) => {
  try {
    const products = await pool.query(
      "SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC LIMIT 3"
    );
    const farms = await pool.query(
      "SELECT location, array_agg(category) as categories FROM farms JOIN products ON farms.id = products.farm_id GROUP BY location"
    );
    const qualityTrends = await pool.query(
      "SELECT category, quality FROM products WHERE quality IS NOT NULL"
    );

    res.json({
      popularFruits: products.rows.map((p) => p.category),
      growingRegions: farms.rows.reduce((acc, farm) => {
        acc[farm.location] = farm.categories;
        return acc;
      }, {}),
      qualityTrends: qualityTrends.rows.reduce((acc, q) => {
        acc[q.category] = q.quality;
        return acc;
      }, {}),
      recommendations: [
        "Nên đầu tư vào trồng Xoài tại Đồng bằng sông Cửu Long",
        "Cần cải thiện kỹ thuật canh tác Thanh Long tại Miền Trung",
        "Thị trường Bơ có tiềm năng phát triển cao",
      ],
    });
  } catch (error) {
    console.error("Lỗi khi phân tích dữ liệu:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== SẢN PHẨM ====
app.get("/products", async (req, res) => {
  const { email } = req.query;

  try {
    if (email) {
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

      const sanitizedResult = result.rows.map((product) => ({
        ...product,
        id: product.id || 0,
        productcode: product.productcode || "N/A",
        name: product.name || "Không có tên",
        imageurl: product.imageurl || "",
        price: product.price || 0,
        category: product.category || "N/A",
        description: product.description || "Không có mô tả",
        quantity: product.quantity || 0,
        productdate: product.productdate || new Date().toISOString(),
        expirydate: product.expirydate || new Date().toISOString(),
        hash: product.hash || "N/A",
      }));

      res.json(sanitizedResult);
    } else {
      const result = await pool.query("SELECT * FROM products");

      const sanitizedResult = result.rows.map((product) => ({
        ...product,
        id: product.id || 0,
        productcode: product.productcode || "N/A",
        name: product.name || "Không có tên",
        imageurl: product.imageurl || "",
        price: product.price || 0,
        category: product.category || "N/A",
        description: product.description || "Không có mô tả",
        quantity: product.quantity || 0,
        productdate: product.productdate || new Date().toISOString(),
        expirydate: product.expirydate || new Date().toISOString(),
        hash: product.hash || "N/A",
      }));

      res.json(sanitizedResult);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API LẤY TẤT CẢ SẢN PHẨM ĐANG BÁN TỪ CÁC TRUNG TÂM PHÂN PHỐI ====
app.get("/all-outgoing-products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT op.*, 
            p.name, 
            p.productcode, 
            p.imageurl, 
            p.description, 
            p.category, 
            p.price as original_price, 
            p.productdate, 
            p.expirydate, 
            u.name as delivery_hub_name
     FROM outgoing_products op
     JOIN products p ON op.product_id = p.id
     JOIN users u ON op.delivery_hub_id = u.id
     WHERE op.status = 'Available'`
    );

    const productsWithTraceUrl = result.rows.map((product) => ({
      ...product,
      traceUrl: `${API_URL}/trace-product/${product.listing_id}`,
      productdate: product.productdate
        ? product.productdate.toISOString()
        : new Date().toISOString(),
      expirydate: product.expirydate
        ? product.expirydate.toISOString()
        : new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ).toISOString(),
    }));

    res.status(200).json(productsWithTraceUrl);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});
app.get("/product-detail/:listingId", async (req, res) => {
  const { listingId } = req.params;

  try {
    const outgoingProductResult = await pool.query(
      `SELECT op.*, 
            p.name, 
            p.productcode, 
            p.imageurl, 
            p.description, 
            p.category, 
            p.price as original_price, 
            p.productdate, 
            p.expirydate, 
            p.farm_id,
            p.hash,
            u.name as delivery_hub_name
     FROM outgoing_products op
     JOIN products p ON op.product_id = p.id
     JOIN users u ON op.delivery_hub_id = u.id
     WHERE op.listing_id = $1`,
      [listingId]
    );

    if (outgoingProductResult.rows.length === 0) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại hoặc đã được bán!",
      });
    }

    const outgoingProduct = outgoingProductResult.rows[0];

    const farmResult = await pool.query("SELECT * FROM farms WHERE id = $1", [
      outgoingProduct.farm_id,
    ]);

    if (farmResult.rows.length === 0) {
      return res.status(404).json({ message: "Nông trại không tồn tại!" });
    }

    const farm = farmResult.rows[0];

    const producerResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'Producer'",
      [farm.producer_id]
    );

    if (producerResult.rows.length === 0) {
      return res.status(404).json({ message: "Người sản xuất không tồn tại!" });
    }

    const producer = producerResult.rows[0];
    const producerName = producer.name;

    const inventoryResult = await pool.query(
      `SELECT received_date 
     FROM inventory 
     WHERE product_id = $1 AND delivery_hub_id = $2`,
      [outgoingProduct.product_id, outgoingProduct.delivery_hub_id]
    );

    const receivedDate =
      inventoryResult.rows.length > 0
        ? inventoryResult.rows[0].received_date
        : null;

    let customerName = "Chưa có người tiêu dùng";
    let customerDetails = "Chưa bán - Đang chờ giao hàng";

    if (outgoingProduct.status === "Sold") {
      const shipmentResult = await pool.query(
        `SELECT s.recipient_id, s.received_date 
       FROM shipments s
       JOIN shipment_products sp ON s.id = sp.shipment_id
       WHERE sp.product_id = $1 AND s.recipient_type = 'Customer'`,
        [outgoingProduct.product_id]
      );

      if (shipmentResult.rows.length > 0) {
        const customerId = shipmentResult.rows[0].recipient_id;
        const deliveryDate = shipmentResult.rows[0].received_date;

        const customerResult = await pool.query(
          "SELECT name FROM users WHERE id = $1 AND role = 'Customer'",
          [customerId]
        );

        if (customerResult.rows.length > 0) {
          customerName = customerResult.rows[0].name;
          customerDetails = deliveryDate
            ? `Đã bán cho ${customerName}, Ngày giao hàng: ${new Date(
                deliveryDate
              ).toLocaleString("vi-VN")}`
            : `Đã bán cho ${customerName}, Ngày giao hàng: Chưa có thông tin`;
        } else {
          customerDetails = "Đã bán (Không tìm thấy thông tin khách hàng)";
        }
      } else {
        customerDetails = "Đã bán (Không tìm thấy thông tin giao hàng)";
      }
    }

    const ratingResult = await pool.query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count 
     FROM product_ratings 
     WHERE listing_id = $1`,
      [listingId]
    );

    const averageRating = parseFloat(ratingResult.rows[0].average_rating) || 0;
    const ratingCount = parseInt(ratingResult.rows[0].rating_count) || 0;

    const supplyChain = [
      {
        stage: "Người dân (Nông trại)",
        details: `Tên: ${producerName}, Ngày sản xuất: ${new Date(
          outgoingProduct.productdate
        ).toLocaleString("vi-VN")}`,
      },
      {
        stage: "Đại lý",
        details: receivedDate
          ? `Ngày nhận hàng: ${new Date(receivedDate).toLocaleString("vi-VN")}`
          : "Chưa nhận hàng từ nông trại",
      },
      {
        stage: "Đại lý",
        details: `Ngày đăng bán: ${new Date(
          outgoingProduct.listed_date
        ).toLocaleString("vi-VN")}`,
      },
      {
        stage: "Người tiêu dùng",
        details: customerDetails,
      },
    ];

    const origin = {
      farm_name: farm.farm_name,
      harvest_date: outgoingProduct.productdate.toISOString(),
      farm_location: farm.location,
      certification: farm.quality || "Không có chứng nhận",
    };

    const product = {
      listing_id: outgoingProduct.listing_id,
      name: outgoingProduct.name,
      price: outgoingProduct.price,
      quantity: outgoingProduct.quantity,
      delivery_hub_id: outgoingProduct.delivery_hub_id,
      delivery_hub_name: outgoingProduct.delivery_hub_name,
      imageurl: outgoingProduct.imageurl,
      description: outgoingProduct.description,
      productdate: outgoingProduct.productdate.toISOString(),
      expirydate: outgoingProduct.expirydate.toISOString(),
      hash: outgoingProduct.hash,
      status: outgoingProduct.status,
      origin: origin,
      supplyChain: supplyChain,
      average_rating: averageRating,
      rating_count: ratingCount,
    };

    res.status(200).json(product);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ! Vui lòng thử lại sau.",
      details: error.message,
    });
  }
});
// ==== API TRUY XUẤT NGUỒN GỐC SẢN PHẨM ====
app.get("/trace-product/:listingId", async (req, res) => {
  const { listingId } = req.params;

  try {
    const outgoingProductResult = await pool.query(
      `SELECT op.*, 
            p.name, 
            p.productcode, 
            p.imageurl, 
            p.description, 
            p.category, 
            p.price as original_price, 
            p.productdate, 
            p.expirydate, 
            p.farm_id,
            p.hash,
            u.name as delivery_hub_name
     FROM outgoing_products op
     JOIN products p ON op.product_id = p.id
     JOIN users u ON op.delivery_hub_id = u.id
     WHERE op.listing_id = $1`,
      [listingId]
    );

    if (outgoingProductResult.rows.length === 0) {
      return res
        .status(404)
        .send("<h1>Sản phẩm không tồn tại hoặc đã được bán!</h1>");
    }

    const outgoingProduct = outgoingProductResult.rows[0];

    const farmResult = await pool.query("SELECT * FROM farms WHERE id = $1", [
      outgoingProduct.farm_id,
    ]);

    if (farmResult.rows.length === 0) {
      return res.status(404).send("<h1>Nông trại không tồn tại!</h1>");
    }

    const farm = farmResult.rows[0];

    const producerResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'Producer'",
      [farm.producer_id]
    );

    if (producerResult.rows.length === 0) {
      return res.status(404).send("<h1>Người sản xuất không tồn tại!</h1>");
    }

    const producer = producerResult.rows[0];
    const producerName = producer.name;

    const inventoryResult = await pool.query(
      `SELECT received_date 
     FROM inventory 
     WHERE product_id = $1 AND delivery_hub_id = $2`,
      [outgoingProduct.product_id, outgoingProduct.delivery_hub_id]
    );

    const receivedDate =
      inventoryResult.rows.length > 0
        ? inventoryResult.rows[0].received_date
        : null;

    let customerName = "Chưa có người tiêu dùng";
    let customerDetails = "Chưa bán - Đang chờ giao hàng";

    if (outgoingProduct.status === "Sold") {
      const shipmentResult = await pool.query(
        `SELECT s.recipient_id, s.received_date 
       FROM shipments s
       JOIN shipment_products sp ON s.id = sp.shipment_id
       WHERE sp.product_id = $1 AND s.recipient_type = 'Customer'`,
        [outgoingProduct.product_id]
      );

      if (shipmentResult.rows.length > 0) {
        const customerId = shipmentResult.rows[0].recipient_id;
        const deliveryDate = shipmentResult.rows[0].received_date;

        const customerResult = await pool.query(
          "SELECT name FROM users WHERE id = $1 AND role = 'Customer'",
          [customerId]
        );

        if (customerResult.rows.length > 0) {
          customerName = customerResult.rows[0].name;
          customerDetails = deliveryDate
            ? `Đã bán cho ${customerName}<br>Ngày giao hàng: ${new Date(
                deliveryDate
              ).toLocaleString("vi-VN")}`
            : `Đã bán cho ${customerName}<br>Ngày giao hàng: Chưa có thông tin`;
        } else {
          customerDetails = "Đã bán (Không tìm thấy thông tin khách hàng)";
        }
      } else {
        customerDetails = "Đã bán (Không tìm thấy thông tin giao hàng)";
      }
    }

    const ratingResult = await pool.query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count 
     FROM product_ratings 
     WHERE listing_id = $1`,
      [listingId]
    );

    const averageRating = parseFloat(ratingResult.rows[0].average_rating) || 0;
    const ratingCount = parseInt(ratingResult.rows[0].rating_count) || 0;

    const supplyChain = [
      {
        stage: "Người dân (Nông trại)",
        details: `Tên: ${producerName}<br>Ngày sản xuất: ${new Date(
          outgoingProduct.productdate
        ).toLocaleString("vi-VN")}`,
      },
      {
        stage: "Đại lý",
        details: receivedDate
          ? `Ngày nhận hàng: ${new Date(receivedDate).toLocaleString("vi-VN")}`
          : "Chưa nhận hàng từ nông trại",
      },
      {
        stage: "Đại lý",
        details: `Ngày đăng bán: ${new Date(
          outgoingProduct.listed_date
        ).toLocaleString("vi-VN")}`,
      },
      {
        stage: "Người tiêu dùng",
        details: customerDetails,
      },
    ];

    const origin = {
      farm_name: farm.farm_name,
      harvest_date: outgoingProduct.productdate.toISOString(),
      farm_location: farm.location,
      certification: farm.quality || "Không có chứng nhận",
    };

    const product = {
      listing_id: outgoingProduct.listing_id,
      name: outgoingProduct.name,
      price: outgoingProduct.price,
      quantity: outgoingProduct.quantity,
      delivery_hub_name: outgoingProduct.delivery_hub_name,
      imageurl: outgoingProduct.imageurl,
      productdate: outgoingProduct.productdate.toISOString(),
      expirydate: outgoingProduct.expirydate.toISOString(),
      hash: outgoingProduct.hash,
      origin: origin,
      supplyChain: supplyChain,
      average_rating: averageRating,
      rating_count: ratingCount,
    };

    res.render("trace-product", { product });
  } catch (error) {
    console.error("Lỗi khi truy xuất nguồn gốc sản phẩm:", error);
    res.status(500).send("<h1>Lỗi máy chủ nội bộ! Vui lòng thử lại sau.</h1>");
  }
});

// ==== API LẤY DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG ====
app.get(
  "/customer/orders",
  checkAuth,
  checkRole(["Customer"]),
  async (req, res) => {
    try {
      const customerId = req.user.id;
      console.log(`Lấy danh sách đơn hàng cho customerId: ${customerId}`);

      const ordersResult = await pool.query(
        `
      SELECT o.*, 
             p.name as product_name, 
             p.imageurl as product_imageurl,
             u.name as delivery_hub_name
      FROM orders o
      JOIN outgoing_products op ON o.product_id = op.product_id
      JOIN products p ON o.product_id = p.id
      JOIN users u ON op.delivery_hub_id = u.id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC
      `,
        [customerId]
      );

      console.log("Kết quả truy vấn đơn hàng:", ordersResult.rows);

      const orders = ordersResult.rows.map((order) => ({
        id: order.id,
        product_id: order.product_id,
        product_name: order.product_name,
        product_imageurl: order.product_imageurl,
        quantity: order.quantity,
        price: order.price,
        order_date: order.order_date,
        status: order.status,
        delivery_hub_name: order.delivery_hub_name,
        shipping_address: order.shipping_address,
      }));

      res.status(200).json(orders);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      res.status(500).json({
        error: "Lỗi máy chủ nội bộ",
        details: error.message,
      });
    }
  }
);

// ==== API MUA SẢN PHẨM TỪ NGƯỜI TIÊU DÙNG ====
app.post(
  "/buy-product",
  checkAuth,
  checkRole(["Customer"]),
  async (req, res) => {
    const {
      listingId,
      customerId,
      quantity,
      price,
      deliveryHubId,
      shippingAddress,
      transactionHash,
    } = req.body;

    const client = await pool.connect(); // Sử dụng client để thực hiện giao dịch
    try {
      await client.query("BEGIN"); // Bắt đầu giao dịch

      console.log("Dữ liệu nhận được từ /buy-product:", req.body);

      if (
        !listingId ||
        !customerId ||
        !quantity ||
        quantity <= 0 ||
        !price ||
        !deliveryHubId ||
        !shippingAddress
      ) {
        console.log("Dữ liệu đầu vào không hợp lệ:", req.body);
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Vui lòng cung cấp đầy đủ thông tin! 😅",
        });
      }

      // Bước 1: Khóa hàng trong outgoing_products để tránh xung đột
      console.log(`Kiểm tra sản phẩm với listingId: ${listingId}`);
      const outgoingProductResult = await client.query(
        "SELECT * FROM outgoing_products WHERE listing_id = $1 AND status = 'Available' FOR UPDATE",
        [listingId]
      );
      if (outgoingProductResult.rows.length === 0) {
        console.log(`Không tìm thấy sản phẩm với listingId: ${listingId}`);
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Sản phẩm không tồn tại hoặc đã được bán! 😅",
        });
      }
      const outgoingProduct = outgoingProductResult.rows[0];
      console.log("Thông tin sản phẩm:", outgoingProduct);

      console.log(`Kiểm tra product_id: ${outgoingProduct.product_id}`);
      const productResult = await client.query(
        "SELECT * FROM products WHERE id = $1",
        [outgoingProduct.product_id]
      );
      if (productResult.rows.length === 0) {
        console.log(
          `Không tìm thấy sản phẩm với product_id: ${outgoingProduct.product_id}`
        );
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Sản phẩm không tồn tại trong danh mục sản phẩm! 😅",
        });
      }

      console.log(`Kiểm tra khách hàng với customerId: ${customerId}`);
      const customerResult = await client.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'Customer'",
        [customerId]
      );
      if (customerResult.rows.length === 0) {
        console.log(`Không tìm thấy khách hàng với customerId: ${customerId}`);
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Khách hàng không tồn tại! 😅",
        });
      }

      console.log(`Kiểm tra đại lý với deliveryHubId: ${deliveryHubId}`);
      const deliveryHubResult = await client.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'DeliveryHub'",
        [deliveryHubId]
      );
      if (deliveryHubResult.rows.length === 0) {
        console.log(
          `Không tìm thấy đại lý với deliveryHubId: ${deliveryHubId}`
        );
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Trung tâm phân phối không tồn tại! 😅",
        });
      }

      console.log(
        `Kiểm tra số lượng khả dụng: ${outgoingProduct.quantity} vs ${quantity}`
      );
      if (outgoingProduct.quantity < quantity) {
        console.log("Số lượng khả dụng không đủ!");
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Số lượng sản phẩm không đủ để mua! 😅",
        });
      }

      // Bước 2: Tạo đơn hàng trong cơ sở dữ liệu
      console.log("Tạo đơn hàng...");
      let order;
      try {
        const orderResult = await client.query(
          "INSERT INTO orders (product_id, customer_id, quantity, order_date, status, shipping_address, transaction_hash) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'Pending', $4, $5) RETURNING *",
          [
            outgoingProduct.product_id,
            customerId,
            quantity,
            shippingAddress,
            transactionHash || null,
          ]
        );
        order = orderResult.rows[0];
        console.log("Kết quả tạo đơn hàng:", order);
      } catch (insertError) {
        console.error("Lỗi khi tạo đơn hàng trong bảng orders:", insertError);
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: "Không thể tạo đơn hàng",
          details: insertError.message,
        });
      }

      // Bước 3: Kiểm tra trạng thái blockchain
      let isActive = false;
      let blockchainQuantity = 0;
      try {
        const productResponse = await contract.methods
          .getListedProduct(listingId)
          .call();
        console.log("Listed Product từ blockchain:", productResponse);
        isActive = productResponse.isActive;
        blockchainQuantity = parseInt(productResponse.quantity);

        if (!isActive || blockchainQuantity < quantity) {
          console.log("Sản phẩm không còn khả dụng trên blockchain!");
          await client.query("DELETE FROM orders WHERE id = $1", [order.id]);
          await client.query(
            "UPDATE outgoing_products SET status = 'Sold', quantity = 0 WHERE listing_id = $1",
            [listingId]
          );
          await client.query("COMMIT");
          return res.status(400).json({
            message: "Sản phẩm không còn khả dụng để mua! Đã hủy đơn hàng. 😅",
          });
        }
      } catch (blockchainError) {
        console.error(
          "Lỗi khi kiểm tra trạng thái từ blockchain:",
          blockchainError
        );
        await client.query("DELETE FROM orders WHERE id = $1", [order.id]);
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: "Lỗi khi kiểm tra trạng thái blockchain",
          details: blockchainError.message,
        });
      }

      // Bước 4: Cập nhật số lượng trong outgoing_products
      const newQuantity = outgoingProduct.quantity - quantity;
      console.log(
        `Cập nhật số lượng sản phẩm: listingId=${listingId}, newQuantity=${newQuantity}`
      );
      await client.query(
        "UPDATE outgoing_products SET quantity = $1 WHERE listing_id = $2",
        [newQuantity, listingId]
      );

      // Chỉ đặt trạng thái thành 'Sold' nếu số lượng về 0
      if (newQuantity === 0) {
        console.log(
          `Số lượng còn lại là 0, cập nhật trạng thái thành 'Sold' cho listingId: ${listingId}`
        );
        await client.query(
          "UPDATE outgoing_products SET status = 'Sold' WHERE listing_id = $1",
          [listingId]
        );
      } else {
        // Đảm bảo trạng thái vẫn là 'Available' nếu còn số lượng
        console.log(
          `Số lượng còn lại là ${newQuantity}, giữ trạng thái 'Available' cho listingId: ${listingId}`
        );
        await client.query(
          "UPDATE outgoing_products SET status = 'Available' WHERE listing_id = $1",
          [listingId]
        );
      }

      await client.query("COMMIT"); // Hoàn tất giao dịch

      res.status(200).json({
        message: "Mua sản phẩm thành công! Đơn hàng đã được tạo.",
        order: order,
      });
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      await client.query("ROLLBACK");
      res.status(500).json({
        error: "Lỗi máy chủ nội bộ",
        details: error.message,
      });
    } finally {
      client.release(); // Giải phóng client
    }
  }
);

// ==== API THÊM SẢN PHẨM ====
const fruitHashMapping = {
  Thom: "QmeTDW7o2ZHAKJJW8A5Jfbe1mv7RZo8sdcDTxq1mP6X5MN",
  "Vu Sua": "QmXtKxu41xyvx4x9XXz6WRTRFCnKwriWfrHCtiYTHDJF1u",
  "Dua Hau": "QmNYb72BzVRhxTcXAefSg4QESHK2fEn2T3hFUE8Gvz6gM5",
  "Mang Cut": "QmdHct5JMUtw3VpDMJg4LYLvFqkVUsoZAVmy8wqgjs8T8d",
  "Trai Thanh Long": "QmdTqSueXLd6J6EMbXvemP3VVPpUo3dkkWwbiNmKV4Cegy",
  "Trai Xoai": "QmcwFdYQXKVsPd7qhCeXowwVDbHrnmMM6hCtsfJ7US4nXT",
};

app.post("/products", checkAuth, checkRole(["Producer"]), async (req, res) => {
  console.log("Dữ liệu nhận được từ frontend:", req.body);

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
    email,
    frontendHash,
  } = req.body;

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
      !email ||
      !frontendHash
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin! 😅" });
    }

    if (req.user.email !== email) {
      return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
    }

    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'Producer'",
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng! 😅" });
    }
    const producerId = user.rows[0].id;

    const farm = await pool.query(
      "SELECT * FROM farms WHERE id = $1 AND producer_id = $2",
      [farm_id, producerId]
    );
    if (farm.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Farm không thuộc producer này! 😅" });
    }

    const ipfsHash = frontendHash;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    const result = await pool.query(
      "INSERT INTO products (name, productcode, category, description, price, quantity, imageurl, productdate, expirydate, farm_id, hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
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
        ipfsHash,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lưu sản phẩm vào cơ sở dữ liệu:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== IPFS UPLOAD ENDPOINT ====
app.post("/ipfs/add", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Vui lòng gửi file để upload lên IPFS!" });
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    const options = {
      pinataMetadata: {
        name: req.file.filename,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const result = await pinata.pinFileToIPFS(
      fs.createReadStream(req.file.path),
      options
    );

    fs.unlinkSync(req.file.path);

    console.log(
      `Tải lên thành công lên IPFS (Pinata), CID: ${result.IpfsHash}`
    );
    res.status(200).json({ hash: result.IpfsHash });
  } catch (error) {
    console.error("Lỗi khi upload lên IPFS (Pinata):", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: "Lỗi khi upload lên IPFS",
      details: error.message || "Không có chi tiết lỗi",
      stack: error.stack || "Không có stack trace",
    });
  }
});
app.post("/sync-all-products", async (req, res) => {
  try {
    // Fetch all products from outgoing_products that are marked as Available
    const productsResult = await pool.query(
      "SELECT * FROM outgoing_products WHERE status = 'Available'"
    );
    const products = productsResult.rows;

    for (const product of products) {
      const listingId = product.listing_id;
      try {
        const productResponse = await contract.methods
          .getListedProduct(listingId)
          .call();
        const isActive = productResponse.isActive;
        const blockchainQuantity = parseInt(productResponse.quantity);

        if (!isActive || blockchainQuantity === 0) {
          console.log(
            `Đồng bộ sản phẩm listingId=${listingId}: Đã bán trên blockchain`
          );
          await pool.query(
            "UPDATE outgoing_products SET status = 'Sold', quantity = 0 WHERE listing_id = $1",
            [listingId]
          );
        } else if (blockchainQuantity !== product.quantity) {
          console.log(
            `Đồng bộ sản phẩm listingId=${listingId}: Cập nhật số lượng từ ${product.quantity} thành ${blockchainQuantity}`
          );
          await pool.query(
            "UPDATE outgoing_products SET quantity = $1 WHERE listing_id = $2",
            [blockchainQuantity, listingId]
          );
        }
      } catch (error) {
        console.error(
          `Lỗi khi đồng bộ sản phẩm listingId=${listingId}:`,
          error
        );
      }
    }

    res.status(200).json({
      message: "Đồng bộ tất cả sản phẩm thành công!",
    });
  } catch (error) {
    console.error("Lỗi khi đồng bộ tất cả sản phẩm:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
    });
  }
});
// ==== API THÊM ĐÁNH GIÁ CHO SẢN PHẨM ====
app.post(
  "/products/:id/rate",
  checkAuth,
  checkRole(["Customer"]),
  async (req, res) => {
    const listingId = req.params.id;
    const { userId, rating } = req.body;

    try {
      if (!rating || rating < 1 || rating > 5 || !userId) {
        return res.status(400).json({
          message: "Đánh giá không hợp lệ! (1-5) hoặc thiếu userId! 😅",
        });
      }

      const purchaseCheck = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM orders WHERE customer_id = $1 AND product_id = (SELECT product_id FROM outgoing_products WHERE listing_id = $2)) as has_purchased",
        [userId, listingId]
      );
      if (!purchaseCheck.rows[0].has_purchased) {
        return res.status(403).json({
          message: "Bạn cần mua sản phẩm trước khi đánh giá! 😅",
        });
      }

      const existingRating = await pool.query(
        "SELECT * FROM product_ratings WHERE listing_id = $1 AND customer_id = $2",
        [listingId, userId]
      );
      if (existingRating.rows.length > 0) {
        await pool.query(
          "UPDATE product_ratings SET rating = $1 WHERE listing_id = $2 AND customer_id = $3",
          [rating, listingId, userId]
        );
      } else {
        await pool.query(
          "INSERT INTO product_ratings (listing_id, customer_id, rating) VALUES ($1, $2, $3)",
          [listingId, userId, rating]
        );
      }

      res.status(200).json({ message: "Đánh giá đã được gửi thành công! 🎉" });
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API LẤY RATING TRUNG BÌNH CỦA SẢN PHẨM ====
app.get("/products/:id/rating", async (req, res) => {
  const listingId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT AVG(rating) as average_rating, COUNT(*) as rating_count FROM product_ratings WHERE listing_id = $1",
      [listingId]
    );
    const averageRating = parseFloat(result.rows[0].average_rating) || 0;
    const ratingCount = parseInt(result.rows[0].rating_count) || 0;

    res.status(200).json({
      average_rating: averageRating.toFixed(1),
      rating_count: ratingCount,
    });
  } catch (error) {
    console.error("Lỗi khi lấy rating trung bình:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API KIỂM TRA NGƯỜI DÙNG ĐÃ MUA SẢN PHẨM CHƯA ====
app.get("/orders/check-purchase", async (req, res) => {
  const { customerId, listingId } = req.query;

  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM orders WHERE customer_id = $1 AND product_id = (SELECT product_id FROM outgoing_products WHERE listing_id = $2)) as has_purchased",
      [customerId, listingId]
    );
    res.json({ hasPurchased: result.rows[0].has_purchased });
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái mua hàng:", error);
    res.status(500).json({
      error: "Không thể kiểm tra trạng thái mua hàng",
      details: error.message,
    });
  }
});

// ==== API ĐỒNG BỘ DỮ LIỆU SẢN PHẨM ====
app.post("/sync-product", checkAuth, async (req, res) => {
  const { listingId, quantity, status } = req.body;

  try {
    console.log("Đồng bộ dữ liệu sản phẩm:", { listingId, quantity, status });

    if (!listingId || quantity === undefined || !status) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ thông tin để đồng bộ!",
      });
    }

    const result = await pool.query(
      "UPDATE outgoing_products SET quantity = $1, status = $2 WHERE listing_id = $3 RETURNING *",
      [quantity, status, listingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm để đồng bộ!",
      });
    }

    res.status(200).json({
      message: "Đồng bộ dữ liệu thành công!",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Lỗi khi đồng bộ dữ liệu:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
    });
  }
});

// Phục vụ file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Khởi động server
app.listen(3000, () => {
  console.log("Server đang chạy trên cổng 3000");
});
