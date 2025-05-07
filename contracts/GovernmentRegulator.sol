
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FruitSupplyChain.sol";

contract GovernmentRegulator {
    address public governmentAuthority;
    FruitSupplyChain public fruitSupplyChain;

    struct TripartyContract {
        uint256 contractId;
        string farmId;
        address agentAddress;
        address governmentWitness;
        uint256 creationDate;
        uint256 expiryDate;
        uint256 totalQuantity;
        uint256 pricePerUnit;
        string terms;
        bool isActive;
        mapping(address => bool) signatures;
        bool isCompleted;
    }

    struct FarmStatistics {
        uint256 totalFruitHarvested;
        uint256 totalContractsCreated;
        uint256 totalContractsCompleted;
        uint256 lastStatisticsUpdate;
    }

    struct AgentStatistics {
        uint256 totalQuantityPurchased;
        uint256 totalContractsCreated;
        uint256 totalContractsCompleted;
        uint256 lastStatisticsUpdate;
    }

    struct ProvinceStatistics {
        uint256 totalFruitHarvested;
        uint256 totalContractsCreated;
        uint256 totalContractsCompleted;
        uint256 lastStatisticsUpdate;
        uint256 farmCount;
    }

    mapping(uint256 => TripartyContract) public tripartyContracts;
    mapping(string => FarmStatistics) public farmStats;
    mapping(address => AgentStatistics) public agentStats;
    mapping(string => ProvinceStatistics) public provinceStats;
    uint256 public contractCount;
    uint256[] public activeContractIds;

    event ContractCreated(uint256 contractId, string farmId, address agent, uint256 quantity, uint256 price);
    event ContractSigned(uint256 contractId, address signer);
    event ContractCompleted(uint256 contractId);
    event StatisticsUpdated(string entityType, string identifier);
    event FruitDelivered(uint256 contractId, uint256 quantity, uint256 timestamp);
    event ProvinceStatisticsUpdated(
        string province,
        uint256 totalFruitHarvested,
        uint256 totalContractsCreated,
        uint256 totalContractsCompleted,
        uint256 farmCount,
        uint256 timestamp
    );

    modifier onlyGovernment() {
        require(msg.sender == governmentAuthority, "Only government authority can perform this action");
        _;
    }

    modifier contractExists(uint256 _contractId) {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        _;
    }

    constructor(address _fruitSupplyChainAddress) {
        governmentAuthority = msg.sender;
        fruitSupplyChain = FruitSupplyChain(_fruitSupplyChainAddress);
    }

    function changeGovernmentAuthority(address _newAuthority) public onlyGovernment {
        require(_newAuthority != address(0), "Invalid address");
        governmentAuthority = _newAuthority;
    }

    function createTripartyContract(
        string memory _farmId,
        address _agentAddress,
        uint256 _validityPeriod,
        uint256 _totalQuantity,
        uint256 _pricePerUnit,
        string memory _terms
    ) public onlyGovernment {
        require(fruitSupplyChain.isFarmRegistered(_farmId), "Farm not registered");
        require(_agentAddress != address(0), "Invalid agent address");
        require(_totalQuantity > 0, "Quantity must be greater than 0");
        require(_pricePerUnit > 0, "Price must be greater than 0");

        contractCount++;
        uint256 contractId = contractCount;

        TripartyContract storage newContract = tripartyContracts[contractId];
        newContract.contractId = contractId;
        newContract.farmId = _farmId;
        newContract.agentAddress = _agentAddress;
        newContract.governmentWitness = governmentAuthority;
        newContract.creationDate = block.timestamp;
        newContract.expiryDate = block.timestamp + _validityPeriod;
        newContract.totalQuantity = _totalQuantity;
        newContract.pricePerUnit = _pricePerUnit;
        newContract.terms = _terms;
        newContract.isActive = true;
        newContract.isCompleted = false;

        newContract.signatures[governmentAuthority] = true;

        farmStats[_farmId].totalContractsCreated += 1;
        farmStats[_farmId].lastStatisticsUpdate = block.timestamp;
        agentStats[_agentAddress].totalContractsCreated += 1;
        agentStats[_agentAddress].lastStatisticsUpdate = block.timestamp;

        (string memory location,,,,,,) = fruitSupplyChain.getFarmData(_farmId);
        provinceStats[location].totalContractsCreated += 1;
        provinceStats[location].lastStatisticsUpdate = block.timestamp;

        activeContractIds.push(contractId);

        emit ContractCreated(contractId, _farmId, _agentAddress, _totalQuantity, _pricePerUnit);
        emit StatisticsUpdated("Farm", _farmId);
        emit StatisticsUpdated("Agent", addressToString(_agentAddress));
        emit ProvinceStatisticsUpdated(
            location,
            provinceStats[location].totalFruitHarvested,
            provinceStats[location].totalContractsCreated,
            provinceStats[location].totalContractsCompleted,
            provinceStats[location].farmCount,
            block.timestamp
        );
    }

    function signContract(uint256 _contractId) public contractExists(_contractId) {
        TripartyContract storage contract_ = tripartyContracts[_contractId];
        require(contract_.isActive, "Contract is not active");
        require(!contract_.isCompleted, "Contract already completed");

        require(
            msg.sender == contract_.agentAddress ||
            isFarmOwner(contract_.farmId, msg.sender) ||
            msg.sender == contract_.governmentWitness,
            "Not authorized to sign this contract"
        );

        contract_.signatures[msg.sender] = true;
        emit ContractSigned(_contractId, msg.sender);

        if (
            contract_.signatures[contract_.agentAddress] &&
            farmHasSigned(_contractId, contract_.farmId) &&
            contract_.signatures[contract_.governmentWitness]
        ) {
            contract_.isCompleted = true;

            farmStats[contract_.farmId].totalContractsCompleted += 1;
            farmStats[contract_.farmId].lastStatisticsUpdate = block.timestamp;
            agentStats[contract_.agentAddress].totalContractsCompleted += 1;
            agentStats[contract_.agentAddress].lastStatisticsUpdate = block.timestamp;

            (string memory location,,,,,,) = fruitSupplyChain.getFarmData(contract_.farmId);
            provinceStats[location].totalContractsCompleted += 1;
            provinceStats[location].lastStatisticsUpdate = block.timestamp;

            removeFromActiveContracts(_contractId);

            emit ContractCompleted(_contractId);
            emit StatisticsUpdated("Farm", contract_.farmId);
            emit StatisticsUpdated("Agent", addressToString(contract_.agentAddress));
            emit ProvinceStatisticsUpdated(
                location,
                provinceStats[location].totalFruitHarvested,
                provinceStats[location].totalContractsCreated,
                provinceStats[location].totalContractsCompleted,
                provinceStats[location].farmCount,
                block.timestamp
            );
        }
    }

    function recordDelivery(uint256 _contractId, uint256 _quantity) public contractExists(_contractId) {
        TripartyContract storage contract_ = tripartyContracts[_contractId];
        require(contract_.isActive, "Contract is not active");
        require(contract_.isCompleted, "Contract not yet completed by all parties");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(
            msg.sender == contract_.agentAddress || isFarmOwner(contract_.farmId, msg.sender),
            "Not authorized to record delivery"
        );

        (,,,,,address farmOwner,) = fruitSupplyChain.getFarmData(contract_.farmId);
        require(farmOwner != address(0), "Farm owner not found or farm not registered");

        farmStats[contract_.farmId].totalFruitHarvested += _quantity;
        farmStats[contract_.farmId].lastStatisticsUpdate = block.timestamp;
        agentStats[contract_.agentAddress].totalQuantityPurchased += _quantity;
        agentStats[contract_.agentAddress].lastStatisticsUpdate = block.timestamp;

        (string memory location,,,,,,) = fruitSupplyChain.getFarmData(contract_.farmId);
        provinceStats[location].totalFruitHarvested += _quantity;
        provinceStats[location].lastStatisticsUpdate = block.timestamp;

        emit FruitDelivered(_contractId, _quantity, block.timestamp);
        emit StatisticsUpdated("Farm", contract_.farmId);
        emit StatisticsUpdated("Agent", addressToString(contract_.agentAddress));
        emit ProvinceStatisticsUpdated(
            location,
            provinceStats[location].totalFruitHarvested,
            provinceStats[location].totalContractsCreated,
            provinceStats[location].totalContractsCompleted,
            provinceStats[location].farmCount,
            block.timestamp
        );
    }

    function isFarmOwner(string memory _farmId, address _address) internal view returns (bool) {
        (,,,,,address farmOwner,) = fruitSupplyChain.getFarmData(_farmId);
        return farmOwner == _address;
    }

    function farmHasSigned(uint256 _contractId, string memory _farmId) internal view returns (bool) {
        (,,,,,address farmOwner,) = fruitSupplyChain.getFarmData(_farmId);
        return tripartyContracts[_contractId].signatures[farmOwner];
    }

    function removeFromActiveContracts(uint256 _contractId) internal {
        for (uint256 i = 0; i < activeContractIds.length; i++) {
            if (activeContractIds[i] == _contractId) {
                activeContractIds[i] = activeContractIds[activeContractIds.length - 1];
                activeContractIds.pop();
                break;
            }
        }
    }

    function cancelContract(uint256 _contractId) public onlyGovernment contractExists(_contractId) {
        TripartyContract storage contract_ = tripartyContracts[_contractId];
        require(contract_.isActive, "Contract is not active");

        contract_.isActive = false;
        removeFromActiveContracts(_contractId);
    }

    function getFarmStatistics(string memory _farmId) public view returns (
        uint256 totalFruitHarvested,
        uint256 totalContractsCreated,
        uint256 totalContractsCompleted,
        uint256 lastUpdate
    ) {
        require(fruitSupplyChain.isFarmRegistered(_farmId), "Farm not registered");
        FarmStatistics memory stats = farmStats[_farmId];
        return (
            stats.totalFruitHarvested,
            stats.totalContractsCreated,
            stats.totalContractsCompleted,
            stats.lastStatisticsUpdate
        );
    }

    function getAgentStatistics(address _agentAddress) public view returns (
        uint256 totalQuantityPurchased,
        uint256 totalContractsCreated,
        uint256 totalContractsCompleted,
        uint256 lastUpdate
    ) {
        require(_agentAddress != address(0), "Invalid agent address");
        AgentStatistics memory stats = agentStats[_agentAddress];
        return (
            stats.totalQuantityPurchased,
            stats.totalContractsCreated,
            stats.totalContractsCompleted,
            stats.lastStatisticsUpdate
        );
    }

    function getProvinceStatistics(string memory _province) public view returns (
        uint256 totalFruitHarvested,
        uint256 totalContractsCreated,
        uint256 totalContractsCompleted,
        uint256 farmCount,
        uint256 lastUpdate
    ) {
        ProvinceStatistics memory stats = provinceStats[_province];
        return (
            stats.totalFruitHarvested,
            stats.totalContractsCreated,
            stats.totalContractsCompleted,
            stats.farmCount,
            stats.lastStatisticsUpdate
        );
    }

    function updateStatistics(string memory _farmId, address _agentAddress) public onlyGovernment {
        require(fruitSupplyChain.isFarmRegistered(_farmId), "Farm not registered");
        require(_agentAddress != address(0), "Invalid agent address");

        farmStats[_farmId].lastStatisticsUpdate = block.timestamp;
        agentStats[_agentAddress].lastStatisticsUpdate = block.timestamp;

        (string memory location,,,,,,) = fruitSupplyChain.getFarmData(_farmId);
        provinceStats[location].lastStatisticsUpdate = block.timestamp;

        emit StatisticsUpdated("Farm", _farmId);
        emit StatisticsUpdated("Agent", addressToString(_agentAddress));
        emit ProvinceStatisticsUpdated(
            location,
            provinceStats[location].totalFruitHarvested,
            provinceStats[location].totalContractsCreated,
            provinceStats[location].totalContractsCompleted,
            provinceStats[location].farmCount,
            block.timestamp
        );
    }

    function updateProvinceFarmCount(string memory _province) public onlyGovernment {
        uint256 count = 0;
        string[] memory allFarms = fruitSupplyChain.getAllFarms();
        for (uint256 i = 0; i < allFarms.length; i++) {
            (string memory farmLocation,,,,,,) = fruitSupplyChain.getFarmData(allFarms[i]);
            if (keccak256(abi.encodePacked(farmLocation)) == keccak256(abi.encodePacked(_province))) {
                count++;
            }
        }
        provinceStats[_province].farmCount = count;
        provinceStats[_province].lastStatisticsUpdate = block.timestamp;

        emit ProvinceStatisticsUpdated(
            _province,
            provinceStats[_province].totalFruitHarvested,
            provinceStats[_province].totalContractsCreated,
            provinceStats[_province].totalContractsCompleted,
            count,
            block.timestamp
        );
    }

    function checkContractStatus(uint256 _contractId) public view contractExists(_contractId) returns (
        string memory farmId,
        address agentAddress,
        uint256 creationDate,
        uint256 expiryDate,
        uint256 totalQuantity,
        uint256 pricePerUnit,
        string memory terms,
        bool isActive,
        bool isCompleted
    ) {
        TripartyContract storage contract_ = tripartyContracts[_contractId];
        return (
            contract_.farmId,
            contract_.agentAddress,
            contract_.creationDate,
            contract_.expiryDate,
            contract_.totalQuantity,
            contract_.pricePerUnit,
            contract_.terms,
            contract_.isActive,
            contract_.isCompleted
        );
    }

    function checkContractSignature(uint256 _contractId, address _signer) public view contractExists(_contractId) returns (bool) {
        return tripartyContracts[_contractId].signatures[_signer];
    }

    function getAllActiveContracts() public view returns (uint256[] memory) {
        return activeContractIds;
    }

    function addressToString(address _address) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_address)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function getContractTerms(uint256 _contractId) public view contractExists(_contractId) returns (string memory) {
        return tripartyContracts[_contractId].terms;
    }

    function getTotalContractsCreated() public view returns (uint256) {
        return contractCount;
    }

    function getTotalActiveContracts() public view returns (uint256) {
        return activeContractIds.length;
    }
}
