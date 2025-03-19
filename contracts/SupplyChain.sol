// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FruitSupplyChain {
    struct Fruit {
        string fruitType;
        string origin;
        address producer;
        string[] history;
    }
    mapping(uint => Fruit) public fruits;
    uint public fruitCount;

    event StepRecorded(uint fruitId, string step, address by, uint timestamp);

    function harvestFruit(string memory _fruitType, string memory _origin) public {
        fruitCount++;
        fruits[fruitCount] = Fruit(_fruitType, _origin, msg.sender, new string[](0));
        fruits[fruitCount].history.push("Harvested by Producer");
        emit StepRecorded(fruitCount, "Harvested", msg.sender, block.timestamp);
    }

    function recordStep(uint _fruitId, string memory _step) public {
        require(_fruitId <= fruitCount && _fruitId > 0, "Invalid Fruit ID");
        fruits[_fruitId].history.push(_step);
        emit StepRecorded(_fruitId, _step, msg.sender, block.timestamp);
    }

    function getFruit(uint _fruitId) public view returns (string memory, string memory, address, string[] memory) {
        require(_fruitId <= fruitCount && _fruitId > 0, "Invalid Fruit ID");
        Fruit memory fruit = fruits[_fruitId];
        return (fruit.fruitType, fruit.origin, fruit.producer, fruit.history);
    }
}