import { ethers, run } from "hardhat";

/**
 * Verify the deployed contract
 * @param address Contract address
 * @param constructorArguments Constructor arguments
 */
export async function verifyContract(address: string, constructorArguments: any[] = []) {
    try {
        const network = await ethers.provider.getNetwork();
        const networkName = network.name;

        console.log(`Verifying contract on ${networkName}...`);
        console.log("Contract address:", address);

        await run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });

        console.log("Contract verified successfully!");
    } catch (error: any) {
        if (error?.message?.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified!");
        } else if (error?.message?.includes("vyper")) {
            console.log("Vyper contracts are not supported by hardhat-etherscan");
        } else {
            console.error("Verification failed:", error);
            console.log("Continuing deployment process...");
        }
    }
} 