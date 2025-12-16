import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of WETH9 contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Deploy WETH9
    const WETH9 = await ethers.getContractFactory("WETH9");
    const weth = await WETH9.deploy();

    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();

    console.log("WETH9 deployed successfully!");
    console.log("Contract address:", wethAddress);

    // Save deployment info
    const networkName = (await ethers.provider.getNetwork()).name;
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const deploymentInfo = {
        network: networkName,
        chainId: Number(chainId),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        weth: wethAddress
    };

    const deploymentPath = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(deploymentPath, fileName);

    // Load existing deployment or create new one
    let existingDeployment = {};
    if (fs.existsSync(filePath)) {
        existingDeployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    // Merge with existing deployment
    const updatedDeployment = {
        ...existingDeployment,
        ...deploymentInfo
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedDeployment, null, 2));
    console.log(`\nDeployment info saved to: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
