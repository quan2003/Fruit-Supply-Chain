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
import axios from "axios";
import helmet from "helmet";
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import contractData from "./artifacts/contracts/FruitSupplyChain.sol/FruitSupplyChain.json" with { type: "json" };
import governmentRegulatorData from "./artifacts/contracts/GovernmentRegulator.sol/GovernmentRegulator.json" with { type: "json" };
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

app.use(helmet());

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
  "Government",
  "DeliveryHub",
  "Customer",
  "Admin",
];

let CONTRACT_ADDRESS = "";
let GOVERNMENT_REGULATOR_ADDRESS = "";
try {
  const contractAddressesPath = "D:/fruit-supply-chain/contract-addresses.json";
  if (fs.existsSync(contractAddressesPath)) {
    const contractAddresses = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
    CONTRACT_ADDRESS = contractAddresses.FruitSupplyChain;
    GOVERNMENT_REGULATOR_ADDRESS = contractAddresses.GovernmentRegulator;
    console.log("Địa chỉ FruitSupplyChain từ file:", CONTRACT_ADDRESS);
    console.log("Địa chỉ GovernmentRegulator từ file:", GOVERNMENT_REGULATOR_ADDRESS);
  } else {
    console.error(
      "File contract-addresses.json không tồn tại tại đường dẫn:",
      contractAddressesPath
    );
    throw new Error("File contract-addresses.json không tồn tại!");
  }
} catch (error) {
  console.error("Lỗi khi đọc địa chỉ hợp đồng từ file:", error);
  CONTRACT_ADDRESS = "";
  GOVERNMENT_REGULATOR_ADDRESS = "";
  process.exit(1); // Thoát nếu không đọc được địa chỉ hợp đồng
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

// Khởi tạo GovernmentRegulator contract
const governmentRegulatorAbi = governmentRegulatorData.abi;
let governmentRegulator;

try {
  if (!governmentRegulatorAbi || governmentRegulatorAbi.length === 0) {
    throw new Error("ABI của GovernmentRegulator không hợp lệ!");
  }
  governmentRegulator = new web3.eth.Contract(governmentRegulatorAbi, GOVERNMENT_REGULATOR_ADDRESS);
  console.log("Khởi tạo GovernmentRegulator contract thành công:", GOVERNMENT_REGULATOR_ADDRESS);
} catch (error) {
  console.error("Lỗi khi khởi tạo GovernmentRegulator contract:", error);
  process.exit(1); // Thoát nếu không khởi tạo được GovernmentRegulator contract
}

// Middleware kiểm tra quyền
const checkAuth = async (req, res, next) => {
  const userAddress = req.headers["x-ethereum-address"];
  console.log("Nhận yêu cầu với x-ethereum-address:", userAddress);

  if (!userAddress) {
    console.log("Thiếu header x-ethereum-address");
    return res.status(401).json({ error: "Yêu cầu xác thực ví MetaMask!" });
  }

  try {
    const normalizedAddress = userAddress.toLowerCase();
    const user = await pool.query(
      "SELECT * FROM users WHERE LOWER(wallet_address) = $1",
      [normalizedAddress]
    );
    console.log("Kết quả truy vấn người dùng:", user.rows);

    if (user.rows.length === 0) {
      console.log("Không tìm thấy người dùng với địa chỉ ví:", normalizedAddress);
      return res.status(401).json({
        error: "Địa chỉ ví không được liên kết với tài khoản nào!",
      });
    }

    const userData = user.rows[0];
    if (!userData.wallet_address) {
      console.log("Người dùng không có wallet_address:", userData.email);
      return res.status(401).json({
        error: "Người dùng chưa liên kết ví MetaMask!",
      });
    }

    req.user = userData;
    console.log("req.user được gán:", req.user);
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra xác thực:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
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
// Hàm helper để tạo PDF hợp đồng
// Hàm helper để tạo PDF hợp đồng
const generateContractPDF = (contract, isSigned, stream) => {
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
    bufferPages: true,
    info: {
      Title: `Hợp đồng ba bên ${contract.contract_id}`,
      Author: 'Hệ thống Fruit Supply Chain',
      Subject: 'Hợp đồng ba bên',
      CreationDate: new Date(),
    },
  });

  // Đăng ký font
  try {
    const fontDir = path.join(process.cwd(), 'fonts');
    doc.registerFont('Roboto-Regular', path.join(fontDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontDir, 'Roboto-Bold.ttf'));
    console.log("Đã đăng ký font Roboto");
  } catch (fontError) {
    console.error("Lỗi khi đăng ký font:", fontError);
    doc.font('Helvetica');
  }

  doc.pipe(stream);

  // Tiêu đề
  doc
    .font('Roboto-Bold')
    .fontSize(18)
    .text('HỢP ĐỒNG BA BÊN', { align: 'center' });
  doc
    .font('Roboto-Regular')
    .fontSize(12)
    .text(`Số: ${contract.contract_id}/HĐBB/${new Date(contract.creation_date).getFullYear()}`, { align: 'center' });
  if (isSigned) {
    doc
      .font('Roboto-Bold')
      .fontSize(11)
      .fillColor('green')
      .text('(Đã ký bởi các bên)', { align: 'center' });
    doc.fillColor('black');
  }
  doc.moveDown(2);

  // Thông tin cơ bản
  doc
    .font('Roboto-Regular')
    .fontSize(11)
    .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' })
    .text('Độc lập - Tự do - Hạnh phúc', { align: 'center' })
    .text('----------------', { align: 'center' })
    .moveDown(1);
  doc
    .text(`Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, tại _____, chúng tôi gồm:`, 60, doc.y)
    .moveDown(1);

  // Thông tin các bên
  doc
    .font('Roboto-Bold')
    .fontSize(13)
    .text('CÁC BÊN THAM GIA HỢP ĐỒNG', { underline: true })
    .moveDown(0.8);

  const drawPartyInfo = (title, details) => {
    doc
      .font('Roboto-Bold')
      .fontSize(11)
      .text(title);
    doc.moveDown(0.3);
    doc.font('Roboto-Regular').fontSize(10);
    details.forEach(line => doc.text(line, { indent: 15 }));
    doc.moveDown(0.7);
  };

  drawPartyInfo('BÊN A: CƠ QUAN QUẢN LÝ NHÀ NƯỚC (GOVERNMENT)', [
    'Đại diện: Cơ quan quản lý nông nghiệp',
    'Địa chỉ: [Địa chỉ cơ quan nhà nước]',
  ]);
  drawPartyInfo('BÊN B: BÊN CUNG CẤP (NÔNG TRẠI - FARM)', [
    `Tên/Chủ sở hữu: ${contract.farm_owner_name || '[Chưa có tên]'}`,
    `Mã nông trại: ${contract.farm_id}`,
    `Địa chỉ: ${contract.farm_location || '[Chưa có địa chỉ]'}`,
  ]);
  drawPartyInfo('BÊN C: BÊN THU MUA VÀ PHÂN PHỐI (DELIVERY HUB)', [
    `Tên đơn vị/Cá nhân: ${contract.delivery_hub_name || '[Chưa có tên]'}`,
    `Địa chỉ ví MetaMask: ${contract.delivery_hub_wallet_address}`,
  ]);
  doc.moveDown(1.5);

  // Điều khoản hợp đồng
  doc
    .font('Roboto-Bold')
    .fontSize(13)
    .text('ĐIỀU KHOẢN HỢP ĐỒNG', { underline: true })
    .moveDown(0.8);
  doc
    .font('Roboto-Regular')
    .fontSize(10.5)
    .text(contract.terms || 'Nội dung điều khoản chưa được cung cấp.', {
      align: 'justify',
      lineGap: 3,
    });
  doc.moveDown(2);

  // Chữ ký
  if (isSigned) {
    doc
      .font('Roboto-Bold')
      .fontSize(13)
      .text('XÁC NHẬN CỦA CÁC BÊN', { underline: true })
      .moveDown(1.5);
    doc.font('Roboto-Regular').fontSize(10);

    const sigStartY = doc.y;
    const sigColWidth = (doc.page.width - 120) / 3;
    const sigStartX1 = 60;
    const sigStartX2 = sigStartX1 + sigColWidth + 10;
    const sigStartX3 = sigStartX2 + sigColWidth + 10;
    const sigImageWidth = Math.min(100, sigColWidth * 0.8);
    const sigImageHeight = 50;

    const drawSignatureBlock = (title, signatureDataUrl, x, y, isSignedFlag) => {
      const blockStartY = y;
      doc
        .font('Roboto-Bold')
        .text(title, x, blockStartY, { width: sigColWidth, align: 'center' });
      doc.moveDown(1);
      const imageY = doc.y;
      let blockEndY = imageY;

      if (isSignedFlag && signatureDataUrl && signatureDataUrl.startsWith('data:image/')) {
        try {
          const signatureBuffer = Buffer.from(signatureDataUrl.split(',')[1], 'base64');
          const imageX = x + (sigColWidth - sigImageWidth) / 2;
          doc.image(signatureBuffer, imageX, imageY, {
            width: sigImageWidth,
            height: sigImageHeight,
            align: 'center',
          });
          blockEndY = imageY + sigImageHeight + doc.currentLineHeight() * 2;
          doc.y = blockEndY;
        } catch (e) {
          console.error(`Lỗi hiển thị chữ ký cho ${title}:`, e);
          doc
            .font('Roboto-Regular')
            .fillColor('red')
            .text('(Lỗi hiển thị chữ ký)', x, imageY, { width: sigColWidth, align: 'center' });
          doc.fillColor('black');
          doc.moveDown(3);
          blockEndY = doc.y;
        }
      } else {
        doc.text('(Chưa ký)', x, imageY, { width: sigColWidth, align: 'center' });
        doc.moveDown(3);
        blockEndY = doc.y;
      }
      doc.moveDown(0.5);
      doc.text(`Ngày ký: ___ / ___ / ______`, x, blockEndY - doc.currentLineHeight(), {
        width: sigColWidth,
        align: 'center',
      });
      return blockEndY;
    };

    const endY1 = drawSignatureBlock('BÊN A (GOVERNMENT)', contract.government_signature, sigStartX1, sigStartY, contract.is_government_signed);
    doc.y = sigStartY;
    const endY2 = drawSignatureBlock('BÊN B (FARM)', contract.farm_signature, sigStartX2, sigStartY, contract.is_farm_signed);
    doc.y = sigStartY;
    const endY3 = drawSignatureBlock('BÊN C (DELIVERY HUB)', contract.agent_signature, sigStartX3, sigStartY, contract.is_agent_signed);
    doc.y = Math.max(endY1, endY2, endY3) + 20;
  } else {
    doc
      .font('Roboto-Bold')
      .fontSize(13)
      .text('CHỮ KÝ CÁC BÊN', { underline: true })
      .moveDown(1.5);

    const sigColWidth = (doc.page.width - 120) / 3;
    const sigStartX1 = 60;
    const sigStartX2 = sigStartX1 + sigColWidth + 10;
    const sigStartX3 = sigStartX2 + sigColWidth + 10;
    const sigStartY = doc.y;

    const drawEmptySigBlock = (title, x, y) => {
      doc
        .font('Roboto-Bold')
        .fontSize(11)
        .text(title, x, y, { width: sigColWidth, align: 'center' });
      doc.moveDown(4);
      doc
        .font('Roboto-Regular')
        .fontSize(10)
        .text('Ngày ký: ___ / ___ / ______', x, doc.y, { width: sigColWidth, align: 'center' });
      return doc.y + doc.currentLineHeight();
    };

    const endY1 = drawEmptySigBlock('BÊN A (GOVERNMENT)', sigStartX1, sigStartY);
    doc.y = sigStartY;
    const endY2 = drawEmptySigBlock('BÊN B (FARM)', sigStartX2, sigStartY);
    doc.y = sigStartY;
    const endY3 = drawEmptySigBlock('BÊN C (DELIVERY HUB)', sigStartX3, sigStartY);
    doc.y = Math.max(endY1, endY2, endY3) + 20;
  }

  // Thêm footer với số trang sau khi tất cả nội dung đã được thêm
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc
      .moveTo(doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 10)
      .lineTo(doc.page.width - doc.page.margins.right, doc.page.height - doc.page.margins.bottom + 10)
      .lineWidth(0.5)
      .strokeOpacity(0.5)
      .stroke();
    doc
      .font('Roboto-Regular')
      .fontSize(9)
      .text(`Trang ${i + 1} / ${totalPages}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 15, {
        align: 'center',
      });
  }

  doc.end();
  console.log(`Đã tạo PDF cho hợp đồng ${contract.contract_id}, isSigned: ${isSigned}, Tổng số trang: ${totalPages}`);
};
// ==== API TRẢ VỀ ĐỊA CHỈ HỢP ĐỒNG ====
app.get("/contract-address", (req, res) => {
  try {
    const contractAddressPath = "D:/fruit-supply-chain/contract-address.txt";
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

      if (!productId || !buyerAddress || !quantity || quantity <= 0) {
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

      if (quantity !== product.quantity) {
        console.log(
          `Số lượng yêu cầu (${quantity}) không khớp với số lượng trong products (${product.quantity})`
        );
        return res.status(400).json({
          message: `Số lượng thu mua phải đúng ${product.quantity} kg như người dân đăng bán! 😅`,
        });
      }

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
        fruitId: product.fruit_id, // Trả về fruitId từ bảng products
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
          const result = await pool.query(
              "SELECT i.*, p.id AS product_id, p.fruit_id, p.name, p.productcode, p.category, p.imageurl, p.description, p.productdate AS product_productdate, p.expirydate AS product_expirydate FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.delivery_hub_id = $1 AND i.quantity > 0",
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
      const { inventoryId, quantity, price, transactionHash, fruitId, listingId } = req.body;

      try {
          console.log("Nhận yêu cầu đăng bán sản phẩm:", {
              inventoryId,
              quantity,
              price,
              transactionHash,
              fruitId,
              listingId,
          });

          if (!inventoryId || !quantity || quantity <= 0 || !listingId) {
              return res
                  .status(400)
                  .json({ message: "Vui lòng cung cấp đầy đủ thông tin, bao gồm listingId! 😅" });
          }

          let inventoryResult = await pool.query(
              "SELECT i.*, p.quantity as product_quantity FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.id = $1",
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

          const productQuantity = inventoryItem.product_quantity;
          if (quantity !== productQuantity) {
              console.log(
                  `Số lượng bán (${quantity}) không khớp với số lượng trong products (${productQuantity})`
              );
              return res.status(400).json({
                  message: `Số lượng bán phải đúng ${productQuantity} kg như người dân đăng bán! 😅`,
              });
          }

          if (inventoryItem.quantity < quantity) {
              console.log("Không đủ số lượng trong kho để đăng bán");
              return res
                  .status(400)
                  .json({ message: "Số lượng trong kho không đủ! 😅" });
          }

          const sellingPrice = price || inventoryItem.price;

          // Thêm bản ghi vào outgoing_products với original_quantity
          const outgoingResult = await pool.query(
              "INSERT INTO outgoing_products (product_id, delivery_hub_id, quantity, original_quantity, price, listed_date, status, transaction_hash, listing_id, fruit_id) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'Available', $6, $7, $8) RETURNING *",
              [
                  inventoryItem.product_id,
                  inventoryItem.delivery_hub_id,
                  quantity,
                  quantity, // Lưu original_quantity bằng số lượng ban đầu
                  sellingPrice,
                  transactionHash || null,
                  listingId,
                  fruitId || null,
              ]
          );

          const newQuantity = inventoryItem.quantity - quantity;
          console.log(
              `Cập nhật số lượng trong inventory: inventoryId=${inventoryId}, oldQuantity=${inventoryItem.quantity}, quantityToSell=${quantity}, newQuantity=${newQuantity}`
          );

          if (newQuantity === 0) {
              await pool.query("DELETE FROM inventory WHERE id = $1", [inventoryId]);
              console.log(`Đã xóa bản ghi inventory với id=${inventoryId} vì số lượng về 0`);
          } else {
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
app.delete("/farm/:id", checkAuth, checkRole(["Producer"]), async (req, res) => {
  const farmId = req.params.id;

  try {
    const farm = await pool.query(
      "SELECT * FROM farms WHERE id = $1 AND producer_id = $2",
      [farmId, req.user.id]
    );
    if (farm.rows.length === 0) {
      return res.status(404).json({ message: "Farm không tồn tại hoặc không thuộc bạn! 😅" });
    }

    await pool.query("DELETE FROM farms WHERE id = $1", [farmId]);
    res.status(200).json({ message: "Farm đã được xóa thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa farm:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});
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
      fruitId, // Thêm fruitId vào yêu cầu
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
        fruitId,
      });

      if (!productId || !deliveryHubId || !quantity || !price || !fruitId) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin, bao gồm fruitId! 😅" });
      }

      if (req.user.id !== parseInt(deliveryHubId)) {
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const productResult = await pool.query(
        "SELECT quantity FROM products WHERE id = $1",
        [productId]
      );
      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại! 😅" });
      }
      const productQuantity = productResult.rows[0].quantity;
      if (quantity !== productQuantity) {
        return res.status(400).json({
          message: `Số lượng thêm vào kho phải đúng ${productQuantity} kg như người dân đăng bán! 😅`,
        });
      }

      const defaultProductDate = productdate || new Date().toISOString();
      const defaultExpiryDate =
        expirydate ||
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();

      const inventoryResult = await pool.query(
        "INSERT INTO inventory (product_id, delivery_hub_id, quantity, price, productdate, expirydate, received_date, transaction_hash, fruit_id) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8) RETURNING *",
        [
          productId,
          deliveryHubId,
          quantity,
          price,
          defaultProductDate,
          defaultExpiryDate,
          transactionHash || null,
          fruitId, // Lưu fruitId vào bảng inventory
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
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      console.log("Dữ liệu nhận được từ /ship-to-customer:", {
        productId,
        deliveryHubId,
        customerId,
        quantity,
      });

      if (
        !productId ||
        !deliveryHubId ||
        !customerId ||
        !quantity ||
        quantity <= 0
      ) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp đầy đủ thông tin! 😅" });
      }

      if (req.user.id !== parseInt(deliveryHubId)) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Không có quyền truy cập! 😅" });
      }

      const orderResult = await client.query(
        "SELECT * FROM orders WHERE product_id = $1 AND customer_id = $2 AND status = 'Pending'",
        [productId, customerId]
      );
      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: `Đơn hàng không tồn tại hoặc đã được xử lý! Product ID: ${productId}, Customer ID: ${customerId} 😅`,
        });
      }
      const order = orderResult.rows[0];

      if (order.quantity !== quantity) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Số lượng vận chuyển phải khớp với đơn hàng: ${order.quantity} kg! 😅` });
      }

      const outgoingProductResult = await client.query(
        "SELECT * FROM outgoing_products WHERE product_id = $1 AND delivery_hub_id = $2 FOR UPDATE",
        [productId, deliveryHubId]
      );
      if (outgoingProductResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: `Sản phẩm không tồn tại trong danh sách bán! Product ID: ${productId}, Delivery Hub ID: ${deliveryHubId} 😅`,
        });
      }
      const outgoingProduct = outgoingProductResult.rows[0];

      if (outgoingProduct.quantity < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Số lượng sản phẩm không đủ để vận chuyển! Số lượng khả dụng: ${outgoingProduct.quantity} 😅`,
        });
      }

      const customerResult = await client.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'Customer'",
        [customerId]
      );
      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: `Khách hàng không tồn tại! Customer ID: ${customerId} 😅`,
        });
      }

      const newQuantity = outgoingProduct.quantity - quantity;
      await client.query(
        "UPDATE outgoing_products SET quantity = $1 WHERE product_id = $2 AND delivery_hub_id = $3",
        [newQuantity, productId, deliveryHubId]
      );

      if (newQuantity === 0) {
        await client.query(
          "UPDATE outgoing_products SET status = 'Sold' WHERE product_id = $1 AND delivery_hub_id = $2",
          [productId, deliveryHubId]
        );
      }

      const shipmentResult = await client.query(
        "INSERT INTO shipments (sender_id, sender_type, recipient_id, recipient_type, status, shipment_date) VALUES ($1, 'DeliveryHub', $2, 'Customer', 'In Transit', CURRENT_TIMESTAMP) RETURNING *",
        [deliveryHubId, customerId]
      );
      const shipment = shipmentResult.rows[0];

      await client.query(
        "INSERT INTO shipment_products (shipment_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [shipment.id, productId, quantity, outgoingProduct.price]
      );

      await client.query(
        "UPDATE orders SET status = 'Shipped' WHERE product_id = $1 AND customer_id = $2",
        [productId, customerId]
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: "Lô hàng đã được gửi đi thành công!",
        shipment: shipment,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi gửi lô hàng đến khách hàng:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    } finally {
      client.release();
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
  const productId = req.params.id;
  if (!productId || productId === "undefined" || isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ!" });
  }
  try {
      const result = await pool.query("SELECT * FROM products WHERE id = $1", [
          productId,
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
          original_quantity: outgoingProduct.original_quantity, // Thêm original_quantity
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
          shippingFee,
          paymentMethod,
          transactionHash,
      } = req.body;

      const client = await pool.connect();
      try {
          await client.query("BEGIN");

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
              await client.query("ROLLBACK");
              return res.status(400).json({
                  message: "Vui lòng cung cấp đầy đủ thông tin! 😅",
              });
          }

          // Đồng bộ dữ liệu với blockchain
          let isActive = false;
          let blockchainQuantity = 0;
          let blockchainPrice = 0;
          try {
              const productResponse = await contract.methods
                  .getListedProduct(listingId)
                  .call();
              console.log("Dữ liệu blockchain:", productResponse);
              isActive = productResponse.isActive;
              blockchainQuantity = parseInt(productResponse.quantity);
              blockchainPrice = parseInt(productResponse.price);
              if (!isActive || blockchainQuantity < quantity) {
                  await client.query("ROLLBACK");
                  return res.status(400).json({
                      message: `Sản phẩm không còn khả dụng trên blockchain! Số lượng khả dụng: ${blockchainQuantity} 😅`,
                  });
              }
          } catch (blockchainError) {
              console.error("Lỗi khi kiểm tra blockchain:", blockchainError);
              await client.query("ROLLBACK");
              return res.status(500).json({
                  error: "Lỗi khi kiểm tra trạng thái blockchain",
                  details: blockchainError.message,
              });
          }

          // Khóa hàng trong outgoing_products
          const outgoingProductResult = await client.query(
              "SELECT * FROM outgoing_products WHERE listing_id = $1 AND status = 'Available' FOR UPDATE",
              [listingId]
          );
          if (outgoingProductResult.rows.length === 0) {
              await client.query("ROLLBACK");
              return res.status(404).json({
                  message: "Sản phẩm không tồn tại hoặc đã được bán! 😅",
              });
          }
          let outgoingProduct = outgoingProductResult.rows[0];

          // Đồng bộ số lượng từ blockchain
          if (outgoingProduct.quantity !== blockchainQuantity) {
              await client.query(
                  "UPDATE outgoing_products SET quantity = $1 WHERE listing_id = $2",
                  [blockchainQuantity, listingId]
              );
              outgoingProduct.quantity = blockchainQuantity;
          }

          // Kiểm tra số lượng trong outgoing_products
          if (outgoingProduct.quantity < quantity) {
              await client.query("ROLLBACK");
              return res.status(400).json({
                  message: `Số lượng sản phẩm không đủ để mua! Số lượng khả dụng: ${outgoingProduct.quantity} 😅`,
              });
          }

          // Xác thực giá mỗi hộp với độ chính xác cao, sử dụng original_quantity
          const expectedPricePerUnit = parseFloat(
              (parseFloat(outgoingProduct.price) / outgoingProduct.original_quantity).toFixed(2)
          );
          const requestedPrice = parseFloat(price);
          const tolerance = 0.01; // Cho phép sai số 0.01 AGT
          if (Math.abs(requestedPrice - expectedPricePerUnit) > tolerance) {
              await client.query("ROLLBACK");
              return res.status(400).json({
                  message: `Giá mỗi hộp không khớp! Giá mong đợi: ${expectedPricePerUnit.toFixed(2)} AGT/hộp, giá gửi lên: ${requestedPrice} AGT/hộp 😅`,
              });
          }

          // Kiểm tra sản phẩm
          const productResult = await client.query(
              "SELECT * FROM products WHERE id = $1",
              [outgoingProduct.product_id]
          );
          if (productResult.rows.length === 0) {
              await client.query("ROLLBACK");
              return res.status(404).json({
                  message: "Sản phẩm không tồn tại trong danh mục sản phẩm! 😅",
              });
          }

          // Kiểm tra khách hàng
          const customerResult = await client.query(
              "SELECT * FROM users WHERE id = $1 AND role = 'Customer'",
              [customerId]
          );
          if (customerResult.rows.length === 0) {
              await client.query("ROLLBACK");
              return res.status(404).json({
                  message: "Khách hàng không tồn tại! 😅",
              });
          }

          // Kiểm tra trung tâm phân phối
          const deliveryHubResult = await client.query(
              "SELECT * FROM users WHERE id = $1 AND role = 'DeliveryHub'",
              [deliveryHubId]
          );
          if (deliveryHubResult.rows.length === 0) {
              await client.query("ROLLBACK");
              return res.status(404).json({
                  message: "Trung tâm phân phối không tồn tại! 😅",
              });
          }

          // Kiểm tra và thêm sản phẩm vào inventory nếu cần
          const inventoryResult = await client.query(
              "SELECT * FROM inventory WHERE product_id = $1 AND delivery_hub_id = $2",
              [outgoingProduct.product_id, deliveryHubId]
          );
          if (inventoryResult.rows.length === 0) {
              await client.query(
                  "INSERT INTO inventory (product_id, delivery_hub_id, quantity, price, productdate, expirydate, received_date, transaction_hash) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7) RETURNING *",
                  [
                      outgoingProduct.product_id,
                      deliveryHubId,
                      quantity,
                      expectedPricePerUnit,
                      productResult.rows[0].productdate || new Date().toISOString(),
                      productResult.rows[0].expirydate ||
                          new Date(
                              new Date().setMonth(new Date().getMonth() + 1)
                          ).toISOString(),
                      transactionHash || null,
                  ]
              );
          } else {
              const inventoryItem = inventoryResult.rows[0];
              const newQuantity = inventoryItem.quantity + quantity;
              await client.query(
                  "UPDATE inventory SET quantity = $1 WHERE product_id = $2 AND delivery_hub_id = $3",
                  [newQuantity, outgoingProduct.product_id, deliveryHubId]
              );
          }

          // Tính tổng giá cho đơn hàng
          const totalOrderPrice = (expectedPricePerUnit * quantity).toFixed(2);

          // Tạo đơn hàng với giá tổng
          const orderResult = await client.query(
              "INSERT INTO orders (product_id, customer_id, quantity, price, order_date, status, shipping_address, transaction_hash) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'Pending', $5, $6) RETURNING *",
              [
                  outgoingProduct.product_id,
                  customerId,
                  quantity,
                  totalOrderPrice,
                  shippingAddress,
                  transactionHash || null,
              ]
          );
          const order = orderResult.rows[0];

          // Cập nhật số lượng
          const newQuantity = outgoingProduct.quantity - quantity;
          await client.query(
              "UPDATE outgoing_products SET quantity = $1 WHERE listing_id = $2",
              [newQuantity, listingId]
          );

          // Cập nhật trạng thái
          const newStatus = newQuantity === 0 ? "Sold" : "Available";
          await client.query(
              "UPDATE outgoing_products SET status = $1 WHERE listing_id = $2",
              [newStatus, listingId]
          );

          await client.query("COMMIT");

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
          client.release();
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

// Trong index.js
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
    fruitId, // Thêm fruitId vào yêu cầu
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
      !frontendHash ||
      !fruitId
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin, bao gồm fruitId! 😅" });
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
      "INSERT INTO products (name, productcode, category, description, price, quantity, imageurl, productdate, expirydate, farm_id, hash, fruit_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
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
        fruitId, // Lưu fruitId vào bảng products
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
  const { listingId } = req.body;

  try {
    console.log("Đồng bộ dữ liệu sản phẩm:", { listingId });

    if (!listingId) {
      return res.status(400).json({
        message: "Vui lòng cung cấp listingId để đồng bộ!",
      });
    }

    // Kiểm tra sản phẩm trong cơ sở dữ liệu
    const outgoingProductResult = await pool.query(
      "SELECT * FROM outgoing_products WHERE listing_id = $1",
      [listingId]
    );
    if (outgoingProductResult.rows.length === 0) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại trong cơ sở dữ liệu!",
      });
    }

    // Lấy dữ liệu sản phẩm từ blockchain
    let productResponse;
    try {
      productResponse = await contract.methods.getListedProduct(listingId).call();
      console.log("Dữ liệu blockchain:", productResponse);
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu blockchain cho listingId=${listingId}:`, error);
      if (error.message.includes("Invalid Listing ID")) {
        await pool.query(
          "UPDATE outgoing_products SET quantity = 0, status = 'Sold' WHERE listing_id = $1",
          [listingId]
        );
        return res.status(200).json({
          message: "Sản phẩm không tồn tại trên blockchain, đã đánh dấu là Sold trong cơ sở dữ liệu.",
        });
      }
      return res.status(500).json({
        error: "Lỗi khi lấy dữ liệu từ blockchain",
        details: error.message,
      });
    }

    const isActive = productResponse.isActive;
    const blockchainQuantity = parseInt(productResponse.quantity);
    const status = isActive && blockchainQuantity > 0 ? "Available" : "Sold";

    // Kiểm tra nếu blockchain trả về quantity = 0 nhưng cơ sở dữ liệu vẫn có quantity > 0
    const outgoingProduct = outgoingProductResult.rows[0];
    if (blockchainQuantity === 0 && outgoingProduct.quantity > 0) {
      console.warn(
        `Dữ liệu không nhất quán: listingId=${listingId}, blockchain quantity=0, database quantity=${outgoingProduct.quantity}`
      );
      // Không cập nhật cơ sở dữ liệu nếu có sự không nhất quán, yêu cầu kiểm tra lại
      return res.status(400).json({
        message: "Dữ liệu không nhất quán giữa blockchain và cơ sở dữ liệu. Vui lòng kiểm tra lại!",
      });
    }

    // Cập nhật cơ sở dữ liệu
    const result = await pool.query(
      "UPDATE outgoing_products SET quantity = $1, status = $2 WHERE listing_id = $3 RETURNING *",
      [blockchainQuantity, status, listingId]
    );

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
// ==== API LẤY DANH SÁCH ĐƠN HÀNG TỪ KHÁCH HÀNG CHO TRUNG TÂM PHÂN PHỐI ====
app.get(
  "/delivery-hub/orders",
  checkAuth,
  checkRole(["DeliveryHub"]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const deliveryHubId = req.user.id;
      console.log(`Lấy danh sách đơn hàng cho DeliveryHub ID: ${deliveryHubId}`);

      // Cập nhật trạng thái đơn hàng nếu sản phẩm không còn khả dụng
      await client.query(
        `
        UPDATE orders o
        SET status = 'Cancelled'
        FROM outgoing_products op
        WHERE o.product_id = op.product_id
        AND op.delivery_hub_id = $1
        AND o.status = 'Pending'
        AND op.quantity = 0
        `,
        [deliveryHubId]
      );

      const ordersResult = await client.query(
        `
        SELECT o.*, 
               p.name as product_name, 
               p.imageurl as product_imageurl,
               u.name as customer_name,
               op.quantity as available_quantity
        FROM orders o
        JOIN outgoing_products op ON o.product_id = op.product_id
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.customer_id = u.id
        WHERE op.delivery_hub_id = $1
        AND o.status = 'Pending'
        AND op.quantity > 0
        ORDER BY o.order_date DESC
        `,
        [deliveryHubId]
      );

      console.log("Kết quả truy vấn đơn hàng:", ordersResult.rows);

      const orders = ordersResult.rows.map((order) => ({
        id: order.id,
        product_id: order.product_id,
        product_name: order.product_name,
        product_imageurl: order.product_imageurl,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        quantity: order.quantity,
        price: order.price,
        order_date: order.order_date,
        status: order.status,
        shipping_address: order.shipping_address,
        available_quantity: order.available_quantity,
      }));

      await client.query("COMMIT");
      res.status(200).json(orders);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      res.status(500).json({
        error: "Lỗi máy chủ nội bộ",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);
app.post(
  "/receive-order",
  checkAuth,
  checkRole(["Customer"]),
  async (req, res) => {
    const { orderId } = req.body;
    const customerId = req.user.id; // Lấy customerId từ thông tin người dùng đã xác thực
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Kiểm tra đơn hàng có tồn tại và thuộc về khách hàng này không
      const orderResult = await client.query(
        "SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND status = 'Shipped'",
        [orderId, customerId]
      );
      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: `Đơn hàng không tồn tại hoặc không thể nhận! Order ID: ${orderId} 😅`,
        });
      }
      const order = orderResult.rows[0];

      // Tìm lô hàng tương ứng
      const shipmentResult = await client.query(
        "SELECT * FROM shipments WHERE recipient_id = $1 AND recipient_type = 'Customer' AND status = 'In Transit' AND id IN (SELECT shipment_id FROM shipment_products WHERE product_id = $2)",
        [customerId, order.product_id]
      );
      if (shipmentResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Lô hàng không tồn tại hoặc không thể nhận! 😅",
        });
      }
      const shipment = shipmentResult.rows[0];

      // Cập nhật trạng thái lô hàng thành Delivered và ghi lại thời gian nhận
      await client.query(
        "UPDATE shipments SET status = 'Delivered', received_date = CURRENT_TIMESTAMP WHERE id = $1",
        [shipment.id]
      );

      // Cập nhật trạng thái đơn hàng thành Delivered
      await client.query(
        "UPDATE orders SET status = 'Delivered' WHERE id = $1",
        [orderId]
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: "Bạn đã nhận hàng thành công! 🎉",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi nhận đơn hàng:", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ nội bộ", details: error.message });
    } finally {
      client.release();
    }
  }
);
// ==== API ĐỒNG BỘ HỢP ĐỒNG CHO GOVERNMENT ====
app.post("/government/sync-contracts", checkAuth, checkRole(["Government"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let contractCount;
    try {
      contractCount = Number(await governmentRegulator.methods.contractCount().call());
    } catch (blockchainError) {
      return res.status(503).json({
        error: "Không thể kết nối đến blockchain",
        details: blockchainError.message,
        suggestion: "Vui lòng kiểm tra Hardhat node đang chạy trên http://127.0.0.1:8545/ và contract GovernmentRegulator đã được triển khai."
      });
    }

    const contractList = [];
    const farmIds = new Set();
    const provinces = new Set();

    if (contractCount === 0) {
      return res.status(200).json({
        message: "Không có hợp đồng nào để đồng bộ!",
        contracts: contractList,
      });
    }

    for (let i = 1; i <= contractCount; i++) {
      try {
        const contractData = await governmentRegulator.methods.checkContractStatus(i).call();
        const contract = {
          contractId: i,
          farmId: contractData.farmId,
          deliveryHubWalletAddress: contractData.agentAddress.toLowerCase(),
          creationDate: new Date(Number(contractData.creationDate) * 1000),
          expiryDate: new Date(Number(contractData.expiryDate) * 1000),
          totalQuantity: Number(contractData.totalQuantity),
          pricePerUnit: Number(web3.utils.fromWei(contractData.pricePerUnit, "ether")),
          terms: contractData.terms,
          isActive: contractData.isActive,
          isCompleted: contractData.isCompleted,
        };

        if (!contract.terms || contract.terms.trim() === "") {
          throw new Error(`Hợp đồng ID ${i} không có trường terms hợp lệ trên blockchain`);
        }

        contractList.push({
          ...contract,
          creationDate: contract.creationDate.getTime(),
          expiryDate: contract.expiryDate.getTime(),
        });

        await client.query(
          `
          INSERT INTO triparty_contracts (contract_id, farm_id, delivery_hub_wallet_address, creation_date, expiry_date, total_quantity, price_per_unit, terms, is_active, is_completed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (contract_id)
          DO UPDATE SET
            farm_id = EXCLUDED.farm_id,
            delivery_hub_wallet_address = EXCLUDED.delivery_hub_wallet_address,
            creation_date = EXCLUDED.creation_date,
            expiry_date = EXCLUDED.expiry_date,
            total_quantity = EXCLUDED.total_quantity,
            price_per_unit = EXCLUDED.price_per_unit,
            terms = EXCLUDED.terms,
            is_active = EXCLUDED.is_active,
            is_completed = EXCLUDED.is_completed
          `,
          [
            contract.contractId,
            contract.farmId,
            contract.deliveryHubWalletAddress,
            contract.creationDate,
            contract.expiryDate,
            contract.totalQuantity,
            contract.pricePerUnit,
            contract.terms,
            contract.isActive,
            contract.isCompleted,
          ]
        );

        farmIds.add(contract.farmId);
        const farmResult = await pool.query("SELECT location FROM farms WHERE farm_name = $1", [contract.farmId]);
        if (farmResult.rows.length > 0) {
          provinces.add(farmResult.rows[0].location);
        }
      } catch (err) {
        console.error(`Lỗi khi đồng bộ hợp đồng ID ${i}:`, err);
        continue;
      }
    }

    for (const farmId of farmIds) {
      try {
        await syncFarmStats(farmId);
      } catch (err) {
        console.error(`Lỗi khi đồng bộ thống kê farm ${farmId}:`, err);
      }
    }

    for (const province of provinces) {
      try {
        await syncProvinceStats(province);
      } catch (err) {
        console.error(`Lỗi khi đồng bộ thống kê tỉnh ${province}:`, err);
      }
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "Đồng bộ hợp đồng và thống kê thành công!",
      contracts: contractList,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi khi đồng bộ hợp đồng và thống kê:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
      suggestion: "Vui lòng kiểm tra log server để biết thêm chi tiết."
    });
  } finally {
    client.release();
  }
});
// ==== API CHO VAI TRÒ GOVERNMENT ====


// Lấy danh sách hợp đồng ba bên
app.get("/government/contracts", checkAuth, checkRole(["Government"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM triparty_contracts ORDER BY contract_id ASC");
    const contractList = result.rows.map((row) => ({
      contractId: row.contract_id,
      farmId: row.farm_id,
      deliveryHubWalletAddress: row.delivery_hub_wallet_address,
      creationDate: new Date(row.creation_date).getTime(),
      expiryDate: new Date(row.expiry_date).getTime(),
      totalQuantity: Number(row.total_quantity),
      pricePerUnit: row.price_per_unit.toString(),
      terms: row.terms,
      isActive: row.is_active,
      isCompleted: row.is_completed,
    }));

    res.status(200).json(contractList);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hợp đồng:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// Tạo hợp đồng ba bên
app.post("/government/create-contract", checkAuth, checkRole(["Government"]), async (req, res) => {
  const client = await pool.connect();
  try {
      await client.query("BEGIN");

      const { farmId, deliveryHubWalletAddress, validityPeriod, totalQuantity, pricePerUnit } = req.body;

      if (!farmId || !deliveryHubWalletAddress || !validityPeriod || !totalQuantity || !pricePerUnit) {
          throw new Error("Vui lòng cung cấp đầy đủ thông tin!");
      }

      if (!web3.utils.isAddress(deliveryHubWalletAddress)) {
          throw new Error("Địa chỉ ví của DeliveryHub không hợp lệ!");
      }

      const farmResult = await pool.query("SELECT * FROM farms WHERE farm_name = $1", [farmId]);
      if (farmResult.rows.length === 0) {
          throw new Error("Farm không tồn tại trong cơ sở dữ liệu!");
      }
      const farm = farmResult.rows[0];

      const producerResult = await pool.query("SELECT name FROM users WHERE id = $1", [farm.producer_id]);
      const farmOwnerName = producerResult.rows.length > 0 ? producerResult.rows[0].name : '[Chưa có tên chủ farm]';
      const farmLocation = farm.location || '[Chưa có địa chỉ farm]';

      const deliveryHubUserResult = await pool.query(
          "SELECT name FROM users WHERE LOWER(wallet_address) = LOWER($1) AND role = 'DeliveryHub'",
          [deliveryHubWalletAddress]
      );
      const deliveryHubName = deliveryHubUserResult.rows.length > 0 ? deliveryHubUserResult.rows[0].name : '[Chưa có tên Delivery Hub]';

      const validityPeriodSeconds = Number(validityPeriod) * 24 * 60 * 60;
      if (isNaN(validityPeriodSeconds) || validityPeriodSeconds <= 0) {
          throw new Error("Thời hạn hợp đồng không hợp lệ!");
      }

      const totalQty = Number(totalQuantity);
      if (isNaN(totalQty) || totalQty <= 0) {
          throw new Error("Tổng số lượng không hợp lệ!");
      }

      const price = Number(pricePerUnit);
      if (isNaN(price) || price <= 0) {
          throw new Error("Giá mỗi đơn vị không hợp lệ!");
      }

      const priceInWei = web3.utils.toWei(price.toString(), "ether");
      const normalizedDeliveryHubWalletAddress = deliveryHubWalletAddress.toLowerCase();
      const currentDate = new Date();
      const creationDateString = currentDate.toLocaleString('vi-VN');
      const expiryDate = new Date(currentDate.getTime() + validityPeriodSeconds * 1000);
      const expiryDateString = expiryDate.toLocaleString('vi-VN');

      const terms = `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------

HỢP ĐỒNG BA BÊN VỀ CUNG CẤP VÀ TIÊU THỤ NÔNG SẢN
Số: _____/HĐBB/${currentDate.getFullYear()}

Hôm nay, ngày ${currentDate.getDate()} tháng ${currentDate.getMonth() + 1} năm ${currentDate.getFullYear()}, tại _____, chúng tôi gồm:

1. BÊN A: CƠ QUAN QUẢN LÝ NHÀ NƯỚC (GOVERNMENT)
 - Đại diện: Cơ quan quản lý nông nghiệp
 - Địa chỉ: [Địa chỉ cơ quan nhà nước]
 - Đại diện: Ông/Bà [Tên người đại diện]

2. BÊN B: BÊN CUNG CẤP (NÔNG TRẠI - FARM)
 - Tên nông trại/Chủ sở hữu: ${farmOwnerName}
 - Mã nông trại: ${farmId}
 - Địa chỉ: ${farmLocation}
 - Đại diện: Ông/Bà ${farmOwnerName}

3. BÊN C: BÊN THU MUA VÀ PHÂN PHỐI (DELIVERY HUB)
 - Tên đơn vị/Cá nhân: ${deliveryHubName}
 - Địa chỉ ví MetaMask: ${normalizedDeliveryHubWalletAddress}
 - Đại diện: Ông/Bà ${deliveryHubName}

Các bên cùng thỏa thuận ký kết hợp đồng với các điều khoản sau:

Điều 1: Đối tượng và Nội dung Hợp đồng
1.1. Bên B đồng ý cung cấp và Bên C đồng ý thu mua sản phẩm nông sản với thông tin:
 - Tổng sản lượng cam kết: ${totalQty} đơn vị.
1.2. Mục đích: Phân phối và tiêu thụ sản phẩm trên thị trường.
1.3. Bên A giám sát việc tuân thủ hợp đồng và đảm bảo minh bạch qua Blockchain.

Điều 2: Chất lượng và Quy cách Sản phẩm
2.1. Bên B cam kết sản phẩm đáp ứng tiêu chuẩn chất lượng theo quy định.
2.2. Bên C có quyền kiểm tra và từ chối nếu sản phẩm không đạt yêu cầu.

Điều 3: Thời gian, Địa điểm và Phương thức Giao nhận
3.1. Thời gian giao hàng: Theo thỏa thuận.
3.2. Địa điểm: Tại kho của Bên C hoặc nơi hai bên thống nhất.
3.3. Phương thức: Bên B chịu chi phí vận chuyển, trừ khi có thỏa thuận khác.

Điều 4: Giá cả và Phương thức Thanh toán
4.1. Đơn giá: ${price.toLocaleString('vi-VN')} ETH/đơn vị.
4.2. Tổng giá trị: ${(totalQty * price).toLocaleString('vi-VN')} ETH.
4.3. Thanh toán qua hợp đồng thông minh trên Blockchain.

Điều 5: Thời hạn Hợp đồng
5.1. Hiệu lực: Từ ${creationDateString} đến ${expiryDateString}.
5.2. Thanh lý: Khi hoàn tất giao hàng và thanh toán.

Điều 6: Quyền và Nghĩa vụ của các Bên
6.1. Bên A: Giám sát, hỗ trợ giải quyết tranh chấp.
6.2. Bên B: Cung cấp sản phẩm đúng chất lượng, nhận thanh toán.
6.3. Bên C: Nhận sản phẩm, thanh toán đúng hạn, phân phối.

Điều 7: Bảo mật và Công nghệ Blockchain
7.1. Bảo mật thông tin, trừ dữ liệu công khai trên Blockchain.
7.2. Giao dịch được ghi nhận trên Blockchain để đảm bảo minh bạch.

Điều 8: Bất khả kháng và Tranh chấp
8.1. Bất khả kháng theo pháp luật Việt Nam.
8.2. Tranh chấp giải quyết bằng thương lượng hoặc tại Tòa án.

Điều 9: Điều khoản Chung
9.1. Hợp đồng lập thành 03 bản, mỗi bên giữ 01 bản.
9.2. Sửa đổi phải có văn bản xác nhận của các bên.
9.3. Hiệu lực khi được ký bởi cả ba bên.

Các bên đồng ý ký tên/xác nhận dưới đây.
      `.trim();

      const accounts = await web3.eth.getAccounts();
      const governmentAccount = accounts[0];

      console.log("Tạo hợp đồng với thông tin:", {
          farmId,
          deliveryHubWalletAddress: normalizedDeliveryHubWalletAddress,
          validityPeriodSeconds,
          totalQuantity: totalQty,
          priceInWei,
          terms,
          governmentAccount,
      });

      let gasEstimate;
      try {
          await governmentRegulator.methods
              .createTripartyContract(
                  farmId,
                  normalizedDeliveryHubWalletAddress,
                  validityPeriodSeconds,
                  totalQty,
                  priceInWei,
                  terms
              )
              .call({ from: governmentAccount });
          gasEstimate = await governmentRegulator.methods
              .createTripartyContract(
                  farmId,
                  normalizedDeliveryHubWalletAddress,
                  validityPeriodSeconds,
                  totalQty,
                  priceInWei,
                  terms
              )
              .estimateGas({ from: governmentAccount });
          console.log("Ước tính gas thành công:", gasEstimate);
      } catch (gasError) {
          console.error("Lỗi khi ước tính gas:", gasError);
          let errorMessage = "Không thể ước tính gas cho giao dịch.";
          if (gasError.message.includes("revert")) {
              errorMessage += " Kiểm tra các điều kiện trong smart contract.";
          } else if (gasError.message.includes("insufficient funds")) {
              errorMessage = "Không đủ ETH trong tài khoản.";
          } else {
              errorMessage += ` Chi tiết: ${gasError.message}`;
          }
          throw new Error(errorMessage);
      }

      let tx;
      try {
          const adjustedGas = BigInt(gasEstimate) + (BigInt(gasEstimate) / BigInt(5));
          tx = await governmentRegulator.methods
              .createTripartyContract(
                  farmId,
                  normalizedDeliveryHubWalletAddress,
                  validityPeriodSeconds,
                  totalQty,
                  priceInWei,
                  terms
              )
              .send({ from: governmentAccount, gas: adjustedGas.toString() });
          console.log("Giao dịch gửi thành công, hash:", tx.transactionHash);
      } catch (txError) {
          console.error("Lỗi khi gửi giao dịch blockchain:", txError);
          let errorMessage = "Giao dịch blockchain thất bại.";
          if (txError.message.includes("User denied transaction signature")) {
              errorMessage = "Người dùng từ chối ký giao dịch.";
          } else if (txError.receipt) {
              errorMessage += ` Trạng thái: ${txError.receipt.status}.`;
          } else {
              errorMessage += ` Chi tiết: ${txError.message}`;
          }
          throw new Error(errorMessage);
      }

      if (!tx || !tx.status) {
          throw new Error(`Giao dịch tạo hợp đồng thất bại! Hash: ${tx?.transactionHash || 'Không có hash'}`);
      }

      const contractId = Number(await governmentRegulator.methods.contractCount().call());
      const contractDataBlockchain = await governmentRegulator.methods.checkContractStatus(contractId).call();

      const newContractDB = {
          contractId,
          farmId: contractDataBlockchain.farmId,
          deliveryHubWalletAddress: contractDataBlockchain.agentAddress.toLowerCase(),
          creationDate: new Date(Number(contractDataBlockchain.creationDate) * 1000),
          expiryDate: new Date(Number(contractDataBlockchain.expiryDate) * 1000),
          totalQuantity: Number(contractDataBlockchain.totalQuantity),
          pricePerUnit: Number(web3.utils.fromWei(contractDataBlockchain.pricePerUnit, "ether")),
          terms: contractDataBlockchain.terms,
          isActive: contractDataBlockchain.isActive,
          isCompleted: contractDataBlockchain.isCompleted,
          farm_signature: null,
          agent_signature: null,
          government_signature: null,
          is_farm_signed: false,
          is_agent_signed: false,
          is_government_signed: false,
      };

      await client.query(
          `
          INSERT INTO triparty_contracts (
              contract_id, farm_id, delivery_hub_wallet_address, creation_date, expiry_date,
              total_quantity, price_per_unit, terms, is_active, is_completed,
              farm_signature, agent_signature, government_signature,
              is_farm_signed, is_agent_signed, is_government_signed
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          `,
          [
              newContractDB.contractId,
              newContractDB.farmId,
              newContractDB.deliveryHubWalletAddress,
              newContractDB.creationDate,
              newContractDB.expiryDate,
              newContractDB.totalQuantity,
              newContractDB.pricePerUnit,
              newContractDB.terms,
              newContractDB.isActive,
              newContractDB.isCompleted,
              newContractDB.farm_signature,
              newContractDB.agent_signature,
              newContractDB.government_signature,
              newContractDB.is_farm_signed,
              newContractDB.is_agent_signed,
              newContractDB.is_government_signed,
          ]
      );

      try {
          await syncFarmStats(farmId);
      } catch (farmStatError) {
          console.error(`Lỗi khi đồng bộ thống kê farm ${farmId}:`, farmStatError);
      }

      const farmLocationResult = await pool.query("SELECT location FROM farms WHERE farm_name = $1", [farmId]);
      if (farmLocationResult.rows.length > 0) {
          const province = farmLocationResult.rows[0].location;
          try {
              await syncProvinceStats(province);
          } catch (provinceStatError) {
              console.error(`Lỗi khi đồng bộ thống kê tỉnh ${province}:`, provinceStatError);
          }
      }

      await client.query("COMMIT");
      res.status(200).json({
          message: "Tạo hợp đồng ba bên thành công!",
          contractId,
          transactionHash: tx.transactionHash,
      });
  } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi tạo hợp đồng ba bên:", error);
      res.status(500).json({
          error: "Lỗi khi tạo hợp đồng",
          details: error.message || "Lỗi không xác định",
          suggestion: "Kiểm tra kết nối blockchain, số dư tài khoản, và dữ liệu đầu vào.",
      });
  } finally {
      client.release();
  }
});

// Lấy thống kê farm
app.get("/government/farm-stats/:farmId", checkAuth, checkRole(["Government"]), async (req, res) => {
  const { farmId } = req.params;

  try {
    // Kiểm tra trong database trước
    const farmStatsResult = await pool.query(
      "SELECT * FROM farm_statistics WHERE farm_id = $1",
      [farmId]
    );

    let stats;
    if (farmStatsResult.rows.length > 0) {
      stats = {
        farmId,
        totalFruitHarvested: Number(farmStatsResult.rows[0].total_fruit_harvested),
        totalContractsCreated: Number(farmStatsResult.rows[0].total_contracts_created),
        totalContractsCompleted: Number(farmStatsResult.rows[0].total_contracts_completed),
        lastUpdate: Number(farmStatsResult.rows[0].last_update),
      };
    } else {
      // Nếu không có trong database, đồng bộ từ blockchain
      stats = await syncFarmStats(farmId);
    }

    if (stats.totalContractsCreated === 0) {
      return res.status(404).json({
        message: `Không tìm thấy dữ liệu thống kê cho farm ${farmId}`,
      });
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê farm:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});

// Lấy thống kê tỉnh
app.get("/government/province-stats/:province", checkAuth, checkRole(["Government"]), async (req, res) => {
  const { province } = req.params;

  try {
    // Kiểm tra trong database trước
    const provinceStatsResult = await pool.query(
      "SELECT * FROM province_statistics WHERE province = $1",
      [province]
    );

    let stats;
    if (provinceStatsResult.rows.length > 0) {
      stats = {
        province,
        totalFruitHarvested: Number(provinceStatsResult.rows[0].total_fruit_harvested),
        totalContractsCreated: Number(provinceStatsResult.rows[0].total_contracts_created),
        totalContractsCompleted: Number(provinceStatsResult.rows[0].total_contracts_completed),
        farmCount: Number(provinceStatsResult.rows[0].farm_count),
        lastUpdate: Number(provinceStatsResult.rows[0].last_update),
      };
    } else {
      // Nếu không có trong database, đồng bộ từ blockchain
      stats = await syncProvinceStats(province);
    }

    if (!stats || stats.farmCount === 0) {
      return res.status(404).json({
        message: `Không tìm thấy dữ liệu thống kê cho tỉnh ${province}`,
      });
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê tỉnh:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: error.message });
  }
});
// Đồng bộ thống kê farm từ blockchain vào database
const syncFarmStats = async (farmId) => {
  try {
    const farmStat = await governmentRegulator.methods.getFarmStatistics(farmId).call();
    const lastUpdateValue = Number(farmStat.lastStatisticsUpdate);
    const stats = {
      farmId,
      totalFruitHarvested: Number(farmStat.totalFruitHarvested),
      totalContractsCreated: Number(farmStat.totalContractsCreated),
      totalContractsCompleted: Number(farmStat.totalContractsCompleted),
      lastUpdate: isNaN(lastUpdateValue) ? 0 : lastUpdateValue * 1000,
    };

    await pool.query(
      `
      INSERT INTO farm_statistics (farm_id, total_fruit_harvested, total_contracts_created, total_contracts_completed, last_update)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (farm_id)
      DO UPDATE SET
        total_fruit_harvested = EXCLUDED.total_fruit_harvested,
        total_contracts_created = EXCLUDED.total_contracts_created,
        total_contracts_completed = EXCLUDED.total_contracts_completed,
        last_update = EXCLUDED.last_update
      `,
      [
        stats.farmId,
        stats.totalFruitHarvested,
        stats.totalContractsCreated,
        stats.totalContractsCompleted,
        stats.lastUpdate,
      ]
    );

    return stats;
  } catch (error) {
    console.error(`Lỗi khi đồng bộ thống kê farm ${farmId}:`, error);
    throw new Error(`Không thể đồng bộ thống kê farm ${farmId}: ${error.message}`);
  }
};

// Đồng bộ thống kê tỉnh từ blockchain vào database
const syncProvinceStats = async (province) => {
  try {
    const provinceStat = await governmentRegulator.methods.getProvinceStatistics(province).call();
    const lastUpdateValue = Number(provinceStat.lastStatisticsUpdate);
    const stats = {
      province,
      totalFruitHarvested: Number(provinceStat.totalFruitHarvested),
      totalContractsCreated: Number(provinceStat.totalContractsCreated),
      totalContractsCompleted: Number(provinceStat.totalContractsCompleted),
      farmCount: Number(provinceStat.farmCount),
      lastUpdate: isNaN(lastUpdateValue) ? 0 : lastUpdateValue * 1000,
    };

    await pool.query(
      `
      INSERT INTO province_statistics (province, total_fruit_harvested, total_contracts_created, total_contracts_completed, farm_count, last_update)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (province)
      DO UPDATE SET
        total_fruit_harvested = EXCLUDED.total_fruit_harvested,
        total_contracts_created = EXCLUDED.total_contracts_created,
        total_contracts_completed = EXCLUDED.total_contracts_completed,
        farm_count = EXCLUDED.farm_count,
        last_update = EXCLUDED.last_update
      `,
      [
        stats.province,
        stats.totalFruitHarvested,
        stats.totalContractsCreated,
        stats.totalContractsCompleted,
        stats.farmCount,
        stats.lastUpdate,
      ]
    );

    return stats;
  } catch (error) {
    console.error(`Lỗi khi đồng bộ thống kê tỉnh ${province}:`, error);
    throw new Error(`Không thể đồng bộ thống kê tỉnh ${province}: ${error.message}`);
  }
};
// API lấy danh sách farm
app.get("/government/farms", checkAuth, checkRole(["Government"]), async (req, res) => {
  try {
    const farmsResult = await pool.query("SELECT farm_name FROM farms");
    const farms = farmsResult.rows.map(row => row.farm_name);
    if (farms.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy farm nào trong cơ sở dữ liệu",
        suggestion: "Vui lòng đăng ký farm trước bằng API /farm"
      });
    }
    res.status(200).json(farms);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách farm:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
      suggestion: "Vui lòng kiểm tra log server để biết thêm chi tiết."
    });
  }
});

// API lấy danh sách tỉnh từ bảng farms
app.get("/government/provinces", checkAuth, checkRole(["Government"]), async (req, res) => {
  try {
    const provincesResult = await pool.query("SELECT DISTINCT location FROM farms");
    const provinces = provincesResult.rows.map(row => row.location);
    if (provinces.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tỉnh nào trong cơ sở dữ liệu",
        suggestion: "Vui lòng đăng ký farm với thông tin tỉnh trước bằng API /farm"
      });
    }
    res.status(200).json(provinces);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tỉnh:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
      suggestion: "Vui lòng kiểm tra log server để biết thêm chi tiết."
    });
  }
});

// API tạo và tải PDF hợp đồng
app.get("/government/contract/pdf/:contractId", checkAuth, checkRole(["Government"]), async (req, res) => {
  try {
      const { contractId } = req.params;

      const contractResult = await pool.query(
          `
          SELECT c.*,
                 f.farm_name as farm_id,
                 COALESCE(u_farm.name, '[Chưa có tên]') as farm_owner_name,
                 f.location as farm_location,
                 COALESCE(u_hub.name, '[Chưa có tên]') as delivery_hub_name
          FROM triparty_contracts c
          LEFT JOIN farms f ON c.farm_id = f.farm_name
          LEFT JOIN users u_farm ON f.producer_id = u_farm.id
          LEFT JOIN users u_hub ON LOWER(c.delivery_hub_wallet_address) = LOWER(u_hub.wallet_address) AND u_hub.role = 'DeliveryHub'
          WHERE c.contract_id = $1
          `,
          [contractId]
      );

      if (contractResult.rows.length === 0) {
          return res.status(404).json({
              error: `Hợp đồng với ID ${contractId} không tồn tại`,
              suggestion: "Vui lòng kiểm tra lại ID hợp đồng",
          });
      }
      const contract = contractResult.rows[0];

      const filename = `Hop_dong_ba_ben_${contract.contract_id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      console.log(`Bắt đầu tạo PDF chưa ký cho hợp đồng ${contractId}`);
      generateContractPDF(contract, false, res);

  } catch (error) {
      console.error("Lỗi khi tạo PDF hợp đồng chưa ký:", error);
      if (!res.headersSent) {
          res.status(500).json({
              error: "Lỗi máy chủ nội bộ khi tạo PDF",
              details: error.message,
          });
      }
  }
});
// API lấy danh sách hợp đồng của người dùng
app.get("/contracts", checkAuth, async (req, res) => {
  console.log("Nhận yêu cầu đến /contracts");
  console.log("Địa chỉ ví người dùng:", req.user.wallet_address);
  console.log("Vai trò người dùng:", req.user.role);

  try {
    const userAddress = req.user.wallet_address;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!userAddress) {
      console.log("userAddress không tồn tại hoặc undefined");
      return res.status(401).json({ error: "Địa chỉ ví người dùng không hợp lệ!" });
    }

    let query;
    let params;

    if (userRole === "Government" || userRole === "Admin") {
      query = "SELECT * FROM triparty_contracts";
      params = [];
    } else if (userRole === "Farm" || userRole === "Producer") {
      const farmCheck = await pool.query(
        "SELECT * FROM farms WHERE producer_id = $1",
        [userId]
      );
      console.log("Farm check result:", farmCheck.rows);

      if (farmCheck.rows.length === 0) {
        return res.status(200).json([]);
      }

      query = `
        SELECT tc.*
        FROM triparty_contracts tc
        JOIN farms f ON tc.farm_id = f.farm_name
        WHERE f.producer_id = $1
      `;
      params = [userId];
    } else if (userRole === "Agent" || userRole === "DeliveryHub") {
      // Chuẩn hóa địa chỉ ví bằng cách so sánh dạng chữ thường
      query = "SELECT * FROM triparty_contracts WHERE LOWER(delivery_hub_wallet_address) = LOWER($1)";
      params = [userAddress];
    } else {
      query = "SELECT * FROM triparty_contracts";
      params = [];
    }

    console.log("Thực thi truy vấn:", query, "với tham số:", params);
    const contractsResult = await pool.query(query, params);
    console.log("Hợp đồng lấy được:", contractsResult.rows);

    if (contractsResult.rows.length === 0) {
      console.log("Không tìm thấy hợp đồng nào cho người dùng này.");
    }

    res.status(200).json(contractsResult.rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hợp đồng:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message || "Không có chi tiết lỗi",
    });
  }
});
// API ký hợp đồng
app.post("/contract/sign/:contractId", checkAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { contractId } = req.params;
    const { role, signature } = req.body;
    const userAddress = req.user.wallet_address;

    console.log("Nhận yêu cầu ký hợp đồng:", { contractId, role, signature, userAddress });

    const contractResult = await client.query(
      "SELECT * FROM triparty_contracts WHERE contract_id = $1",
      [contractId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error(`Hợp đồng với ID ${contractId} không tồn tại`);
    }

    const contract = contractResult.rows[0];

    let signatureField, signedField;
    if (role === "Farm" || role === "Producer") {
      const farmResult = await client.query(
        "SELECT * FROM farms WHERE farm_name = $1 AND producer_id = $2",
        [contract.farm_id, req.user.id]
      );
      if (farmResult.rows.length === 0) {
        throw new Error("Bạn không có quyền ký hợp đồng này!");
      }
      signatureField = "farm_signature";
      signedField = "is_farm_signed";
    } else if (role === "Agent" || role === "DeliveryHub") {
      if (contract.delivery_hub_wallet_address.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error("Bạn không có quyền ký hợp đồng này!");
      }
      signatureField = "agent_signature";
      signedField = "is_agent_signed";
    } else if (role === "Government") {
      signatureField = "government_signature";
      signedField = "is_government_signed";
    } else {
      throw new Error("Vai trò không hợp lệ!");
    }

    if (contract[signedField]) {
      throw new Error("Bạn đã ký hợp đồng này!");
    }

    await client.query(
      `UPDATE triparty_contracts SET ${signatureField} = $1, ${signedField} = $2 WHERE contract_id = $3`,
      [signature, true, contractId]
    );

    const updatedContractResult = await client.query(
      "SELECT * FROM triparty_contracts WHERE contract_id = $1",
      [contractId]
    );
    const updatedContract = updatedContractResult.rows[0];

    if (updatedContract.is_farm_signed && updatedContract.is_agent_signed && updatedContract.is_government_signed) {
      await client.query(
        "UPDATE triparty_contracts SET is_completed = $1 WHERE contract_id = $2",
        [true, contractId]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Ký hợp đồng thành công!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi khi ký hợp đồng:", error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// API tạo PDF đã ký
app.get("/contract/signed/pdf/:contractId", checkAuth, async (req, res) => {
  try {
      const { contractId } = req.params;

      const contractResult = await pool.query(
          `
          SELECT c.*,
                 f.farm_name as farm_id,
                 COALESCE(u_farm.name, '[Chưa có tên]') as farm_owner_name,
                 f.location as farm_location,
                 COALESCE(u_hub.name, '[Chưa có tên]') as delivery_hub_name
          FROM triparty_contracts c
          LEFT JOIN farms f ON c.farm_id = f.farm_name
          LEFT JOIN users u_farm ON f.producer_id = u_farm.id
          LEFT JOIN users u_hub ON LOWER(c.delivery_hub_wallet_address) = LOWER(u_hub.wallet_address) AND u_hub.role = 'DeliveryHub'
          WHERE c.contract_id = $1
          `,
          [contractId]
      );

      if (contractResult.rows.length === 0) {
          return res.status(404).json({
              error: `Hợp đồng với ID ${contractId} không tồn tại`,
          });
      }
      const contract = contractResult.rows[0];

      if (!contract.is_farm_signed || !contract.is_agent_signed || !contract.is_government_signed) {
          return res.status(400).json({
              error: "Hợp đồng chưa được ký bởi tất cả các bên!",
          });
      }

      const filename = `Hop_dong_ba_ben_${contract.contract_id}_Da_ky.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      console.log(`Bắt đầu tạo PDF đã ký cho hợp đồng ${contractId}`);
      generateContractPDF(contract, true, res);

  } catch (error) {
      console.error("Lỗi khi tạo PDF hợp đồng đã ký:", error);
      if (!res.headersSent) {
          res.status(500).json({
              error: "Lỗi máy chủ nội bộ khi tạo PDF",
              details: error.message,
          });
      }
  }
});
// Phục vụ file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Khởi động server
app.listen(3000, () => {
  console.log("Server đang chạy trên cổng 3000");
});
