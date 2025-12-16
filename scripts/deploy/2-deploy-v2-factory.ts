import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of UniswapV2Factory contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Deploy UniswapV2Factory
    const UniswapV2Factory = await ethers.getContractFactory(
        "@uniswap/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory"
    );
    const factory = await UniswapV2Factory.deploy(deployer.address); // feeToSetter

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("UniswapV2Factory deployed successfully!");
    console.log("Contract address:", factoryAddress);
    console.log("Fee To Setter:", deployer.address);

    // Load and update deployment info
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    let deployment: any = {};
    if (fs.existsSync(filePath)) {
        deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    deployment.v2 = {
        ...deployment.v2,
        factory: factoryAddress,
        feeToSetter: deployer.address
    };

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info updated in: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
