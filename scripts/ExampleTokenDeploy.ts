import { network } from "hardhat";
import { ethers, run } from "hardhat";
import { verifyContract } from "./utils";

async function main() {
    console.log("Starting deployment of ExampleToken contract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    const ExampleToken = await ethers.getContractFactory("ExampleToken");
    const token = await ExampleToken.deploy(
        "Example Token", // name
        "EXT", // symbol
        ethers.parseEther("1000000") // initial supply: 1,000,000 tokens
    );

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    console.log("ExampleToken deployed successfully!");
    console.log("Contract address:", tokenAddress);

    // Print contract information
    console.log("\nContract Information:");
    console.log("- Name:", await token.name());
    console.log("- Symbol:", await token.symbol());
    console.log("- Total Supply:", ethers.formatEther(await token.totalSupply()), "EXT");
    console.log("- Deployer Balance:", ethers.formatEther(await token.balanceOf(deployer.address)), "EXT");

    const currentChainID = await ethers.provider.getNetwork();
    console.log("Current chain ID:", currentChainID.chainId);

    // Skip verification on local chain
    if (currentChainID.chainId == 31337n) {
        console.log("Skipping verification on local chain");
        return;
    }

    // Verify the contract
    console.log("\nVerifying contract...");
    await verifyContract(tokenAddress, [
        "Example Token",
        "EXT",
        ethers.parseEther("1000000")
    ]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 