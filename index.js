import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import ipfs from "./ipfsClient.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
}

// Middleware kiểm tra quyền
const checkAuth = async (req, res, next) => {
  const userAddress = req.headers["x-ethereum-address"];
  if (!userAddress) {
    return res.status(401).json({ error: "Yêu cầu xác thực ví MetaMask!" });
  }

  try {
    // Chuẩn hóa địa chỉ ví về chữ thường
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

    console.log("Dữ liệu farm trả về:", farms.rows); // Thêm log để debug
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
      SELECT COUNT(*) 
      FROM outgoing_products op
      JOIN shipment_products sp ON op.product_id = sp.product_id
      JOIN shipments s ON sp.shipment_id = s.id
      WHERE op.product_id IN (SELECT id FROM products WHERE farm_id = ANY($1))
      AND s.status = 'Delivered'
      AND s.recipient_type = 'Customer'
      `,
        [farmIds]
      );
      const soldProducts = parseInt(soldProductsResult.rows[0].count);

      const revenueResult = await pool.query(
        `
      SELECT COALESCE(SUM(sp.price * sp.quantity), 0) as total_revenue
      FROM shipment_products sp
      JOIN shipments s ON sp.shipment_id = s.id
      WHERE sp.product_id IN (SELECT id FROM products WHERE farm_id = ANY($1))
      AND s.status = 'Delivered'
      AND s.recipient_type = 'Customer'
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

      const buyerResult = await pool.query(
        "SELECT * FROM users WHERE wallet_address = $1 AND role = 'DeliveryHub'",
        [buyerAddress]
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
        "SELECT i.*, p.name, p.productcode, p.category, p.imageurl, p.description, p.productdate AS product_productdate, p.expirydate AS product_expirydate FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.delivery_hub_id = $1",
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

      if (req.user.id !== inventoryItem.delivery_hub_id) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      if (inventoryItem.quantity < quantity) {
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
      `SELECT op.*, p.name, p.productcode, p.imageurl, p.description, p.category, p.price as original_price, u.name as delivery_hub_name
       FROM outgoing_products op
       JOIN products p ON op.product_id = p.id
       JOIN users u ON op.delivery_hub_id = u.id
       WHERE op.status = 'Available'`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// ==== API MUA SẢN PHẨM TỪ NGƯỜI TIÊU DÙNG ====
app.post(
  "/buy-product",
  checkAuth,
  checkRole(["Customer"]),
  async (req, res) => {
    const { listingId, customerId, quantity, price, deliveryHubId } = req.body;

    try {
      if (
        !listingId ||
        !customerId ||
        !quantity ||
        quantity <= 0 ||
        !price ||
        !deliveryHubId
      ) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      const outgoingProductResult = await pool.query(
        "SELECT * FROM outgoing_products WHERE listing_id = $1 AND status = 'Available'",
        [listingId]
      );
      if (outgoingProductResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm không tồn tại hoặc đã được bán! 😅" });
      }
      const outgoingProduct = outgoingProductResult.rows[0];

      if (outgoingProduct.quantity < quantity) {
        return res
          .status(400)
          .json({ message: "Số lượng không đủ để mua! 😅" });
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
        [shipment.id, outgoingProduct.product_id, quantity, price]
      );

      const newQuantity = outgoingProduct.quantity - quantity;
      if (newQuantity === 0) {
        await pool.query(
          "UPDATE outgoing_products SET status = 'Sold', quantity = 0 WHERE listing_id = $1",
          [listingId]
        );
      } else {
        await pool.query(
          "UPDATE outgoing_products SET quantity = $1 WHERE listing_id = $2",
          [newQuantity, listingId]
        );
      }

      res.status(200).json({
        message: "Mua sản phẩm thành công! Lô hàng đã được tạo.",
        shipment: shipment,
      });
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
  }
);

// ==== API THÊM SẢN PHẨM ====
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

    const finalHash = frontendHash;
    const imageUrl = `http://localhost:8080/ipfs/${finalHash}`; // Sử dụng gateway cục bộ
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
        finalHash,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi khi lưu sản phẩm vào cơ sở dữ liệu:", error);
    if (error.code === "ECONNREFUSED" && error.message.includes("ipfs")) {
      res.status(500).json({
        error:
          "Không thể kết nối đến IPFS daemon. Vui lòng kiểm tra xem IPFS daemon có đang chạy không.",
      });
    } else {
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    }
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
    const result = await ipfs.add(fileBuffer);
    fs.unlinkSync(req.file.path); // Xóa file tạm sau khi upload

    res.status(200).json({ hash: result.path });
  } catch (error) {
    console.error("Lỗi khi upload lên IPFS:", error);
    if (error.code === "ECONNREFUSED") {
      res.status(500).json({
        error:
          "Không thể kết nối đến IPFS daemon. Vui lòng kiểm tra xem IPFS daemon có đang chạy không.",
      });
    } else {
      res
        .status(500)
        .json({ error: "Lỗi khi upload lên IPFS", details: error.message });
    }
  }
});

// Phục vụ file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(3000, () => {
  console.log("Server đang chạy trên cổng 3000");
});
