const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require("fs");

async function main() {
  // Đọc địa chỉ hợp đồng từ file
  const contractAddress = fs
    .readFileSync("contract-address.txt", "utf8")
    .trim();
  console.log("Using contract address:", contractAddress);

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const FruitSupplyChain = await ethers.getContractFactory("FruitSupplyChain");
  const fruitSupplyChain = FruitSupplyChain.attach(contractAddress);

  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error(
      `No contract found at ${contractAddress}. Please deploy the contract first.`
    );
  }

  const fruits = [
    "Dua Hau",
    "Mang Cut",
    "Trai Cam",
    "Trai Thanh Long",
    "Trai Xoai",
    "Vu Sua",
  ];

  console.log("Fruit Hashes:");
  for (const fruit of fruits) {
    try {
      const hash = await fruitSupplyChain.getFruitHash(fruit);
      console.log(`- ${fruit}: ${hash}`);
    } catch (error) {
      console.error(`Error fetching hash for ${fruit}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error checking fruit hashes:", error);
    process.exit(1);
  });
