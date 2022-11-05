const { ethers } = require("hardhat");
const { BUENACHICA_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

    const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
    const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
    await fakeNftMarketplace.deployed();

    console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);
    //0x29955F19C6c6a3d8b2995689cfFE481320c245dc

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