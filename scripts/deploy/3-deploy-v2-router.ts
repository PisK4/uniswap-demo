import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of UniswapV2Router02 contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Load deployment info to get factory and WETH addresses
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error("Deployment file not found. Please deploy WETH and V2 Factory first.");
    }

    const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!deployment.weth) {
        throw new Error("WETH address not found. Please deploy WETH first.");
    }

    if (!deployment.v2?.factory) {
        throw new Error("V2 Factory address not found. Please deploy V2 Factory first.");
    }

    console.log("Using Factory address:", deployment.v2.factory);
    console.log("Using WETH address:", deployment.weth);

    // Deploy UniswapV2Router02
    const UniswapV2Router02 = await ethers.getContractFactory(
        "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol:UniswapV2Router02"
    );
    const router = await UniswapV2Router02.deploy(
        deployment.v2.factory,
        deployment.weth
    );

    await router.waitForDeployment();
    const routerAddress = await router.getAddress();

    console.log("UniswapV2Router02 deployed successfully!");
    console.log("Contract address:", routerAddress);

    // Update deployment info
    deployment.v2.router = routerAddress;

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info updated in: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
