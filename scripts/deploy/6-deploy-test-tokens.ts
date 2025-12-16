import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting deployment of Test Tokens...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");

    // Deploy Token A
    console.log("\n1. Deploying Test Token A...");
    const tokenA = await TestToken.deploy(
        "Test Token A",
        "TKA",
        ethers.parseEther("1000000") // 1,000,000 tokens
    );
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("Test Token A deployed:", tokenAAddress);

    // Deploy Token B
    console.log("\n2. Deploying Test Token B...");
    const tokenB = await TestToken.deploy(
        "Test Token B",
        "TKB",
        ethers.parseEther("1000000") // 1,000,000 tokens
    );
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("Test Token B deployed:", tokenBAddress);

    // Load and update deployment info
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    let deployment: any = {};
    if (fs.existsSync(filePath)) {
        deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    deployment.testTokens = {
        tokenA: tokenAAddress,
        tokenB: tokenBAddress
    };

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\n✅ Test tokens deployed successfully!`);
    console.log(`Deployment info updated in: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
