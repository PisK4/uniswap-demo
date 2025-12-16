import { expect } from "chai";
import { ethers } from "hardhat";
import { ExampleToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ExampleToken", function () {
    let token: ExampleToken;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;

    const TOKEN_NAME = "Example Token";
    const TOKEN_SYMBOL = "EXT";
    const INITIAL_SUPPLY = ethers.parseEther("1000000");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const ExampleToken = await ethers.getContractFactory("ExampleToken");
        token = await ExampleToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
    });

    describe("Deployment", function () {
        it("should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(TOKEN_NAME);
            expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("should assign the initial supply to the deployer", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance).to.equal(INITIAL_SUPPLY);
        });

        it("should set up roles correctly", async function () {
            expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await token.hasRole(await token.MINTER_ROLE(), owner.address)).to.be.true;
            expect(await token.hasRole(await token.PAUSER_ROLE(), owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("should only allow minters to mint tokens", async function () {
            await expect(token.connect(addr1).mint(addr2.address, 100))
                .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");

            await token.mint(addr2.address, 100);
            expect(await token.balanceOf(addr2.address)).to.equal(100);
        });
    });

    describe("Pausing", function () {
        it("should only allow pausers to pause and unpause", async function () {
            await expect(token.connect(addr1).pause())
                .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");

            await token.pause();
            expect(await token.paused()).to.be.true;

            await expect(token.connect(addr1).unpause())
                .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");

            await token.unpause();
            expect(await token.paused()).to.be.false;
        });

        it("should prevent transfers while paused", async function () {
            await token.transfer(addr1.address, 100);
            await token.pause();

            await expect(token.connect(addr1).transfer(addr2.address, 50))
                .to.be.revertedWithCustomError(token, "EnforcedPause");

            await token.unpause();
            await token.connect(addr1).transfer(addr2.address, 50);
            expect(await token.balanceOf(addr2.address)).to.equal(50);
        });
    });

    describe("Burning", function () {
        it("should allow token holders to burn their tokens", async function () {
            await token.transfer(addr1.address, 100);
            await token.connect(addr1).burn(50);

            expect(await token.balanceOf(addr1.address)).to.equal(50);
        });

        it("should not allow burning more tokens than balance", async function () {
            await token.transfer(addr1.address, 100);
            await expect(token.connect(addr1).burn(150))
                .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
        });
    });
}); 