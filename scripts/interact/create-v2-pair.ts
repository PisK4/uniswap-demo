import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import UniswapV2FactoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";

async function main() {
    console.log("Creating Uniswap V2 Pair...");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    // Load deployment info
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(__dirname, "../../deployments", fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error("Deployment file not found. Please deploy contracts first.");
    }

    const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!deployment.v2?.factory) {
        throw new Error("V2 Factory address not found.");
    }

    if (!deployment.testTokens?.tokenA || !deployment.testTokens?.tokenB) {
        throw new Error("Test tokens not found. Please deploy test tokens first.");
    }

    const factoryAddress = deployment.v2.factory;
    const tokenA = deployment.testTokens.tokenA;
    const tokenB = deployment.testTokens.tokenB;

    console.log("\nFactory:", factoryAddress);
    console.log("Token A:", tokenA);
    console.log("Token B:", tokenB);

    // Get factory contract
    const factory = new ethers.Contract(
        factoryAddress,
        UniswapV2FactoryArtifact.abi,
        deployer
    );

    // Check if pair already exists
    const existingPair = await factory.getPair(tokenA, tokenB);
    if (existingPair !== ethers.ZeroAddress) {
        console.log("\n⚠️  Pair already exists:", existingPair);
        return;
    }

    // Create pair
    console.log("\n Creating pair...");
    const tx = await factory.createPair(tokenA, tokenB);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Get pair address
    const pairAddress = await factory.getPair(tokenA, tokenB);
    console.log("\n✅ Pair created successfully!");
    console.log("Pair address:", pairAddress);

    // Update deployment file
    deployment.v2.pairs = deployment.v2.pairs || [];
    deployment.v2.pairs.push({
        tokenA,
        tokenB,
        pair: pairAddress,
        createdAt: new Date().toISOString()
    });

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info updated in: ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
