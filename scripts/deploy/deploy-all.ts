import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Import Uniswap artifacts from npm packages
import UniswapV2FactoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";
import UniswapV2Router02Artifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import UniswapV3FactoryArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import SwapRouterArtifact from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import NFTDescriptorArtifact from "@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json";
import NonfungibleTokenPositionDescriptorArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json";
import NonfungiblePositionManagerArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";

async function main() {
    console.log("=".repeat(80));
    console.log("Starting Full Deployment of Uniswap V2/V3 to Edge Testnet");
    console.log("=".repeat(80));

    const [deployer] = await ethers.getSigners();
    console.log("\nDeployer account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.1")) {
        console.warn("\n⚠️  WARNING: Balance is low. Deployment may fail due to insufficient gas.");
    }

    const startTime = Date.now();

    // Step 1: Deploy WETH9
    console.log("\n" + "=".repeat(80));
    console.log("Step 1/6: Deploying WETH9");
    console.log("=".repeat(80));
    const WETH9 = await ethers.getContractFactory("WETH9");
    const weth = await WETH9.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("✅ WETH9 deployed:", wethAddress);

    // Step 2: Deploy UniswapV2Factory
    console.log("\n" + "=".repeat(80));
    console.log("Step 2/6: Deploying UniswapV2Factory");
    console.log("=".repeat(80));
    const UniswapV2Factory = new ethers.ContractFactory(
        UniswapV2FactoryArtifact.abi,
        UniswapV2FactoryArtifact.bytecode,
        deployer
    );
    const v2Factory = await UniswapV2Factory.deploy(deployer.address);
    await v2Factory.waitForDeployment();
    const v2FactoryAddress = await v2Factory.getAddress();
    console.log("✅ UniswapV2Factory deployed:", v2FactoryAddress);

    // Step 3: Deploy UniswapV2Router02
    console.log("\n" + "=".repeat(80));
    console.log("Step 3/6: Deploying UniswapV2Router02");
    console.log("=".repeat(80));
    const UniswapV2Router02 = new ethers.ContractFactory(
        UniswapV2Router02Artifact.abi,
        UniswapV2Router02Artifact.bytecode,
        deployer
    );
    const v2Router = await UniswapV2Router02.deploy(v2FactoryAddress, wethAddress);
    await v2Router.waitForDeployment();
    const v2RouterAddress = await v2Router.getAddress();
    console.log("✅ UniswapV2Router02 deployed:", v2RouterAddress);

    // Step 4: Deploy UniswapV3Factory
    console.log("\n" + "=".repeat(80));
    console.log("Step 4/6: Deploying UniswapV3Factory");
    console.log("=".repeat(80));
    const UniswapV3Factory = new ethers.ContractFactory(
        UniswapV3FactoryArtifact.abi,
        UniswapV3FactoryArtifact.bytecode,
        deployer
    );
    const v3Factory = await UniswapV3Factory.deploy();
    await v3Factory.waitForDeployment();
    const v3FactoryAddress = await v3Factory.getAddress();
    console.log("✅ UniswapV3Factory deployed:", v3FactoryAddress);

    // Step 5: Deploy V3 Periphery Contracts
    console.log("\n" + "=".repeat(80));
    console.log("Step 5/6: Deploying UniswapV3 Periphery Contracts");
    console.log("=".repeat(80));

    console.log("\n  5.1: Deploying SwapRouter...");
    const SwapRouter = new ethers.ContractFactory(
        SwapRouterArtifact.abi,
        SwapRouterArtifact.bytecode,
        deployer
    );
    const swapRouter = await SwapRouter.deploy(v3FactoryAddress, wethAddress);
    await swapRouter.waitForDeployment();
    const swapRouterAddress = await swapRouter.getAddress();
    console.log("  ✅ SwapRouter deployed:", swapRouterAddress);

    console.log("\n  5.2: Deploying NFTDescriptor library...");
    const NFTDescriptor = new ethers.ContractFactory(
        NFTDescriptorArtifact.abi,
        NFTDescriptorArtifact.bytecode,
        deployer
    );
    const nftDescriptorLib = await NFTDescriptor.deploy();
    await nftDescriptorLib.waitForDeployment();
    const nftDescriptorLibAddress = await nftDescriptorLib.getAddress();
    console.log("  ✅ NFTDescriptor library deployed:", nftDescriptorLibAddress);

    console.log("\n  5.3: Deploying NonfungibleTokenPositionDescriptor...");
    // Link the NFTDescriptor library
    const linkedBytecode = NonfungibleTokenPositionDescriptorArtifact.bytecode.replace(
        /__\$[a-fA-F0-9]{34}\$__/g,
        nftDescriptorLibAddress.slice(2)
    );
    const NonfungibleTokenPositionDescriptor = new ethers.ContractFactory(
        NonfungibleTokenPositionDescriptorArtifact.abi,
        linkedBytecode,
        deployer
    );
    const descriptor = await NonfungibleTokenPositionDescriptor.deploy(
        wethAddress,
        ethers.encodeBytes32String("ETH")
    );
    await descriptor.waitForDeployment();
    const descriptorAddress = await descriptor.getAddress();
    console.log("  ✅ NonfungibleTokenPositionDescriptor deployed:", descriptorAddress);

    console.log("\n  5.4: Deploying NonfungiblePositionManager...");
    const NonfungiblePositionManager = new ethers.ContractFactory(
        NonfungiblePositionManagerArtifact.abi,
        NonfungiblePositionManagerArtifact.bytecode,
        deployer
    );
    const positionManager = await NonfungiblePositionManager.deploy(
        v3FactoryAddress,
        wethAddress,
        descriptorAddress
    );
    await positionManager.waitForDeployment();
    const positionManagerAddress = await positionManager.getAddress();
    console.log("  ✅ NonfungiblePositionManager deployed:", positionManagerAddress);

    // Step 6: Deploy Test Tokens
    console.log("\n" + "=".repeat(80));
    console.log("Step 6/6: Deploying Test Tokens");
    console.log("=".repeat(80));

    const TestToken = await ethers.getContractFactory("TestToken");

    console.log("\n  6.1: Deploying Test Token A...");
    const tokenA = await TestToken.deploy(
        "Test Token A",
        "TKA",
        ethers.parseEther("1000000")
    );
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("  ✅ Test Token A deployed:", tokenAAddress);

    console.log("\n  6.2: Deploying Test Token B...");
    const tokenB = await TestToken.deploy(
        "Test Token B",
        "TKB",
        ethers.parseEther("1000000")
    );
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("  ✅ Test Token B deployed:", tokenBAddress);

    // Save deployment info
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const networkName = (await ethers.provider.getNetwork()).name;

    const deploymentInfo = {
        network: networkName,
        chainId: Number(chainId),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        weth: wethAddress,
        v2: {
            factory: v2FactoryAddress,
            router: v2RouterAddress,
            feeToSetter: deployer.address
        },
        v3: {
            factory: v3FactoryAddress,
            swapRouter: swapRouterAddress,
            nftDescriptorLib: nftDescriptorLibAddress,
            nftDescriptor: descriptorAddress,
            positionManager: positionManagerAddress
        },
        testTokens: {
            tokenA: tokenAAddress,
            tokenB: tokenBAddress
        }
    };

    const deploymentPath = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const fileName = chainId === 33431n ? "edge-testnet.json" : `deployment-${chainId}.json`;
    const filePath = path.join(deploymentPath, fileName);

    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(80));
    console.log("✅ DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log(`\nTotal deployment time: ${duration}s`);
    console.log(`\nDeployment info saved to: ${filePath}`);
    console.log("\n📄 Deployment Summary:");
    console.log("─".repeat(80));
    console.log("WETH9:                        ", wethAddress);
    console.log("─".repeat(80));
    console.log("UniswapV2Factory:             ", v2FactoryAddress);
    console.log("UniswapV2Router02:            ", v2RouterAddress);
    console.log("─".repeat(80));
    console.log("UniswapV3Factory:             ", v3FactoryAddress);
    console.log("UniswapV3 SwapRouter:         ", swapRouterAddress);
    console.log("UniswapV3 NFT Descriptor:     ", descriptorAddress);
    console.log("UniswapV3 Position Manager:   ", positionManagerAddress);
    console.log("─".repeat(80));
    console.log("Test Token A (TKA):           ", tokenAAddress);
    console.log("Test Token B (TKB):           ", tokenBAddress);
    console.log("=".repeat(80));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
