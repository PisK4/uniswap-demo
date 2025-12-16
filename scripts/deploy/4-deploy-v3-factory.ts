import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of UniswapV3Factory contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Deploy UniswapV3Factory
    const UniswapV3Factory = await ethers.getContractFactory(
        "@uniswap/v3-core/contracts/UniswapV3Factory.sol:UniswapV3Factory"
    );
    const factory = await UniswapV3Factory.deploy();

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("UniswapV3Factory deployed successfully!");
    console.log("Contract address:", factoryAddress);

    // Load and update deployment info
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    let deployment: any = {};
    if (fs.existsSync(filePath)) {
        deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    deployment.v3 = {
        ...deployment.v3,
        factory: factoryAddress
    };

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info updated in: ${filePath}`);
    console.log("\nNote: V3 Factory automatically enables fee tiers: 500, 3000, 10000");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
