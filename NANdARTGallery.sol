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

/* ===== Interfaces ERC721 ===== */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

/* ===== ERC165 ===== */
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

/* ===== Royalty Standard ===== */
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

    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view override returns (address, uint256) {
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

    constructor(address _galeria, address _artista, uint96 _percentGaleria, uint96 _percentArtista) {
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

/* ===== NANdARTGallery ===== */
contract NANdARTGallery is Ownable, ERC165, IERC721Metadata, ERC2981 {
    string public constant override name = "NANdART Gallery";
    string public constant override symbol = "NART";

    uint256 public tokenCounter;
    address public curador;

    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => address) public contratosDeRoyalties;

    modifier apenasCurador() {
        require(msg.sender == curador, "Apenas o curador pode");
        _;
    }

    constructor() {
        tokenCounter = 0;
        curador = msg.sender;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165, ERC2981) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "Endereco invalido");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token inexistente");
        return owner;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token inexistente");
        return _tokenURIs[tokenId];
    }

    function approve(address to, uint256 tokenId) public override {
        address owner = ownerOf(tokenId);
        require(to != owner, "Aprovar o proprio dono");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Nao autorizado");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Token inexistente");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Nao autorizado");
        require(to != address(0), "Endereco invalido");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        transferFrom(from, to, tokenId);
        require(
            to.code.length == 0 || IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) == IERC721Receiver.onERC721Received.selector,
            "Destino nao implementa ERC721Receiver"
        );
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Nao e o dono");

        _approve(address(0), tokenId);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function mintComCuradoria(address artista, string memory uri) public apenasCurador {
        require(bytes(uri).length > 0, "URI obrigatoria");
        require(artista != address(0), "Artista invalido");

        uint256 tokenId = tokenCounter;
        _owners[tokenId] = artista;
        _balances[artista] += 1;
        _tokenURIs[tokenId] = uri;

        emit Transfer(address(0), artista, tokenId);

        RoyaltySplitter splitter = new RoyaltySplitter(address(this), artista, 4000, 6000);
        contratosDeRoyalties[tokenId] = address(splitter);
        _setTokenRoyalty(tokenId, address(splitter), 1000);

        tokenCounter++;
    }

    function contratoDeRoyalties(uint256 tokenId) public view returns (address) {
        return contratosDeRoyalties[tokenId];
    }

    function definirCurador(address novoCurador) public onlyOwner {
        require(novoCurador != address(0), "Curador invalido");
        curador = novoCurador;
    }
}
