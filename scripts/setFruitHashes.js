const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting fruit hashes with account:", deployer.address);

  // Đọc địa chỉ hợp đồng từ file
  const contractAddress = fs
    .readFileSync("contract-address.txt", "utf8")
    .trim();
  console.log("Using contract address:", contractAddress);

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const FruitSupplyChain = await ethers.getContractFactory(
    "FruitSupplyChain",
    deployer
  );
  let fruitSupplyChain =
    FruitSupplyChain.attach(contractAddress).connect(deployer);

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number:", blockNumber);

  const transactionCount = await provider.getTransactionCount(deployer.address);
  console.log("Deployer transaction count:", transactionCount);

  let code = await provider.getCode(contractAddress);
  console.log("Contract code exists at", contractAddress, ":", code !== "0x");

  if (code === "0x") {
    console.log("No contract found at this address. Redeploying...");
    const newContract = await FruitSupplyChain.deploy();
    await newContract.waitForDeployment();
    const newAddress = await newContract.getAddress();
    console.log("New contract deployed to:", newAddress);
    fs.writeFileSync("contract-address.txt", newAddress);
    fruitSupplyChain = newContract.connect(deployer);
  }

  const fruitHashes = [
    { name: "Dua Hau", hash: "QmNYb72BzVRhxTcXAefSg4QESHK2fEn2T3hFUE8Gvz6gM5" },
    {
      name: "Mang Cut",
      hash: "QmdHct5JMUtw3VpDMJg4LYLvFqkVUsoZAVmy8wqgjs8T8d",
    },
    {
      name: "Trai Cam",
      hash: "QmWDN5vHi1apdzmjpi2CncLhpLgd1cJskWQDWFW8jQTHZo",
    },
    {
      name: "Trai Thanh Long",
      hash: "QmdTqSueXLd6J6EMbXvemP3VVPpUo3dkkWwbiNmKV4Cegy",
    },
    {
      name: "Trai Xoai",
      hash: "QmcwFdYQXKVsPd7qhCeXowwVDbHrnmMM6hCtsfJ7US4nXT",
    },
    { name: "Vu Sua", hash: "QmXtKxu41xyvx4x9XXz6WRTRFCnKwriWfrHCtiYTHDJF1u" },
  ];

  for (const fruit of fruitHashes) {
    console.log(`Setting hash for ${fruit.name}: ${fruit.hash}`);
    try {
      const tx = await fruitSupplyChain.setFruitHash(fruit.name, fruit.hash);
      await tx.wait();
      console.log(`Hash set for ${fruit.name}`);
    } catch (error) {
      console.error(`Error setting hash for ${fruit.name}:`, error);
    }
  }

  console.log("All fruit hashes have been set!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error setting fruit hashes:", error);
    process.exit(1);
  });
