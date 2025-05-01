const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg"); // Thêm thư viện pg để kết nối PostgreSQL
require("dotenv").config(); // Thêm dotenv để đọc file .env

// Cấu hình kết nối cơ sở dữ liệu từ file .env
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "fruit_supply_chain",
  password: process.env.DB_PASSWORD || "quan2003",
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function main() {
  // Kết nối với Hardhat node
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const [deployer, farmOwner, agent] = await hre.ethers.getSigners();
  console.log("Interacting with contracts using account:", deployer.address);
  console.log("Farm owner address:", farmOwner.address);
  console.log("Agent address:", agent.address);

  // Kiểm tra số dư ETH của các tài khoản
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(await provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log(
    "Farm owner balance:",
    hre.ethers.formatEther(await provider.getBalance(farmOwner.address)),
    "ETH"
  );
  console.log(
    "Agent balance:",
    hre.ethers.formatEther(await provider.getBalance(agent.address)),
    "ETH"
  );

  // Triển khai hợp đồng FruitSupplyChain
  console.log("\nDeploying FruitSupplyChain...");
  const FruitSupplyChain = await hre.ethers.getContractFactory(
    "FruitSupplyChain",
    deployer
  );
  const fruitSupplyChain = await FruitSupplyChain.deploy();
  await fruitSupplyChain.waitForDeployment();
  const fruitSupplyChainAddress = await fruitSupplyChain.getAddress();
  console.log("FruitSupplyChain deployed to:", fruitSupplyChainAddress);

  // Kiểm tra owner của FruitSupplyChain
  const fruitSupplyChainOwner = await fruitSupplyChain.owner();
  console.log("Owner of FruitSupplyChain:", fruitSupplyChainOwner);

  // Triển khai hợp đồng GovernmentRegulator
  console.log("\nDeploying GovernmentRegulator...");
  const GovernmentRegulator = await hre.ethers.getContractFactory(
    "GovernmentRegulator",
    deployer
  );
  const governmentRegulator = await GovernmentRegulator.deploy(
    fruitSupplyChainAddress
  );
  await governmentRegulator.waitForDeployment();
  const governmentRegulatorAddress = await governmentRegulator.getAddress();
  console.log("GovernmentRegulator deployed to:", governmentRegulatorAddress);

  // Lưu địa chỉ hợp đồng vào file contract-addresses.json
  const contractAddresses = {
    FruitSupplyChain: fruitSupplyChainAddress,
    GovernmentRegulator: governmentRegulatorAddress,
  };
  fs.writeFileSync(
    "contract-addresses.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("Contract addresses saved to contract-addresses.json");

  try {
    // 1. Lấy danh sách farm từ cơ sở dữ liệu
    console.log("\n--- Lấy danh sách farm từ cơ sở dữ liệu ---");
    const farmsResult = await pool.query(
      "SELECT farm_name, location, weather_condition, quality, current_conditions FROM farms"
    );
    const farms = farmsResult.rows;

    if (farms.length === 0) {
      console.log(
        "Không tìm thấy farm nào trong cơ sở dữ liệu. Vui lòng đăng ký farm trước!"
      );
      return;
    }

    for (const farm of farms) {
      const farmId = farm.farm_name;
      const location = farm.location;
      const climate = farm.weather_condition;
      const soil = farm.quality;
      const currentConditions = farm.current_conditions;

      console.log(`\n--- Đăng ký farm ${farmId} ---`);
      const isFarmRegistered = await fruitSupplyChain.isFarmRegistered(farmId);
      if (isFarmRegistered) {
        console.log(`Farm ${farmId} đã tồn tại, bỏ qua bước đăng ký`);
      } else {
        const tx = await fruitSupplyChain
          .connect(farmOwner)
          .registerFarm(farmId, location, climate, soil, currentConditions);
        await tx.wait();
        console.log(`Farm ${farmId} đã được đăng ký thành công`);
      }

      // Kiểm tra farm đã đăng ký
      const farmData = await fruitSupplyChain.getFarmData(farmId);
      console.log("Thông tin farm:", {
        location: farmData[0],
        climate: farmData[1],
        soil: farmData[2],
        lastUpdated: new Date(Number(farmData[3]) * 1000).toLocaleString(),
        currentConditions: farmData[4],
        owner: farmData[5],
        fruitIds: farmData[6].map((id) => Number(id)),
      });

      // 2. Tạo hợp đồng ba bên cho farm
      console.log(`\n--- Tạo hợp đồng ba bên cho farm ${farmId} ---`);
      const validityPeriod = 30 * 24 * 60 * 60; // 30 ngày tính bằng giây

      // Lấy tổng số lượng từ bảng products (nếu có sản phẩm liên quan đến farm)
      const productsResult = await pool.query(
        "SELECT COALESCE(SUM(quantity), 0) as total_quantity FROM products WHERE farm_id = (SELECT id FROM farms WHERE farm_name = $1)",
        [farmId]
      );
      const totalQuantity =
        productsResult.rows[0].total_quantity > 0
          ? Number(productsResult.rows[0].total_quantity)
          : 5000; // Nếu không có sản phẩm, dùng giá trị mặc định tạm thời

      // Lấy giá từ bảng products (nếu có), hoặc dùng giá mặc định
      const priceResult = await pool.query(
        "SELECT COALESCE(AVG(price), 0) as avg_price FROM products WHERE farm_id = (SELECT id FROM farms WHERE farm_name = $1)",
        [farmId]
      );
      const pricePerUnit =
        priceResult.rows[0].avg_price > 0
          ? hre.ethers.parseEther(priceResult.rows[0].avg_price.toString())
          : hre.ethers.parseEther("0.01");

      const terms = `Hợp đồng mua bán trái cây từ farm ${farmId}`; // Có thể lấy từ yêu cầu người dùng trong thực tế

      const contractCountBefore = Number(
        await governmentRegulator.contractCount()
      );
      const tx = await governmentRegulator
        .connect(deployer)
        .createTripartyContract(
          farmId,
          agent.address,
          validityPeriod,
          totalQuantity,
          pricePerUnit,
          terms
        );
      await tx.wait();

      const contractId = contractCountBefore + 1;
      console.log(`Hợp đồng ba bên với ID ${contractId} đã được tạo`);

      // Kiểm tra thông tin hợp đồng
      const contractStatus = await governmentRegulator.checkContractStatus(
        contractId
      );
      console.log("Thông tin hợp đồng:", {
        farmId: contractStatus.farmId,
        agentAddress: contractStatus.agentAddress,
        creationDate: new Date(
          Number(contractStatus.creationDate) * 1000
        ).toLocaleString(),
        expiryDate: new Date(
          Number(contractStatus.expiryDate) * 1000
        ).toLocaleString(),
        totalQuantity: Number(contractStatus.totalQuantity),
        pricePerUnit: hre.ethers.formatEther(contractStatus.pricePerUnit),
        isActive: contractStatus.isActive,
        isCompleted: contractStatus.isCompleted,
      });

      // 3. Các bên ký hợp đồng
      console.log("\n--- Ký hợp đồng ---");
      await governmentRegulator.connect(farmOwner).signContract(contractId);
      console.log("Farm owner đã ký hợp đồng");

      await governmentRegulator.connect(agent).signContract(contractId);
      console.log("Agent đã ký hợp đồng");

      console.log("Government đã ký hợp đồng khi tạo");

      const updatedContractStatus =
        await governmentRegulator.checkContractStatus(contractId);
      console.log("Trạng thái hợp đồng sau khi ký:", {
        isActive: updatedContractStatus.isActive,
        isCompleted: updatedContractStatus.isCompleted,
      });

      // 4. Ghi nhận giao hàng
      console.log("\n--- Ghi nhận giao hàng ---");
      const deliveryQuantity = Number(updatedContractStatus.totalQuantity);
      const deliveryTx = await governmentRegulator
        .connect(farmOwner)
        .recordDelivery(contractId, deliveryQuantity);
      await deliveryTx.wait();
      console.log(`Đã ghi nhận giao ${deliveryQuantity}kg trái cây`);

      // 5. Kiểm tra thống kê
      console.log("\n--- Thống kê farm ---");
      const farmStats = await governmentRegulator.getFarmStatistics(farmId);
      console.log("Thống kê farm:", {
        totalFruitHarvested: Number(farmStats.totalFruitHarvested),
        totalContractsCreated: Number(farmStats.totalContractsCreated),
        totalContractsCompleted: Number(farmStats.totalContractsCompleted),
        lastUpdate: new Date(
          Number(farmStats.lastStatisticsUpdate) * 1000
        ).toLocaleString(),
      });

      console.log("\n--- Thống kê agent ---");
      const agentStats = await governmentRegulator.getAgentStatistics(
        agent.address
      );
      console.log("Thống kê agent:", {
        totalQuantityPurchased: Number(agentStats.totalQuantityPurchased),
        totalContractsCreated: Number(agentStats.totalContractsCreated),
        totalContractsCompleted: Number(agentStats.totalContractsCompleted),
        lastUpdate: new Date(
          Number(agentStats.lastStatisticsUpdate) * 1000
        ).toLocaleString(),
      });

      console.log(`\n--- Thống kê tỉnh ${location} ---`);
      const farmCountTx = await governmentRegulator
        .connect(deployer)
        .updateProvinceFarmCount(location);
      await farmCountTx.wait();

      const provinceStats = await governmentRegulator.getProvinceStatistics(
        location
      );
      console.log(`Thống kê tỉnh ${location}:`, {
        totalFruitHarvested: Number(provinceStats.totalFruitHarvested),
        totalContractsCreated: Number(provinceStats.totalContractsCreated),
        totalContractsCompleted: Number(provinceStats.totalContractsCompleted),
        farmCount: Number(provinceStats.farmCount),
        lastUpdate: new Date(
          Number(provinceStats.lastStatisticsUpdate) * 1000
        ).toLocaleString(),
      });
    }
  } catch (error) {
    console.error("Lỗi khi tương tác với hợp đồng:", error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.stack) console.error("Stack trace:", error.stack);
    throw error;
  } finally {
    await pool.end(); // Đóng kết nối cơ sở dữ liệu
  }
}

main()
  .then(() => {
    console.log("\nInteraction completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error.message);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.stack) console.error("Stack trace:", error.stack);
    process.exit(1);
  });
