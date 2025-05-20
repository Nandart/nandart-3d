// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Importações OpenZeppelin para ERC721 e royalties
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NANdARTGallery is ERC721Royalty, Ownable, ReentrancyGuard {
    uint256 public tokenCounter;
    address payable public galerieWallet;

    // Royalties em basis points (bps, 10000 = 100%)
    uint96 public constant ROYALTY_GALERIE_PRIMARY = 1000;    // 10% na primeira venda
    uint96 public constant ROYALTY_ARTIST_SECONDARY = 600;    // 6% em revendas
    uint96 public constant ROYALTY_GALERIE_SECONDARY = 400;   // 4% em revendas

    struct ArtWork {
        address payable artist;
        uint256 price;       // Preço da venda primária em wei
        bool premiumActive;  // Indica se o destaque premium está ativo
    }

    mapping(uint256 => ArtWork) public artworks;

    event ArtMinted(uint256 indexed tokenId, address indexed artist, uint256 price);
    event PremiumActivated(uint256 indexed tokenId);

    constructor(address payable _galerieWallet) ERC721("NANdART Gallery", "NANDART") {
        tokenCounter = 1;
        galerieWallet = _galerieWallet;
    }

    // Mint inicial feito pela galeria para um artista, atribuindo preço inicial
    function mintForArtist(address payable artist, uint256 price) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter;
        _safeMint(galerieWallet, tokenId);

        artworks[tokenId] = ArtWork({
            artist: artist,
            price: price,
            premiumActive: false
        });

        // Define royalties padrão para revendas no contrato
        _setTokenRoyalty(tokenId, galerieWallet, ROYALTY_GALERIE_PRIMARY + ROYALTY_ARTIST_SECONDARY + ROYALTY_GALERIE_SECONDARY);

        emit ArtMinted(tokenId, artist, price);
        tokenCounter++;
        return tokenId;
    }

    // Compra primária do NFT
    function buy(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token nao existe");
        ArtWork storage art = artworks[tokenId];
        require(ownerOf(tokenId) == galerieWallet, "Token nao esta a venda");
        require(msg.value >= art.price, "Valor insuficiente");

        // Transferir NFT para comprador
        _transfer(galerieWallet, msg.sender, tokenId);

        // Distribuir fundos
        uint256 valor = msg.value;
        uint256 galeriaAmount = (valor * ROYALTY_GALERIE_PRIMARY) / 10000;
        uint256 artistaAmount = (valor * ROYALTY_ARTIST_SECONDARY) / 10000;
        uint256 restante = valor - galeriaAmount - artistaAmount;

        galerieWallet.transfer(galeriaAmount + restante);
        art.artist.transfer(artistaAmount);
    }

    // Ativar destaque premium mediante pagamento
    function activatePremium(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token nao existe");
        uint256 premiumPrice = 0.1 ether; // valor fixo, pode ser ajustado
        require(msg.value >= premiumPrice, "Pagamento insuficiente");

        artworks[tokenId].premiumActive = true;
        galerieWallet.transfer(msg.value);

        emit PremiumActivated(tokenId);
    }

    // Consulta se o destaque premium está ativo
    function isPremiumActive(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token nao existe");
        return artworks[tokenId].premiumActive;
    }

    // Permite ao proprietário alterar a wallet da galeria
    function setGalerieWallet(address payable newWallet) external onlyOwner {
        galerieWallet = newWallet;
    }

    // Override para suportar ERC2981 e ERC721
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 
