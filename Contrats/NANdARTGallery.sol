// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* ===== OpenZeppelin Contracts v4.9.0 ===== */

// Context
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

// Ownable
abstract contract Ownable is Context {
    address private _owner;

    constructor() {
        _owner = _msgSender();
    }

    modifier onlyOwner() {
        require(_msgSender() == _owner, "Ownable: not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }
}

// ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private _status;

    constructor() {
        _status = 1;
    }

    modifier nonReentrant() {
        require(_status != 2, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

// ERC165
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// IERC2981
interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256);
}

// ERC2981
abstract contract ERC2981 is IERC2981, ERC165 {
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }

    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    function _setTokenRoyalty(uint256 tokenId, address receiver, uint96 fraction) internal {
        require(fraction <= 10000, "Royalty too high");
        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, fraction);
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[tokenId];
        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) / 10000;
        return (royalty.receiver, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}

// ERC721 minimal + URIStorage
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

abstract contract ERC721URIStorage is Context, IERC721 {
    mapping(uint256 => address) private _owners;
    mapping(uint256 => string) private _tokenURIs;

    function _safeMint(address to, uint256 tokenId) internal {
        _owners[tokenId] = to;
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return _owners[tokenId];
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        require(msg.sender == from || msg.sender == to, "Not authorized");
        _owners[tokenId] = to;
    }
}

/* ===== RoyaltySplitter Contract ===== */

contract RoyaltySplitter is Ownable, ReentrancyGuard {
    address public immutable galeria;
    address public immutable artista;
    uint96 public immutable percentGaleria;
    uint96 public immutable percentArtista;

    constructor(
        address _galeria,
        address _artista,
        uint96 _percentGaleria,
        uint96 _percentArtista
    ) {
        require(_galeria != address(0) && _artista != address(0), "Enderecos invalidos");
        require(_percentGaleria + _percentArtista == 10000, "Soma dos percentuais deve ser 10000");
        galeria = _galeria;
        artista = _artista;
        percentGaleria = _percentGaleria;
        percentArtista = _percentArtista;
    }

    receive() external payable {}

    function distribuir() external nonReentrant {
        uint256 total = address(this).balance;
        require(total > 0, "Sem fundos a distribuir");

        uint256 valorGaleria = (total * percentGaleria) / 10000;
        uint256 valorArtista = total - valorGaleria;

        payable(galeria).transfer(valorGaleria);
        payable(artista).transfer(valorArtista);
    }
}

/* ===== NANdARTGallery Contract ===== */

contract NANdARTGallery is ERC721URIStorage, Ownable, ERC2981 {
    uint256 public tokenCounter;
    address public curador;

    mapping(address => bool) public isWhitelisted;
    mapping(uint256 => address) public contratosDeRoyalties;

    modifier apenasCurador() {
        require(msg.sender == curador, "Somente o curador pode executar esta acao");
        _;
    }

    constructor() {
        tokenCounter = 0;
        curador = msg.sender;
    }

    function definirCurador(address novoCurador) public onlyOwner {
        require(novoCurador != address(0), "Endereco do curador invalido");
        curador = novoCurador;
    }

    function adicionarAWhitelist(address utilizador) public apenasCurador {
        isWhitelisted[utilizador] = true;
    }

    function removerDaWhitelist(address utilizador) public apenasCurador {
        isWhitelisted[utilizador] = false;
    }

    function mintComCuradoria(address artista, string memory tokenURI_) public payable apenasCurador {
        require(bytes(tokenURI_).length > 0, "Token URI obrigatoria");
        require(artista != address(0), "Endereco do artista invalido");

        uint256 tokenId = tokenCounter;

        _safeMint(artista, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        RoyaltySplitter splitter = new RoyaltySplitter(
            address(this),
            artista,
            400,
            600
        );

        contratosDeRoyalties[tokenId] = address(splitter);
        _setTokenRoyalty(tokenId, address(splitter), 1000); // 10%

        tokenCounter++;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
