const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Triển khai mới
  const FruitSupplyChain = await hre.ethers.getContractFactory(
    "FruitSupplyChain"
  );
  const fruitSupplyChain = await FruitSupplyChain.deploy();
  const contractAddress = fruitSupplyChain.target;
  console.log("FruitSupplyChain deployed to:", contractAddress);

  // Lưu địa chỉ và ABI vào file
  const contractData = {
    address: contractAddress,
    abi: FruitSupplyChain.interface.format("json"),
  };
  fs.writeFileSync(
    path.join(
      __dirname,
      "../fruit-supply-chain-frontend/src/deployedContract.json"
    ),
    JSON.stringify(contractData, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
