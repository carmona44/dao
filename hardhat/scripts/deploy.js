const { ethers } = require("hardhat");
const { BUENACHICA_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

    const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
    const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
    await fakeNftMarketplace.deployed();

    console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);

    const VodkaDAOContract = await ethers.getContractFactory("VodkaDAO");
    const vodkaDAO = await VodkaDAOContract.deploy(fakeNftMarketplace.address, BUENACHICA_NFT_CONTRACT_ADDRESS, { value: ethers.utils.parseEther("0.1") });
    await vodkaDAO.deployed();

    console.log("VodkaDAO deployed to: ", vodkaDAO.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });