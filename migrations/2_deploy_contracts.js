const FruitSupplyChain = artifacts.require("FruitSupplyChain");

module.exports = function (deployer) {
  deployer.deploy(FruitSupplyChain);
};
