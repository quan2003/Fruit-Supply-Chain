const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Kết nối rõ ràng với Hardhat node
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Kiểm tra trạng thái mạng
  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number:", blockNumber);

  const transactionCount = await provider.getTransactionCount(deployer.address);
  console.log(
    "Deployer transaction count before deployment:",
    transactionCount
  );

  // Gửi giao dịch giả để tăng nonce
  await deployer.sendTransaction({
    to: deployer.address,
    value: hre.ethers.parseEther("0"),
  });
  console.log("Fake transaction sent to increase nonce");

  // Deploy hợp đồng FruitSupplyChain
  const FruitSupplyChain = await hre.ethers.getContractFactory(
    "FruitSupplyChain",
    deployer
  );
  const fruitSupplyChain = await FruitSupplyChain.deploy();
  await fruitSupplyChain.waitForDeployment();

  const contractAddress = await fruitSupplyChain.getAddress();
  console.log("FruitSupplyChain deployed to:", contractAddress);

  // Lưu địa chỉ hợp đồng vào file contract-address.txt
  fs.writeFileSync("contract-address.txt", contractAddress);
  console.log("Contract address saved to contract-address.txt");

  // Kiểm tra lại bytecode sau khi triển khai
  const code = await provider.getCode(contractAddress);
  console.log("Contract code exists at", contractAddress, ":", code !== "0x");

  // Kiểm tra owner để xác nhận hợp đồng hoạt động
  const owner = await fruitSupplyChain.owner();
  console.log("Owner of the contract:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
