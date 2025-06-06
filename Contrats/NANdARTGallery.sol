// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NANdARTGallery is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    uint256 public tokenCounter;
    address payable public galerieWallet;

    // Royalties
    uint96 public constant ROYALTY_GALERIE_PRIMARY = 1000;    // 10%
    uint96 public constant ROYALTY_ARTIST_SECONDARY = 600;    // 6%
    uint96 public constant ROYALTY_GALERIE_SECONDARY = 400;   // 4%

    struct ArtWork {
        address payable artist;
        uint256 price;
        bool premiumActive;
    }

    mapping(uint256 => ArtWork) public artworks;

    // Whitelist de curadores
    mapping(address => bool) public isWhitelisted;

    // Modificador para curadores
    modifier onlyCurator() {
        require(isWhitelisted[msg.sender], "Nao esta autorizado como curador");
        _;
    }

    // Eventos
    event ArtMinted(uint256 indexed tokenId, address indexed artist, uint256 price);
    event PremiumActivated(uint256 indexed tokenId);

    constructor(address payable _galerieWallet) ERC721("NANdART Gallery", "NANDART") {
        tokenCounter = 1;
        galerieWallet = _galerieWallet;
    }

    // Cunhagem pela galeria (admin)
    function mintForArtist(address payable artist, uint256 price) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter;
        _safeMint(galerieWallet, tokenId);

        artworks[tokenId] = ArtWork({
            artist: artist,
            price: price,
            premiumActive: false
        });

        _setTokenRoyalty(tokenId, galerieWallet, ROYALTY_GALERIE_PRIMARY + ROYALTY_ARTIST_SECONDARY + ROYALTY_GALERIE_SECONDARY);

        emit ArtMinted(tokenId, artist, price);
        tokenCounter++;
        return tokenId;
    }

    // Cunhagem com curadoria
    function mintComCuradoria(address payable artist, string memory tokenURI_) external payable onlyCurator returns (uint256) {
        uint256 tokenId = tokenCounter;
        _safeMint(galerieWallet, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        artworks[tokenId] = ArtWork({
            artist: artist,
            price: msg.value,
            premiumActive: false
        });

        _setTokenRoyalty(tokenId, galerieWallet, ROYALTY_GALERIE_PRIMARY + ROYALTY_ARTIST_SECONDARY + ROYALTY_GALERIE_SECONDARY);

        emit ArtMinted(tokenId, artist, msg.value);
        tokenCounter++;
        return tokenId;
    }

    // Compra primária
    function buy(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token nao existe");
        ArtWork storage art = artworks[tokenId];
        require(ownerOf(tokenId) == galerieWallet, "Token nao esta a venda");
        require(msg.value >= art.price, "Valor insuficiente");

        _transfer(galerieWallet, msg.sender, tokenId);

        uint256 valor = msg.value;
        uint256 galeriaAmount = (valor * ROYALTY_GALERIE_PRIMARY) / 10000;
        uint256 artistaAmount = (valor * ROYALTY_ARTIST_SECONDARY) / 10000;
        uint256 restante = valor - galeriaAmount - artistaAmount;

        galerieWallet.transfer(galeriaAmount + restante);
        art.artist.transfer(artistaAmount);
    }

    // Ativar destaque premium
    function activatePremium(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token nao existe");
        uint256 premiumPrice = 0.1 ether;
        require(msg.value >= premiumPrice, "Pagamento insuficiente");

        artworks[tokenId].premiumActive = true;
        galerieWallet.transfer(msg.value);

        emit PremiumActivated(tokenId);
    }

    function isPremiumActive(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token nao existe");
        return artworks[tokenId].premiumActive;
    }

    function setGalerieWallet(address payable newWallet) external onlyOwner {
        galerieWallet = newWallet;
    }

    // Whitelist: adicionar e remover curadores
    function adicionarCurador(address curador) external onlyOwner {
        isWhitelisted[curador] = true;
    }

    function removerCurador(address curador) external onlyOwner {
        isWhitelisted[curador] = false;
    }

    // Suporte ERC721 + ERC2981
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
