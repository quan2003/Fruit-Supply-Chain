const hre = require("hardhat");

async function main() {
  // Lấy contract factory
  const FruitSupplyChain = await hre.ethers.getContractFactory(
    "FruitSupplyChain"
  );

  // Deploy contract
  const fruitSupplyChain = await FruitSupplyChain.deploy();

  // Chờ giao dịch deploy hoàn tất
  const txReceipt = await fruitSupplyChain.deploymentTransaction().wait();

  // Lấy địa chỉ của contract từ transaction receipt
  const contractAddress = txReceipt.contractAddress;

  // In địa chỉ của contract
  console.log("FruitSupplyChain deployed to:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
