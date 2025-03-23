// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FruitSupplyChain {
    struct Fruit {
        string fruitType;
        string origin;
        address producer;
        string[] history;
        uint harvestDate;
        string quality;
        string[] recommendationHistory;
    }
    
    struct FruitCatalog {
        string name;
        string description;
        string growingSeason;
        string nutritionalValue;
        string storageConditions;
        string[] commonVarieties;
    }
    
    struct FarmData {
        string location;
        string climate;
        string soil;
        uint lastUpdated;
        string currentConditions;
        address owner;
        uint[] fruitIds;
    }
    
    mapping(uint => Fruit) public fruits;
    mapping(string => FruitCatalog) public fruitCatalogs;
    mapping(string => FarmData) public farms;
    mapping(address => bool) public authorizedManagers;
    
    string[] public registeredFruitTypes;
    string[] public registeredFarms;
    
    uint public fruitCount;
    address public owner;
    
    event StepRecorded(uint fruitId, string step, address by, uint timestamp);
    event FarmUpdated(string farmId, string conditions, uint timestamp);
    event CatalogAdded(string fruitType, address by, uint timestamp);
    event RecommendationAdded(uint fruitId, string recommendation, uint timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedManagers[msg.sender], "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedManagers[msg.sender] = true;
    }
    
    function addManager(address _manager) public onlyOwner {
        authorizedManagers[_manager] = true;
    }
    
    function removeManager(address _manager) public onlyOwner {
        authorizedManagers[_manager] = false;
    }
    
    function addFruitCatalog(
        string memory _fruitType, 
        string memory _description, 
        string memory _growingSeason,
        string memory _nutritionalValue,
        string memory _storageConditions,
        string[] memory _commonVarieties
    ) public onlyAuthorized {
        fruitCatalogs[_fruitType] = FruitCatalog(
            _fruitType,
            _description,
            _growingSeason,
            _nutritionalValue,
            _storageConditions,
            _commonVarieties
        );
        
        // Kiểm tra xem loại trái cây đã tồn tại trong danh sách chưa
        bool exists = false;
        for (uint i = 0; i < registeredFruitTypes.length; i++) {
            if (keccak256(bytes(registeredFruitTypes[i])) == keccak256(bytes(_fruitType))) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            registeredFruitTypes.push(_fruitType);
        }
        
        emit CatalogAdded(_fruitType, msg.sender, block.timestamp);
    }
    
    function registerFarm(
        string memory _farmId,
        string memory _location,
        string memory _climate,
        string memory _soil,
        string memory _currentConditions
    ) public {
        farms[_farmId] = FarmData(
            _location,
            _climate,
            _soil,
            block.timestamp,
            _currentConditions,
            msg.sender,
            new uint[](0)
        );
        
        // Kiểm tra xem nông trại đã tồn tại trong danh sách chưa
        bool exists = false;
        for (uint i = 0; i < registeredFarms.length; i++) {
            if (keccak256(bytes(registeredFarms[i])) == keccak256(bytes(_farmId))) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            registeredFarms.push(_farmId);
        }
        
        emit FarmUpdated(_farmId, _currentConditions, block.timestamp);
    }
    
    function updateFarmConditions(string memory _farmId, string memory _conditions) public {
        require(farms[_farmId].owner == msg.sender || authorizedManagers[msg.sender], "Not authorized");
        farms[_farmId].currentConditions = _conditions;
        farms[_farmId].lastUpdated = block.timestamp;
        
        emit FarmUpdated(_farmId, _conditions, block.timestamp);
    }
    
    function harvestFruit(
        string memory _fruitType, 
        string memory _origin, 
        string memory _farmId,
        string memory _quality
    ) public {
        require(bytes(fruitCatalogs[_fruitType].name).length > 0, "Fruit type not in catalog");
        
        fruitCount++;
        fruits[fruitCount] = Fruit(
            _fruitType, 
            _origin, 
            msg.sender, 
            new string[](0),
            block.timestamp,
            _quality,
            new string[](0)
        );
        
        fruits[fruitCount].history.push("Harvested by Producer");
        
        // Liên kết trái cây với nông trại
        if (bytes(farms[_farmId].location).length > 0) {
            farms[_farmId].fruitIds.push(fruitCount);
        }
        
        emit StepRecorded(fruitCount, "Harvested", msg.sender, block.timestamp);
    }
    
    function recordStep(uint _fruitId, string memory _step) public {
        require(_fruitId <= fruitCount && _fruitId > 0, "Invalid Fruit ID");
        fruits[_fruitId].history.push(_step);
        emit StepRecorded(_fruitId, _step, msg.sender, block.timestamp);
    }
    
    function addRecommendation(uint _fruitId, string memory _recommendation) public onlyAuthorized {
        require(_fruitId <= fruitCount && _fruitId > 0, "Invalid Fruit ID");
        fruits[_fruitId].recommendationHistory.push(_recommendation);
        emit RecommendationAdded(_fruitId, _recommendation, block.timestamp);
    }
    
    function getFruit(uint _fruitId) public view returns (
        string memory, 
        string memory, 
        address, 
        string[] memory,
        uint,
        string memory,
        string[] memory
    ) {
        require(_fruitId <= fruitCount && _fruitId > 0, "Invalid Fruit ID");
        Fruit memory fruit = fruits[_fruitId];
        return (
            fruit.fruitType, 
            fruit.origin, 
            fruit.producer, 
            fruit.history,
            fruit.harvestDate,
            fruit.quality,
            fruit.recommendationHistory
        );
    }
    
    function getFruitCatalog(string memory _fruitType) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string[] memory
    ) {
        FruitCatalog memory catalog = fruitCatalogs[_fruitType];
        return (
            catalog.name,
            catalog.description,
            catalog.growingSeason,
            catalog.nutritionalValue,
            catalog.storageConditions,
            catalog.commonVarieties
        );
    }
    
    function getFarmData(string memory _farmId) public view returns (
        string memory,
        string memory,
        string memory,
        uint,
        string memory,
        address,
        uint[] memory
    ) {
        FarmData memory farm = farms[_farmId];
        return (
            farm.location,
            farm.climate,
            farm.soil,
            farm.lastUpdated,
            farm.currentConditions,
            farm.owner,
            farm.fruitIds
        );
    }
    
    function getAllFruitTypes() public view returns (string[] memory) {
        return registeredFruitTypes;
    }
    
    function getAllFarms() public view returns (string[] memory) {
        return registeredFarms;
    }
}