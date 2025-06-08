// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ==== IMPORTS DO OPENZEPPELIN VIA GITHUB ====
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/common/ERC2981.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";

// ==== CONTRATO DE SPLIT DE ROYALTIES ====
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

// ==== CONTRATO PRINCIPAL DA GALERIA ====
contract NANdARTGallery is ERC721URIStorage, Ownable, ERC2981 {
    uint256 public tokenCounter;
    address public curador;

    mapping(address => bool) public isWhitelisted;
    mapping(uint256 => address) public contratosDeRoyalties;

    modifier apenasCurador() {
        require(msg.sender == curador, "Somente o curador pode executar esta acao");
        _;
    }

    constructor() ERC721("NANdARTGallery", "NANdART") {
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

    function mintComCuradoria(address artista, string memory tokenURI_) public apenasCurador {
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
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
