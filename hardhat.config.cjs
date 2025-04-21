require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true, // Bật tối ưu hóa mã
        runs: 200, // Giá trị thấp để ưu tiên giảm kích thước bytecode
      },
      debug: {
        revertStrings: "strip", // Tắt revert strings để giảm kích thước bytecode
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
  },
};
