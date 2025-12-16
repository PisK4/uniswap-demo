import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import UniswapV3FactoryArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import UniswapV3PoolArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";

async function main() {
    console.log("Creating Uniswap V3 Pool...");

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

    if (!deployment.v3?.factory) {
        throw new Error("V3 Factory address not found.");
    }

    if (!deployment.testTokens?.tokenA || !deployment.testTokens?.tokenB) {
        throw new Error("Test tokens not found. Please deploy test tokens first.");
    }

    const factoryAddress = deployment.v3.factory;
    const tokenA = deployment.testTokens.tokenA;
    const tokenB = deployment.testTokens.tokenB;
    const fee = 3000; // 0.3% fee tier

    console.log("\nFactory:", factoryAddress);
    console.log("Token A:", tokenA);
    console.log("Token B:", tokenB);
    console.log("Fee:", fee);

    // Get factory contract
    const factory = new ethers.Contract(
        factoryAddress,
        UniswapV3FactoryArtifact.abi,
        deployer
    );

    // Check if pool already exists
    const existingPool = await factory.getPool(tokenA, tokenB, fee);
    if (existingPool !== ethers.ZeroAddress) {
        console.log("\n⚠️  Pool already exists:", existingPool);

        // Check if initialized
        const pool = new ethers.Contract(
            existingPool,
            UniswapV3PoolArtifact.abi,
            deployer
        );
        const slot0 = await pool.slot0();
        if (slot0.sqrtPriceX96 > 0n) {
            console.log("Pool is already initialized");
            console.log("Current sqrt price:", slot0.sqrtPriceX96.toString());
        } else {
            console.log("Pool exists but not initialized. Initializing...");
            await initializePool(pool);
        }
        return;
    }

    // Create pool
    console.log("\nCreating pool...");
    const createTx = await factory.createPool(tokenA, tokenB, fee);
    console.log("Transaction hash:", createTx.hash);

    await createTx.wait();
    console.log("✅ Pool created!");

    // Get pool address
    const poolAddress = await factory.getPool(tokenA, tokenB, fee);
    console.log("Pool address:", poolAddress);

    // Initialize pool with 1:1 price
    const pool = new ethers.Contract(
        poolAddress,
        UniswapV3PoolArtifact.abi,
        deployer
    );

    await initializePool(pool);

    // Update deployment file
    deployment.v3.pools = deployment.v3.pools || [];
    deployment.v3.pools.push({
        tokenA,
        tokenB,
        fee,
        pool: poolAddress,
        initialPrice: "1:1",
        createdAt: new Date().toISOString()
    });

    fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info updated in: ${filePath}`);
}

async function initializePool(pool: any) {
    console.log("\nInitializing pool with 1:1 price...");

    // sqrtPriceX96 = sqrt(price) * 2^96
    // For 1:1 price, sqrt(1) = 1, so sqrtPriceX96 = 1 * 2^96
    const sqrtPriceX96 = "79228162514264337593543950336"; // 2^96

    const initTx = await pool.initialize(sqrtPriceX96);
    console.log("Initialize transaction hash:", initTx.hash);

    await initTx.wait();
    console.log("✅ Pool initialized successfully!");
    console.log("Initial price: 1:1");
    console.log("sqrtPriceX96:", sqrtPriceX96);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
