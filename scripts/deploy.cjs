const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "fruit_supply_chain",
  password: process.env.DB_PASSWORD || "quan2003",
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function checkNodeStatus(provider) {
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log("Hardhat node đang chạy, block number:", blockNumber);
  } catch (error) {
    throw new Error(
      "Không thể kết nối tới node Hardhat. Vui lòng chạy 'npx hardhat node'!"
    );
  }
}

async function checkBalanceAndGas(signer, contract, method, args) {
  const balance = await signer.provider.getBalance(signer.address);
  let gasEstimate;
  try {
    gasEstimate = await contract[method].estimateGas(...args);
  } catch (error) {
    throw new Error(`Không thể ước tính gas: ${error.message}`);
  }
  const feeData = await signer.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) {
    throw new Error("Không thể lấy thông tin gas price từ provider!");
  }

  const safeGasEstimate = (gasEstimate * BigInt(120)) / BigInt(100);
  const gasCost = safeGasEstimate * gasPrice;

  if (balance < gasCost) {
    throw new Error(
      `Số dư ETH không đủ! Cần ${hre.ethers.formatEther(
        gasCost
      )} ETH, hiện có ${hre.ethers.formatEther(balance)} ETH`
    );
  }
  return { gasEstimate: safeGasEstimate, gasPrice };
}

async function main() {
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  await checkNodeStatus(provider);

  const [deployer, farmOwner, agent] = await hre.ethers.getSigners();
  console.log("Interacting with contracts using account:", deployer.address);
  console.log("Farm owner address:", farmOwner.address);
  console.log("Agent address:", agent.address);

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

  console.log("\nDeploying FruitSupplyChain...");
  const FruitSupplyChain = await hre.ethers.getContractFactory(
    "FruitSupplyChain",
    deployer
  );
  const fruitSupplyChain = await FruitSupplyChain.deploy();
  await fruitSupplyChain.waitForDeployment();
  const fruitSupplyChainAddress = await fruitSupplyChain.getAddress();
  console.log("FruitSupplyChain deployed to:", fruitSupplyChainAddress);

  const fruitSupplyChainOwner = await fruitSupplyChain.owner();
  console.log("Owner of FruitSupplyChain:", fruitSupplyChainOwner);

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
      const location = farm.location || "Unknown";
      const climate = farm.weather_condition || "Unknown";
      const soil = farm.quality || "Unknown";
      const currentConditions = farm.current_conditions || "Unknown";

      if (!farmId) {
        console.warn(
          `Farm không có farm_name, bỏ qua: ${JSON.stringify(farm)}`
        );
        continue;
      }

      console.log(`\n--- Đăng ký farm ${farmId} ---`);
      const isFarmRegistered = await fruitSupplyChain.isFarmRegistered(farmId);
      if (isFarmRegistered) {
        console.log(`Farm ${farmId} đã tồn tại, bỏ qua bước đăng ký`);
      } else {
        const args = [farmId, location, climate, soil, currentConditions];
        await checkBalanceAndGas(
          farmOwner,
          fruitSupplyChain,
          "registerFarm",
          args
        );
        const tx = await fruitSupplyChain
          .connect(farmOwner)
          .registerFarm(...args, { gasLimit: 300000 });
        await tx.wait();
        console.log(`Farm ${farmId} đã được đăng ký thành công`);
      }

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

      console.log(`\n--- Tạo hợp đồng ba bên cho farm ${farmId} ---`);
      const validityPeriod = 30 * 24 * 60 * 60;

      const productsResult = await pool.query(
        "SELECT COALESCE(SUM(quantity), 0) as total_quantity FROM products WHERE farm_id = (SELECT id FROM farms WHERE farm_name = $1)",
        [farmId]
      );
      const totalQuantity =
        productsResult.rows[0].total_quantity > 0
          ? Number(productsResult.rows[0].total_quantity)
          : parseInt(process.env.DEFAULT_QUANTITY) || 1000;

      const priceResult = await pool.query(
        "SELECT COALESCE(AVG(price), 0) as avg_price FROM products WHERE farm_id = (SELECT id FROM farms WHERE farm_name = $1)",
        [farmId]
      );
      const pricePerUnit =
        priceResult.rows[0].avg_price > 0
          ? hre.ethers.parseEther(priceResult.rows[0].avg_price.toString())
          : hre.ethers.parseEther(process.env.DEFAULT_PRICE || "0.005");

      const maxTermsLength = 500;
      let terms = `Hợp đồng mua bán trái cây từ farm ${farmId}`;
      if (terms.length > maxTermsLength) {
        terms = terms.substring(0, maxTermsLength);
        console.warn(
          `Chuỗi terms quá dài, đã cắt ngắn xuống ${maxTermsLength} ký tự`
        );
      }

      const contractCountBefore = Number(
        await governmentRegulator.contractCount()
      );
      const args = [
        farmId,
        agent.address,
        validityPeriod,
        totalQuantity,
        pricePerUnit,
        terms,
      ];
      await checkBalanceAndGas(
        deployer,
        governmentRegulator,
        "createTripartyContract",
        args
      );
      const tx = await governmentRegulator
        .connect(deployer)
        .createTripartyContract(...args, { gasLimit: 1000000 });
      await tx.wait();

      const contractId = contractCountBefore + 1;
      console.log(`Hợp đồng ba bên với ID ${contractId} đã được tạo`);

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

      console.log("\n--- Ký hợp đồng ---");
      await checkBalanceAndGas(farmOwner, governmentRegulator, "signContract", [
        contractId,
      ]);
      await governmentRegulator
        .connect(farmOwner)
        .signContract(contractId, { gasLimit: 300000 });
      console.log("Farm owner đã ký hợp đồng");
      const farmSignature = await governmentRegulator.checkContractSignature(
        contractId,
        farmOwner.address
      );
      console.log(`Chữ ký farm owner: ${farmSignature}`);

      await checkBalanceAndGas(agent, governmentRegulator, "signContract", [
        contractId,
      ]);
      await governmentRegulator
        .connect(agent)
        .signContract(contractId, { gasLimit: 300000 });
      console.log("Agent đã ký hợp đồng");
      const agentSignature = await governmentRegulator.checkContractSignature(
        contractId,
        agent.address
      );
      console.log(`Chữ ký agent: ${agentSignature}`);

      console.log("Government đã ký hợp đồng khi tạo");
      const governmentSignature =
        await governmentRegulator.checkContractSignature(
          contractId,
          deployer.address
        );
      console.log(`Chữ ký government: ${governmentSignature}`);

      const updatedContractStatus =
        await governmentRegulator.checkContractStatus(contractId);
      console.log("Trạng thái hợp đồng sau khi ký:", {
        isActive: updatedContractStatus.isActive,
        isCompleted: updatedContractStatus.isCompleted,
      });

      console.log("\n--- Ghi nhận giao hàng ---");
      const deliveryQuantity = Number(updatedContractStatus.totalQuantity);
      if (deliveryQuantity <= 0) {
        throw new Error("Số lượng giao hàng không hợp lệ!");
      }
      if (
        !updatedContractStatus.isActive ||
        !updatedContractStatus.isCompleted
      ) {
        throw new Error("Hợp đồng chưa hoàn tất hoặc không hoạt động!");
      }

      const farmOwnerAddress = farmData[5];
      console.log(`Farm owner từ blockchain: ${farmOwnerAddress}`);
      if (farmOwnerAddress.toLowerCase() !== farmOwner.address.toLowerCase()) {
        throw new Error(
          `Farm owner không khớp! Blockchain: ${farmOwnerAddress}, Script: ${farmOwner.address}`
        );
      }

      console.log(
        `Chuẩn bị ghi nhận giao hàng: contractId=${contractId}, quantity=${deliveryQuantity}`
      );
      const deliveryArgs = [contractId, deliveryQuantity];
      try {
        const deliveryTx = await governmentRegulator
          .connect(farmOwner)
          .recordDelivery(...deliveryArgs, { gasLimit: 1000000 });
        await deliveryTx.wait();
        console.log(`Đã ghi nhận giao ${deliveryQuantity}kg trái cây`);
      } catch (error) {
        console.error("Lỗi khi gọi recordDelivery:", error.message);
        if (error.data) {
          console.error("Dữ liệu lỗi:", error.data);
        }
        throw error;
      }

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
      const farmCountArgs = [location];
      await checkBalanceAndGas(
        deployer,
        governmentRegulator,
        "updateProvinceFarmCount",
        farmCountArgs
      );
      const farmCountTx = await governmentRegulator
        .connect(deployer)
        .updateProvinceFarmCount(...farmCountArgs, { gasLimit: 300000 });
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
    console.error("Lỗi khi tương tác với hợp đồng:");
    if (error.reason) {
      console.error("Lý do:", error.reason);
    }
    if (error.code) {
      console.error("Mã lỗi:", error.code);
      if (error.code === "CALL_EXCEPTION") {
        console.error(
          "Chi tiết:",
          error.data?.message || "Lỗi hợp đồng thông minh"
        );
      } else if (error.code === "NETWORK_ERROR") {
        console.error(
          "Lỗi mạng:",
          "Vui lòng kiểm tra node Hardhat tại http://127.0.0.1:8545"
        );
      } else if (error.code === -32000) {
        console.error(
          "Chi tiết:",
          error.message || "Giao dịch hết gas hoặc lỗi hợp đồng"
        );
      }
    }
    console.error("Stack trace:", error.stack);
    throw error;
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
