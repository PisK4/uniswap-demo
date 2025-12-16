import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of UniswapV3 Periphery contracts...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Load deployment info to get factory and WETH addresses
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error("Deployment file not found. Please deploy WETH and V3 Factory first.");
    }

    const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!deployment.weth) {
        throw new Error("WETH address not found. Please deploy WETH first.");
    }

    if (!deployment.v3?.factory) {
        throw new Error("V3 Factory address not found. Please deploy V3 Factory first.");
    }

    console.log("Using Factory address:", deployment.v3.factory);
    console.log("Using WETH address:", deployment.weth);

    // 1. Deploy SwapRouter
    console.log("\n1. Deploying SwapRouter...");
    const SwapRouter = await ethers.getContractFactory(
        "@uniswap/v3-periphery/contracts/SwapRouter.sol:SwapRouter"
    );
    const swapRouter = await SwapRouter.deploy(
        deployment.v3.factory,
        deployment.weth
    );
    await swapRouter.waitForDeployment();
    const swapRouterAddress = await swapRouter.getAddress();
    console.log("SwapRouter deployed:", swapRouterAddress);

    // 2. Deploy NonfungibleTokenPositionDescriptor
    console.log("\n2. Deploying NonfungibleTokenPositionDescriptor...");
    const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory(
        "@uniswap/v3-periphery/contracts/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor"
    );
    const descriptor = await NonfungibleTokenPositionDescriptor.deploy(
        deployment.weth,
        ethers.encodeBytes32String("ETH") // nativeCurrencyLabelBytes
    );
    await descriptor.waitForDeployment();
    const descriptorAddress = await descriptor.getAddress();
    console.log("NonfungibleTokenPositionDescriptor deployed:", descriptorAddress);

    // 3. Deploy NonfungiblePositionManager
    console.log("\n3. Deploying NonfungiblePositionManager...");
    const NonfungiblePositionManager = await ethers.getContractFactory(
        "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol:NonfungiblePositionManager"
    );
    const positionManager = await NonfungiblePositionManager.deploy(
        deployment.v3.factory,
        deployment.weth,
        descriptorAddress
    );
    await positionManager.waitForDeployment();
    const positionManagerAddress = await positionManager.getAddress();
    console.log("NonfungiblePositionManager deployed:", positionManagerAddress);

    // Update deployment info
    deployment.v3 = {
        ...deployment.v3,
        swapRouter: swapRouterAddress,
        nftDescriptor: descriptorAddress,
        positionManager: positionManagerAddress
    };

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\n✅ All V3 Periphery contracts deployed!`);
    console.log(`Deployment info updated in: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
