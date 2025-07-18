// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FruitSupplyChain {
    struct FruitCatalog {
        string name;
        string description;
        string growingSeason;
        string nutritionalValue;
        string storageConditions;
        string[] commonVarieties;
    }

    struct Farm {
        string location;
        string climate;
        string soil;
        uint256 lastUpdated;
        string currentConditions;
        address owner;
        uint256[] fruitIds;
    }

    struct Fruit {
        string fruitType;
        string origin;
        address producer;
        uint256 harvestDate;
        string quality;
        uint256 quantity; // Thêm trường này để ghi lại số lượng
        string[] history;
        string[] recommendations;
    }

    struct ListedProduct {
        uint256 fruitId;
        uint256 price; // Giá tổng cho toàn bộ số lượng
        uint256 quantity;
        address seller;
        bool isActive;
        uint256 listedTimestamp;
        bool allowPartialPurchase; // Thêm trường này
    }

    address public owner;
    mapping(address => bool) public authorizedManagers;
    mapping(string => FruitCatalog) public fruitCatalogs;
    mapping(string => Farm) public farms;
    mapping(uint256 => Fruit) public fruits;
    mapping(uint256 => ListedProduct) public listedProducts;
    mapping(address => uint256[]) public sellerListings;
    uint256 public fruitCount;
    uint256 public listingCount;
    string[] public registeredFruitTypes;
    string[] public registeredFarms;
    uint256[] public listingIds;

    mapping(string => bool) public isFarmRegistered;
    mapping(string => string) public fruitHashes;

    constructor() {
        owner = msg.sender;
        authorizedManagers[msg.sender] = true;
    }

    event CatalogAdded(string fruitType, address by, uint256 timestamp);
    event FarmUpdated(string farmId, string conditions, uint256 timestamp);
    event ProductListed(
        uint256 listingId,
        uint256 fruitId,
        uint256 price,
        uint256 quantity,
        address seller,
        uint256 timestamp
    );
    event ProductPurchased(
        uint256 listingId,
        address buyer,
        uint256 quantity,
        uint256 timestamp
    );
    event RecommendationAdded(
        uint256 fruitId,
        string recommendation,
        uint256 timestamp
    );
    event StepRecorded(uint256 fruitId, string step, address by, uint256 timestamp);
    event FruitHashUpdated(string fruitType, string ipfsHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedManagers[msg.sender] || msg.sender == owner,
            "Not authorized"
        );
        _;
    }

    function purchaseProduct(uint256 _listingId, uint256 _quantity) public payable {
        require(_listingId > 0 && _listingId <= listingCount, "Invalid Listing ID");
        ListedProduct storage product = listedProducts[_listingId];
        require(product.isActive, "Product is not available for purchase");
        require(_quantity > 0 && _quantity <= product.quantity, "Invalid quantity");

        // Kiểm tra nếu không cho phép mua một phần
        if (!product.allowPartialPurchase) {
            require(_quantity == product.quantity, "Must purchase the entire quantity");
        }

        uint256 pricePerUnit = product.price / product.quantity;
        uint256 totalPrice = pricePerUnit * _quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        payable(product.seller).transfer(totalPrice);
        product.quantity -= _quantity;
        if (product.quantity == 0) {
            product.isActive = false;
        }

        fruits[product.fruitId].history.push(
            string(
                abi.encodePacked(
                    "Purchased ",
                    uint2str(_quantity),
                    " units by Customer"
                )
            )
        );
        emit ProductPurchased(_listingId, msg.sender, _quantity, block.timestamp);
        emit StepRecorded(product.fruitId, "Purchased", msg.sender, block.timestamp);
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + (_i % 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }

    function setFruitHash(string memory fruitType, string memory ipfsHash) public {
        fruitHashes[fruitType] = ipfsHash;
        emit FruitHashUpdated(fruitType, ipfsHash, block.timestamp);
    }

    function getFruitHash(string memory fruitType) public view returns (string memory) {
        return fruitHashes[fruitType];
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
        bool exists = false;
        for (uint256 i = 0; i < registeredFruitTypes.length; i++) {
            if (
                keccak256(abi.encodePacked(registeredFruitTypes[i])) ==
                keccak256(abi.encodePacked(_fruitType))
            ) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            registeredFruitTypes.push(_fruitType);
        }
        emit CatalogAdded(_fruitType, msg.sender, block.timestamp);
    }

    function addManager(address _manager) public onlyOwner {
        authorizedManagers[_manager] = true;
    }

    function addRecommendation(uint256 _fruitId, string memory _recommendation) public onlyAuthorized {
        require(_fruitId > 0 && _fruitId <= fruitCount, "Invalid Fruit ID");
        fruits[_fruitId].recommendations.push(_recommendation);
        emit RecommendationAdded(_fruitId, _recommendation, block.timestamp);
    }

    function getAllActiveListings() public view returns (uint256[] memory) {
        uint256[] memory activeListings = new uint256[](listingCount);
        uint256 count = 0;
        for (uint256 i = 0; i < listingIds.length; i++) {
            if (listedProducts[listingIds[i]].isActive) {
                activeListings[count] = listingIds[i];
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeListings[i];
        }
        return result;
    }

    function getAllFarms() public view returns (string[] memory) {
        return registeredFarms;
    }

    function getAllFruitTypes() public view returns (string[] memory) {
        return registeredFruitTypes;
    }

    function getFarmData(
        string memory _farmId
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            string memory,
            address,
            uint256[] memory
        )
    {
        Farm memory farm = farms[_farmId];
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

    function getFruit(
        uint256 _fruitId
    )
        public
        view
        returns (
            string memory,
            string memory,
            address,
            string[] memory,
            uint256,
            string memory,
            string[] memory,
            uint256 // Thêm quantity vào kết quả trả về
        )
    {
        require(_fruitId > 0 && _fruitId <= fruitCount, "Invalid Fruit ID");
        Fruit memory fruit = fruits[_fruitId];
        return (
            fruit.fruitType,
            fruit.origin,
            fruit.producer,
            fruit.history,
            fruit.harvestDate,
            fruit.quality,
            fruit.recommendations,
            fruit.quantity
        );
    }

    function getFruitCatalog(
        string memory _fruitType
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string[] memory
        )
    {
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

    function getListedProduct(
        uint256 _listingId
    )
        public
        view
        returns (
            uint256 fruitId,
            uint256 price,
            uint256 quantity,
            address seller,
            bool isActive,
            uint256 listedTimestamp,
            bool allowPartialPurchase // Thêm vào kết quả trả về
        )
    {
        require(_listingId > 0 && _listingId <= listingCount, "Invalid Listing ID");
        ListedProduct memory product = listedProducts[_listingId];
        return (
            product.fruitId,
            product.price,
            product.quantity,
            product.seller,
            product.isActive,
            product.listedTimestamp,
            product.allowPartialPurchase
        );
    }

    function getSellerListings(address _seller) public view returns (uint256[] memory) {
        return sellerListings[_seller];
    }

    function harvestFruit(
        string memory _fruitType,
        string memory _origin,
        string memory _farmId,
        string memory _quality,
        uint256 _quantity // Thêm tham số này
    ) public {
        FruitCatalog memory catalog = fruitCatalogs[_fruitType];
        require(bytes(catalog.name).length > 0, "Fruit type not in catalog");
        require(isFarmRegistered[_farmId], "Farm not registered");
        require(_quantity > 0, "Quantity must be greater than 0");
        fruitCount++;
        fruits[fruitCount] = Fruit(
            _fruitType,
            _origin,
            msg.sender,
            block.timestamp,
            _quality,
            _quantity,
            new string[](0),
            new string[](0)
        );
        Farm storage farm = farms[_farmId];
        if (farm.owner == address(0)) {
            farm.fruitIds.push(fruitCount);
        } else {
            farms[_farmId].fruitIds.push(fruitCount);
        }
        fruits[fruitCount].history.push("Harvested by Producer");
        emit StepRecorded(fruitCount, "Harvested", msg.sender, block.timestamp);
    }

    function listProductForSale(
        uint256 _fruitId,
        uint256 _price,
        uint256 _quantity,
        bool _allowPartialPurchase // Thêm tham số này
    ) public {
        require(_fruitId > 0 && _fruitId <= fruitCount, "Invalid Fruit ID");
        require(_price > 0, "Price must be greater than 0");
        require(_quantity > 0, "Quantity must be greater than 0");
        Fruit storage fruit = fruits[_fruitId];
        require(_quantity <= fruit.quantity, "Quantity exceeds available stock");

        listingCount++;
        listedProducts[listingCount] = ListedProduct(
            _fruitId,
            _price,
            _quantity,
            msg.sender,
            true,
            block.timestamp,
            _allowPartialPurchase
        );
        sellerListings[msg.sender].push(listingCount);
        listingIds.push(listingCount);
        fruits[_fruitId].history.push("Listed for Sale");
        fruit.quantity -= _quantity; // Giảm số lượng khả dụng
        emit ProductListed(listingCount, _fruitId, _price, _quantity, msg.sender, block.timestamp);
    }

    function recordStep(uint256 _fruitId, string memory _step) public {
        require(_fruitId > 0 && _fruitId <= fruitCount, "Invalid Fruit ID");
        fruits[_fruitId].history.push(_step);
        emit StepRecorded(_fruitId, _step, msg.sender, block.timestamp);
    }

    function registerFarm(
        string memory _farmId,
        string memory _location,
        string memory _climate,
        string memory _soil,
        string memory _currentConditions
    ) public {
        require(!isFarmRegistered[_farmId], "Farm already registered");
        farms[_farmId] = Farm(
            _location,
            _climate,
            _soil,
            0,
            _currentConditions,
            msg.sender,
            new uint256[](0)
        );
        isFarmRegistered[_farmId] = true;
        bool exists = false;
        for (uint256 i = 0; i < registeredFarms.length; i++) {
            if (
                keccak256(abi.encodePacked(registeredFarms[i])) ==
                keccak256(abi.encodePacked(_farmId))
            ) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            registeredFarms.push(_farmId);
        }
        emit FarmUpdated(_farmId, _currentConditions, block.timestamp);
    }

    function removeManager(address _manager) public onlyOwner {
        authorizedManagers[_manager] = false;
    }

    function updateFarmConditions(string memory _farmId, string memory _conditions) public {
        Farm storage farm = farms[_farmId];
        require(
            farm.owner == msg.sender || authorizedManagers[msg.sender],
            "Not authorized"
        );
        farm.currentConditions = _conditions;
        farm.lastUpdated = block.timestamp;
        emit FarmUpdated(_farmId, _conditions, block.timestamp);
    }
}