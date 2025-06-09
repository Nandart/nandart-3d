// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* ===== Contexto ===== */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

/* ===== Ownable ===== */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    modifier onlyOwner() {
        require(_msgSender() == _owner, "Ownable: nao e o dono");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: novo dono e o endereco zero");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/* ===== ReentrancyGuard ===== */
abstract contract ReentrancyGuard {
    uint256 private _status;

    constructor() {
        _status = 1;
    }

    modifier nonReentrant() {
        require(_status != 2, "ReentrancyGuard: chamada reentrante");
        _status = 2;
        _;
        _status = 1;
    }
}

/* ===== Interfaces ===== */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

/* ===== ERC165 ===== */
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165) returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

/* ===== ERC2981 ===== */
abstract contract ERC2981 is ERC165, IERC2981 {
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }

    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    function _setTokenRoyalty(uint256 tokenId, address receiver, uint96 fraction) internal {
        require(fraction <= 10000, "Royalty demasiado alta");
        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, fraction);
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view virtual override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[tokenId];
        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) / 10000;
        return (royalty.receiver, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}

/* ===== Royalty Splitter ===== */
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
        require(_percentGaleria + _percentArtista == 10000, "Percentagens devem somar 10000");

        galeria = _galeria;
        artista = _artista;
        percentGaleria = _percentGaleria;
        percentArtista = _percentArtista;
    }

    receive() external payable {}

    function distribuir() external nonReentrant {
        uint256 total = address(this).balance;
        require(total > 0, "Sem saldo");

        uint256 valorGaleria = (total * percentGaleria) / 10000;
        uint256 valorArtista = total - valorGaleria;

        payable(galeria).transfer(valorGaleria);
        payable(artista).transfer(valorArtista);
    }
}

/* ===== ERC721 Metadata Minimal ===== */
abstract contract ERC721MetadataMinimal is ERC165, IERC721Metadata {
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(bytes(_tokenURI).length > 0, "URI invalida");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "Endereco invalido");
        require(_owners[tokenId] == address(0), "Token ja existe");
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        return _owners[tokenId];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function balanceOf(address owner) public view virtual override returns (uint256) {
        return _balances[owner];
    }

    function name() public view virtual override returns (string memory) {
        return "NANdART Gallery";
    }

    function symbol() public view virtual override returns (string memory) {
        return "NART";
    }

    function approve(address, uint256) external virtual override {
        revert("Not implemented");
    }

    function setApprovalForAll(address, bool) external virtual override {
        revert("Not implemented");
    }

    function getApproved(uint256) external view virtual override returns (address) {
        revert("Not implemented");
    }

    function isApprovedForAll(address, address) external view virtual override returns (bool) {
        revert("Not implemented");
    }

    function safeTransferFrom(address, address, uint256) external virtual override {
        revert("Not implemented");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external virtual override {
        revert("Not implemented");
    }

    function transferFrom(address, address, uint256) external virtual override {
        revert("Not implemented");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721Metadata).interfaceId || super.supportsInterface(interfaceId);
    }
}

/* ===== NANdARTGallery ===== */
contract NANdARTGallery is Ownable, ERC721MetadataMinimal, ERC2981 {
    uint256 public tokenCounter;
    address public curador;

    mapping(address => bool) public isWhitelisted;
    mapping(uint256 => address) public contratosDeRoyalties;

    event ObraCunhada(address artista, uint256 tokenId, address contratoRoyalties);
    event CuradorAlterado(address novoCurador);
    event WhitelistAdicionado(address utilizador);
    event WhitelistRemovido(address utilizador);

    modifier apenasCurador() {
        require(msg.sender == curador, "Apenas o curador pode");
        _;
    }

    constructor() {
        tokenCounter = 0;
        curador = msg.sender;
    }

    function definirCurador(address novoCurador) public onlyOwner {
        require(novoCurador != address(0), "Curador invalido");
        curador = novoCurador;
        emit CuradorAlterado(novoCurador);
    }

    function adicionarAWhitelist(address utilizador) public apenasCurador {
        require(utilizador != address(0), "Endereco invalido");
        isWhitelisted[utilizador] = true;
        emit WhitelistAdicionado(utilizador);
    }

    function removerDaWhitelist(address utilizador) public apenasCurador {
        isWhitelisted[utilizador] = false;
        emit WhitelistRemovido(utilizador);
    }

    function mintComCuradoria(address artista, string memory tokenURI_) public apenasCurador {
        require(bytes(tokenURI_).length > 0, "URI obrigatoria");
        require(artista != address(0), "Artista invalido");

        uint256 tokenId = tokenCounter;

        _mint(artista, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        RoyaltySplitter splitter = new RoyaltySplitter(
            address(this),
            artista,
            4000,
            6000
        );

        contratosDeRoyalties[tokenId] = address(splitter);
        _setTokenRoyalty(tokenId, address(splitter), 1000);

        emit ObraCunhada(artista, tokenId, address(splitter));

        tokenCounter++;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721MetadataMinimal, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
