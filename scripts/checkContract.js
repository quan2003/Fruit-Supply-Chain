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

  const filter = fruitSupplyChain.filters.FruitHashUpdated();
  const events = await fruitSupplyChain.queryFilter(filter, 0, "latest");

  console.log("FruitHashUpdated Events:");
  if (events.length === 0) {
    console.log("No FruitHashUpdated events found.");
  } else {
    for (const event of events) {
      const { fruitType, ipfsHash, timestamp } = event.args;
      console.log(
        `- Fruit: ${fruitType}, Hash: ${ipfsHash}, Timestamp: ${timestamp}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error checking events:", error);
    process.exit(1);
  });
