# Uniswap V2/V3 部署与前端开发实施计划

## 📊 项目进度追踪

**最后更新时间**: 2025-12-16 11:28 UTC+8

### 总体进度：40% 完成 ✅✅◐○○

| 阶段 | 状态 | 完成度 | 备注 |
|------|------|--------|------|
| **阶段1: 重构合约结构** | ✅ 已完成 | 100% | 采用 @uniswap npm 包方案 |
| **阶段2: 编写部署脚本** | ✅ 已完成 | 100% | 本地测试部署成功 |
| **阶段3: 测试链上交互** | ⏳ 待开始 | 0% | 需要先部署到 Edge Testnet |
| **阶段4: 开发前端** | ⏳ 待开始 | 0% | 等待合约部署完成 |
| **阶段5: 文档与部署** | ⏳ 待开始 | 0% | 等待前端开发完成 |

### 🎯 当前里程碑：本地部署测试成功

#### 已完成工作 (2025-12-16)

**阶段 1: 合约结构 ✅**
- ✅ 配置 hardhat.config.ts 支持多版本 Solidity (0.5.16, 0.6.6, 0.7.6, 0.8.27)
- ✅ 配置 Edge Testnet 网络 (chainId: 33431)
- ✅ 创建 TestToken.sol (contracts/token/TestToken.sol:1)
- ✅ 复制 WETH9.sol 到 shared 目录 (contracts/shared/WETH9.sol:1)
- ✅ 编译测试通过 (15 个 Solidity 文件)
- ✅ **架构决策**：直接使用 @uniswap npm 包的预编译 artifacts（无需重构目录）

**阶段 2: 部署脚本 ✅**
- ✅ 创建完整部署脚本目录结构 (scripts/deploy/ 和 scripts/interact/)
- ✅ 实现 WETH9 部署脚本 (scripts/deploy/1-deploy-weth.ts:1)
- ✅ 实现 V2 Factory/Router 部署脚本 (scripts/deploy/2-deploy-v2-factory.ts:1, scripts/deploy/3-deploy-v2-router.ts:1)
- ✅ 实现 V3 Factory/Periphery 部署脚本 (scripts/deploy/4-deploy-v3-factory.ts:1, scripts/deploy/5-deploy-v3-periphery.ts:1)
- ✅ 实现测试代币部署脚本 (scripts/deploy/6-deploy-test-tokens.ts:1)
- ✅ 实现一键部署脚本 (scripts/deploy/deploy-all.ts:1)
- ✅ 解决 NFTDescriptor 库链接问题
- ✅ 创建 V2 Pair 和 V3 Pool 交互脚本 (scripts/interact/create-v2-pair.ts:1, scripts/interact/create-v3-pool.ts:1)
- ✅ 更新 package.json 添加部署命令
- ✅ **本地 Hardhat 网络部署测试成功** 🎉

#### 本地部署测试结果 (localhost - chainId: 31337)

| 合约 | 地址 |
|------|------|
| WETH9 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| UniswapV2Factory | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| UniswapV2Router02 | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| UniswapV3Factory | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| SwapRouter | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| NFTDescriptor (库) | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| NonfungibleTokenPositionDescriptor | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| NonfungiblePositionManager | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |
| Test Token A (TKA) | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |
| Test Token B (TKB) | `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` |

**部署记录**: `deployments/deployment-31337.json`

### 🚀 下一步行动

**立即可执行任务**：
1. **测试创建 V2 Pair** (可在本地测试)
   ```bash
   pnpm interact:create-v2-pair --network localhost
   ```

2. **测试创建 V3 Pool** (可在本地测试)
   ```bash
   pnpm interact:create-v3-pool --network localhost
   ```

3. **部署到 Edge Testnet** (需要配置 .env 和 ETH)
   ```bash
   pnpm deploy:all
   ```

### ⚠️ 关键技术决策

1. **使用 @uniswap npm 包方案** ✅
   - 原计划：重构合约目录结构，复制所有合约文件
   - 实际采用：直接使用 npm 包的预编译 artifacts
   - 优势：简单可靠，代码经过官方审计，易于维护

2. **Ethers.js v6 兼容性** ✅
   - 所有部署脚本使用 Ethers.js v6 API
   - 使用 `new ethers.ContractFactory(abi, bytecode, signer)` 方式部署
   - 前端将使用 Viem (Wagmi v2 底层)，完全独立于 Ethers.js

3. **NFTDescriptor 库链接** ✅
   - V3 Periphery 依赖外部库 NFTDescriptor
   - 解决方案：先部署库，然后手动替换 bytecode 中的占位符进行链接

### 🔍 风险与缓解措施

| 风险 | 状态 | 缓解措施 |
|------|------|----------|
| Solidity 版本冲突 | ✅ 已解决 | 配置多版本编译器和 overrides |
| 合约架构混乱 | ✅ 已解决 | 使用 @uniswap npm 包 |
| V3 库链接问题 | ✅ 已解决 | 手动部署库并链接 bytecode |
| Edge Testnet gas 不足 | ⚠️ 待验证 | 准备 0.5 ETH，分步部署 |
| V3 初始化价格计算 | ⚠️ 待测试 | 使用 @uniswap/v3-sdk |

---

## 项目目标（CTO 交付的任务）

**核心任务**：调研 Uniswap V2/V3 的 factory 合约，部署到 Edge Testnet，维护部署地址和创建 pair/pool 的方式文档。

**本期范围**：
1. 部署 Uniswap V2 和 V3 的 Factory 合约到 Edge Testnet
2. 创建前端界面(将部署到 vercel )支持：
   - Mint 测试代币（用于演示）
   - **创建交易对/池（核心功能）**
3. 维护完整的部署文档和操作指南

**下一期功能**（本期不实现）：
- ❌ 添加流动性功能（V2 和 V3）
- ❌ Swap 交易功能
- ❌ 移除流动性功能

## 用户选择确认

- ✅ 部署版本：V2 和 V3 都部署
- ✅ 架构方案：精简部署（只保留核心合约）
- ✅ 前端技术栈：Next.js + RainbowKit + Wagmi + Viem
- ✅ **本期功能范围**：Mint 测试代币 + **创建交易对/池**（聚焦核心任务）

## 关键问题识别

### 当前项目的 3 个严重问题

1. **合约架构混乱**：v2-core、v3-core 等都是独立的 git 子项目，每个都有自己的 package.json 和 hardhat.config，会导致编译冲突
2. **Solidity 版本冲突**：V2 使用 0.5.16/0.6.6，V3 使用 0.7.6，但主配置只有 0.8.27
3. **缺少 Edge Testnet 配置**：hardhat.config.ts 中没有配置 Edge Testnet 网络（chainId: 33431）

---

## 实施方案（分 5 个阶段）

### 阶段 1：配置开发环境（0.5 天，优先级：最高）

#### 目标
配置多版本 Solidity 编译器，添加 Edge Testnet 网络配置，创建必要的测试合约。

**⚠️ 架构决策变更**：
- **原计划**：重构合约目录结构，复制所有 Uniswap 合约文件
- **实际采用**：直接使用 `@uniswap` npm 包的预编译 artifacts
- **原因**：更简单、更可靠、代码经过官方审计、易于维护

#### 1.1 使用 @uniswap npm 包方案

**已安装的依赖（package.json）：**
```json
"@uniswap/v2-core": "^1.0.1",
"@uniswap/v2-periphery": "1.1.0-beta.0",
"@uniswap/v3-core": "^1.0.1",
"@uniswap/v3-periphery": "^1.4.4"
```

**实际项目结构：**
```
contracts/
├── shared/
│   └── WETH9.sol (从 node_modules/@uniswap/v2-periphery 复制)
├── token/
│   ├── ExampleToken.sol (保持不变)
│   └── TestToken.sol (新建：简化版 ERC20，任何人可 mint)
├── v2-core/ (npm 包目录，保持不变)
├── v2-periphery/ (npm 包目录，保持不变)
├── v3-core/ (npm 包目录，保持不变)
└── v3-periphery/ (npm 包目录，保持不变)
```

**关键点**：
- ✅ **不需要**复制或重组 Uniswap 合约文件
- ✅ **不需要**删除子项目配置文件
- ✅ **不需要**修复 import 路径
- ✅ 只需创建 2 个自定义合约：WETH9.sol 和 TestToken.sol

#### 1.2 创建简化测试代币合约

**文件路径：** `contracts/token/TestToken.sol`

**实现要点：**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
    {
        _mint(msg.sender, initialSupply);
    }

    // 任何人都可以 mint
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
```

#### 1.3 配置多版本 Solidity 编译器

**文件路径：** `hardhat.config.ts`

**关键修改：**
```typescript
solidity: {
    compilers: [
        {
            version: "0.5.16",
            settings: {
                optimizer: { enabled: true, runs: 999999 } // V2 Core
            }
        },
        {
            version: "0.6.6",
            settings: {
                optimizer: { enabled: true, runs: 999999 } // V2 Periphery + WETH
            }
        },
        {
            version: "0.7.6",
            settings: {
                optimizer: { enabled: true, runs: 800 },
                metadata: { bytecodeHash: "none" } // V3 必需
            }
        },
        {
            version: "0.8.27",
            settings: {
                optimizer: { enabled: true, runs: 200 } // ExampleToken, TestToken
            }
        }
    ],
    overrides: {
        // npm 包路径配置
        "node_modules/@uniswap/v2-core/contracts/**/*.sol": {
            version: "0.5.16",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        },
        "node_modules/@uniswap/v2-periphery/contracts/**/*.sol": {
            version: "0.6.6",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        },
        "node_modules/@uniswap/v3-core/contracts/**/*.sol": {
            version: "0.7.6",
            settings: {
                optimizer: { enabled: true, runs: 800 },
                metadata: { bytecodeHash: "none" }
            }
        },
        "node_modules/@uniswap/v3-periphery/contracts/**/*.sol": {
            version: "0.7.6",
            settings: {
                optimizer: { enabled: true, runs: 800 },
                metadata: { bytecodeHash: "none" }
            }
        },
        // 自定义合约
        "contracts/shared/WETH9.sol": {
            version: "0.6.6",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        }
    }
}
```

**重要提示**：
- ⚠️ 使用 `node_modules/@uniswap/...` 路径，不是 `contracts/uniswap-v2/...`
- ⚠️ Hardhat 默认不编译 node_modules，所以部署时需要直接导入预编译的 artifacts

#### 1.4 添加 Edge Testnet 网络配置

**在 hardhat.config.ts 的 networks 中添加：**
```typescript
edgeTestnet: {
    url: "https://edge-testnet.g.alchemy.com/public",
    accounts: [PRIVATE_KEY],
    chainId: 33431,
    gasPrice: 100000000, // 0.1 gwei
    timeout: 120000
}
```

#### 1.5 测试编译

```bash
pnpm compile
```

**预期输出：**
- 成功编译 15 个 Solidity 文件
- 生成 artifacts/ 目录（只包含自定义合约的 artifacts）
- 无错误和警告（可能有 Node.js 版本警告，可忽略）

**实际结果**：
```
Compiled 15 Solidity files successfully (evm targets: istanbul, paris).
```

**风险点已解决**：
- ✅ 无需修复 import 路径（使用 npm 包）
- ✅ V3 依赖完整（npm 包已包含）
- ✅ Uniswap 合约使用预编译 artifacts（位于 `node_modules/@uniswap/*/build/` 或 `artifacts/`）

---

### 阶段 2：编写部署脚本（3 天）

#### 目标
创建分步骤的部署脚本，按顺序部署 WETH、V2、V3、测试代币，并记录所有合约地址。

#### 2.1 创建部署目录结构

```
scripts/
├── utils.ts (已有，复用)
├── deploy/
│   ├── 1-deploy-weth.ts
│   ├── 2-deploy-v2-factory.ts
│   ├── 3-deploy-v2-router.ts
│   ├── 4-deploy-v3-factory.ts
│   ├── 5-deploy-v3-periphery.ts
│   ├── 6-deploy-test-tokens.ts
│   └── deploy-all.ts
└── interact/
    ├── create-v2-pair.ts
    ├── create-v3-pool.ts
    └── add-liquidity.ts
```

#### 2.2 部署脚本核心逻辑

**文件路径：** `scripts/deploy/deploy-all.ts`

**部署顺序（按依赖关系）：**
1. **WETH9** (无依赖)
2. **UniswapV2Factory** (参数: feeToSetter = deployer)
3. **UniswapV2Router02** (参数: factory, WETH)
4. **UniswapV3Factory** (无参数，自动启用 500/3000/10000 费率)
5. **SwapRouter** (参数: factory, WETH)
6. **NFTDescriptor (库)** (无参数) ⚠️ **新增**
7. **NonfungibleTokenPositionDescriptor** (参数: WETH, nativeCurrencyLabel) ⚠️ **需要链接库**
8. **NonfungiblePositionManager** (参数: factory, WETH, descriptor)
9. **TestToken x2** (部署 TokenA 和 TokenB)

**地址记录格式：** `deployments/edge-testnet.json`
```json
{
  "deployer": "0x...",
  "timestamp": "2025-12-15T...",
  "weth": "0x...",
  "v2": {
    "factory": "0x...",
    "router": "0x..."
  },
  "v3": {
    "factory": "0x...",
    "swapRouter": "0x...",
    "nftDescriptorLib": "0x...",
    "nftDescriptor": "0x...",
    "positionManager": "0x..."
  },
  "testTokens": {
    "tokenA": "0x...",
    "tokenB": "0x..."
  }
}
```

#### 2.3 关键实现细节

**⚠️ 使用 npm 包 artifacts 部署方式**

**导入 artifacts（在脚本顶部）：**
```typescript
import { ethers } from "hardhat";
import UniswapV2FactoryArtifact from "@uniswap/v2-core/build/UniswapV2Factory.json";
import UniswapV2Router02Artifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import UniswapV3FactoryArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import SwapRouterArtifact from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import NFTDescriptorArtifact from "@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json";
import NonfungibleTokenPositionDescriptorArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json";
import NonfungiblePositionManagerArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
```

**V2 Factory 部署（Ethers.js v6 + artifacts）：**
```typescript
const [deployer] = await ethers.getSigners();
console.log("Deploying with account:", deployer.address); // v6: 同步

// 使用 ContractFactory 和 artifacts
const UniswapV2Factory = new ethers.ContractFactory(
    UniswapV2FactoryArtifact.abi,
    UniswapV2FactoryArtifact.bytecode,
    deployer
);
const factory = await UniswapV2Factory.deploy(deployer.address); // feeToSetter
await factory.waitForDeployment(); // v6: 不再是 deployed()

const factoryAddress = await factory.getAddress(); // v6: 异步获取地址
console.log("UniswapV2Factory deployed to:", factoryAddress);
```

**V3 Factory 部署（Ethers.js v6 + artifacts）：**
```typescript
const UniswapV3Factory = new ethers.ContractFactory(
    UniswapV3FactoryArtifact.abi,
    UniswapV3FactoryArtifact.bytecode,
    deployer
);
const factory = await UniswapV3Factory.deploy(); // 无参数
await factory.waitForDeployment();

const factoryAddress = await factory.getAddress();
console.log("UniswapV3Factory deployed to:", factoryAddress);
```

**⚠️ NFTDescriptor 库部署和链接（关键步骤）：**
```typescript
// 1. 部署 NFTDescriptor 库
const NFTDescriptor = new ethers.ContractFactory(
    NFTDescriptorArtifact.abi,
    NFTDescriptorArtifact.bytecode,
    deployer
);
const nftDescriptorLib = await NFTDescriptor.deploy();
await nftDescriptorLib.waitForDeployment();
const nftDescriptorLibAddress = await nftDescriptorLib.getAddress();

// 2. 链接库：替换 bytecode 中的占位符
const linkedBytecode = NonfungibleTokenPositionDescriptorArtifact.bytecode.replace(
    /__\$[a-fA-F0-9]{34}\$__/g,
    nftDescriptorLibAddress.slice(2) // 去掉 "0x"
);

// 3. 使用链接后的 bytecode 部署
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
```

**TestToken 部署（Ethers.js v6）：**
```typescript
const TestToken = await ethers.getContractFactory("TestToken"); // 自定义合约可直接使用名称
const tokenA = await TestToken.deploy(
    "Test Token A",
    "TKA",
    ethers.parseEther("1000000") // v6: 不再是 utils.parseEther
);
await tokenA.waitForDeployment();

const tokenAAddress = await tokenA.getAddress();
console.log("Test Token A deployed to:", tokenAAddress);
```

**关键点**：
- ✅ V2/V3 合约使用 `new ethers.ContractFactory(abi, bytecode, signer)`
- ✅ 自定义合约（WETH9, TestToken）使用 `await ethers.getContractFactory("ContractName")`
- ✅ NFTDescriptor 必须先部署，然后链接到 NonfungibleTokenPositionDescriptor
- ✅ 所有 Ethers.js v6 API：`waitForDeployment()`, `getAddress()`, `parseEther()`

#### 2.4 添加部署脚本命令

**在 package.json 的 scripts 中添加：**
```json
"deploy:weth": "hardhat run scripts/deploy/1-deploy-weth.ts --network edgeTestnet",
"deploy:v2": "hardhat run scripts/deploy/2-deploy-v2-factory.ts --network edgeTestnet && hardhat run scripts/deploy/3-deploy-v2-router.ts --network edgeTestnet",
"deploy:v3": "hardhat run scripts/deploy/4-deploy-v3-factory.ts --network edgeTestnet && hardhat run scripts/deploy/5-deploy-v3-periphery.ts --network edgeTestnet",
"deploy:tokens": "hardhat run scripts/deploy/6-deploy-test-tokens.ts --network edgeTestnet",
"deploy:all": "hardhat run scripts/deploy/deploy-all.ts --network edgeTestnet"
```

#### 2.5 本地测试部署

**使用 Hardhat 本地网络测试：**
```bash
pnpm hardhat node
pnpm deploy:all --network localhost
```

**验证：**
- 所有合约成功部署
- `deployments/edge-testnet.json` 记录完整
- 无 gas 不足或 revert 错误

#### 2.6 Edge Testnet 正式部署

```bash
pnpm deploy:all
```

**注意事项：**
- ⚠️ 确保钱包有足够的 ETH（建议 0.5 ETH）
- ⚠️ 部署过程可能需要 10-15 分钟
- ⚠️ 记录每个合约地址，防止丢失
- ✅ 部署完成后立即在 Explorer 上验证合约（可选）

---

### 阶段 3：测试链上交互（0.5 天）

#### 目标
验证部署的合约可以正常工作，创建测试用的 pair 和 pool。

**注意**：本阶段只测试创建 pair/pool，不测试添加流动性（下一期功能）。

#### 3.1 创建 V2 Pair

**文件路径：** `scripts/interact/create-v2-pair.ts`

```typescript
// 使用完整的合约路径名称
const factory = await ethers.getContractAt(
    "@uniswap/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory",
    FACTORY_ADDRESS
);
const tx = await factory.createPair(TOKEN_A, TOKEN_B);
const receipt = await tx.wait();

// Ethers.js v6: 推荐方式 - 直接查询
const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);
console.log('Pair created at:', pairAddress);

// 或从 logs 解析事件（方式2）
const pairCreatedLog = receipt.logs.find(log => {
  try {
    const parsed = factory.interface.parseLog(log);
    return parsed && parsed.name === 'PairCreated';
  } catch {
    return false;
  }
});

if (pairCreatedLog) {
  const parsed = factory.interface.parseLog(pairCreatedLog);
  const pairAddress = parsed.args.pair;
  console.log('Pair created at:', pairAddress);
}

// 或者更简单的方式（方式2，推荐）
// 直接查询而不是从事件解析
const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);
console.log('Pair created at:', pairAddress);
```

#### 3.2 创建 V3 Pool

**文件路径：** `scripts/interact/create-v3-pool.ts`

```typescript
// 1. 创建 pool - 使用完整的合约路径
const factory = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/UniswapV3Factory.sol:UniswapV3Factory",
    FACTORY_ADDRESS
);
await factory.createPool(TOKEN_A, TOKEN_B, 3000); // 0.3% fee

// 2. 获取 pool 地址
const poolAddress = await factory.getPool(TOKEN_A, TOKEN_B, 3000);

// 3. 初始化价格 (1:1) - 使用完整的合约路径
const pool = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/UniswapV3Pool.sol:UniswapV3Pool",
    poolAddress
);
const sqrtPriceX96 = "79228162514264337593543950336"; // 2^96 (1:1 price)
await pool.initialize(sqrtPriceX96);
```

#### 3.3 验证成功

- ✅ V2 Pair 创建成功，地址记录
- ✅ V3 Pool 创建并初始化成功
- ✅ 更新 `deployments/edge-testnet.json` 添加 pair/pool 地址

**注意**：本阶段不测试添加流动性，只验证 pair/pool 创建成功即可。

---

### 阶段 4：开发前端（4 天）

#### 目标
创建 Next.js 前端，配置 RainbowKit + Wagmi，实现**两个核心功能页面**（本期不包含添加流动性）。

**本期实现的页面**：
1. ✅ Mint 测试代币页面
2. ✅ 创建交易对/池页面（V2 和 V3）

**下一期实现的页面**：
- ❌ 添加流动性页面（V2 和 V3）

#### 4.1 初始化 Next.js 项目

**命令：**
```bash
cd /Users/pis/workspace/edgex/edge-chain-uniswap-demo
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
pnpm add @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
pnpm add @uniswap/v3-sdk @uniswap/sdk-core # V3 价格计算
```

**项目结构（本期精简版）：**
```
frontend/
├── app/
│   ├── layout.tsx (RainbowKit Provider)
│   ├── page.tsx (首页: 功能导航)
│   ├── mint/page.tsx (Mint 测试代币)
│   └── create-pair/page.tsx (创建交易对/池)
├── components/
│   ├── wallet/ConnectButton.tsx
│   ├── v2/
│   │   └── CreatePair.tsx
│   └── v3/
│       └── CreatePool.tsx
├── lib/
│   ├── contracts/ (ABI 文件)
│   ├── wagmi.ts (配置)
│   └── constants.ts (合约地址)
├── package.json
└── next.config.js
```

**注意**：本期不包含 `add-liquidity/` 页面和相关组件（AddLiquidityV2.tsx, AddLiquidityV3.tsx）。

#### 4.2 配置 RainbowKit + Wagmi

**文件路径：** `frontend/lib/wagmi.ts`

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const edgeTestnet = defineChain({
  id: 33431,
  name: 'Edge Testnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: ['https://edge-testnet.g.alchemy.com/public'] },
  },
  blockExplorers: {
    default: {
      name: 'Edge Explorer',
      url: 'https://edge-testnet.explorer.alchemy.com'
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Uniswap Demo - Edge Testnet',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [edgeTestnet],
  ssr: true,
});
```

**文件路径：** `frontend/lib/constants.ts`

```typescript
// 从 deployments/edge-testnet.json 复制地址
export const CONTRACTS = {
  WETH: "0x...",
  V2: {
    FACTORY: "0x...",
    ROUTER: "0x...",
  },
  V3: {
    FACTORY: "0x...",
    SWAP_ROUTER: "0x...",
    POSITION_MANAGER: "0x...",
  },
  TEST_TOKENS: {
    TOKEN_A: "0x...",
    TOKEN_B: "0x...",
  },
};

// ABI 导入 (从 artifacts/ 复制)
export const ABIS = {
  ERC20: [...],
  UNISWAP_V2_FACTORY: [...],
  UNISWAP_V2_ROUTER: [...],
  UNISWAP_V3_FACTORY: [...],
  UNISWAP_V3_POOL: [...],
  UNISWAP_V3_POSITION_MANAGER: [...],
};
```

#### 4.3 实现两个核心功能页面（本期范围）

**4.3.1 Mint 测试代币页面**

**文件路径：** `frontend/app/mint/page.tsx`

**核心功能：**
- 选择代币 (TokenA / TokenB)
- 输入 mint 数量
- 调用 `token.mint(address, amount)`
- 显示交易状态和成功消息

**关键代码：**
```typescript
import { parseEther } from 'viem'; // Viem API，不是 Ethers.js

const { writeContract, data: hash } = useWriteContract();
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

const handleMint = () => {
  writeContract({
    address: TOKEN_ADDRESS,
    abi: ABIS.ERC20,
    functionName: 'mint',
    args: [userAddress, parseEther(amount)],
  });
};
```

**4.3.2 创建交易对/池页面**

**文件路径：** `frontend/app/create-pair/page.tsx`

**核心功能：**
- Tab 切换 V2 / V3
- **V2**: 输入 tokenA, tokenB → 调用 `Factory.createPair()`
- **V3**: 输入 tokenA, tokenB, fee, initialPrice → 调用 `Factory.createPool()` + `pool.initialize()`

**V2 组件：** `frontend/components/v2/CreatePair.tsx`
```typescript
const handleCreate = () => {
  writeContract({
    address: CONTRACTS.V2.FACTORY,
    abi: ABIS.UNISWAP_V2_FACTORY,
    functionName: 'createPair',
    args: [tokenA, tokenB],
  });
};
```

**V3 组件：** `frontend/components/v3/CreatePool.tsx`
```typescript
// 1. 创建 pool
await writeContract({
  address: CONTRACTS.V3.FACTORY,
  abi: ABIS.UNISWAP_V3_FACTORY,
  functionName: 'createPool',
  args: [tokenA, tokenB, fee],
});

// 2. 初始化价格 (需要计算 sqrtPriceX96)
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
const sqrtPriceX96 = encodeSqrtRatioX96(initialPrice, 1).toString();

const poolAddress = await readContract({
  address: CONTRACTS.V3.FACTORY,
  abi: ABIS.UNISWAP_V3_FACTORY,
  functionName: 'getPool',
  args: [tokenA, tokenB, fee],
});

await writeContract({
  address: poolAddress,
  abi: ABIS.UNISWAP_V3_POOL,
  functionName: 'initialize',
  args: [sqrtPriceX96],
});
```

**注意**：本期不实现添加流动性页面，该功能作为下一期迭代内容。

#### 4.4 UI/UX 设计要点

- ✅ 使用 TailwindCSS 快速布局
- ✅ RainbowKit ConnectButton 显眼放置在 header
- ✅ 每个操作都要显示 loading 状态
- ✅ 交易成功后显示 Explorer 链接
- ✅ 错误处理：余额不足、授权失败、交易 revert 等
- ✅ V2 和 V3 使用不同颜色主题区分（如 V2 粉色，V3 蓝色）

#### 4.5 测试前端交互

**本地测试：**
```bash
cd frontend
pnpm dev
```

**测试流程（本期范围）：**
1. 访问 http://localhost:3000
2. 连接 MetaMask 到 Edge Testnet
3. 测试 Mint 代币功能
4. 测试创建 V2 Pair 功能
5. 测试创建 V3 Pool 功能（包括初始化价格）

**下一期测试内容**：
- ❌ 测试添加 V2 流动性
- ❌ 测试添加 V3 流动性

---

### 阶段 5：文档与部署（2 天）

#### 5.1 编写部署文档

**文件路径：** `docs/deployment-addresses.md`

**内容要点：**
- 网络信息（Chain ID, RPC, Explorer）
- 所有合约地址表格
- 已创建的 Pair/Pool 列表
- Gas 使用报告
- 前端访问 URL

**文件路径：** `docs/create-pair-guide.md`

**内容要点：**
- V2 创建 Pair 的 3 种方式（前端 / 合约直接调用 / Hardhat 脚本）
- 步骤详解
- 常见错误和解决方案
- 查询已有 Pair 的方法

**文件路径：** `docs/create-pool-guide.md`

**内容要点：**
- V3 创建 Pool 的步骤（创建 + 初始化）
- Fee Tier 选择指南
- sqrtPriceX96 价格计算方法
- 常见错误和解决方案

#### 5.2 部署到 Vercel

**步骤：**
1. 在 Vercel 创建新项目，关联 GitHub 仓库
2. 设置环境变量（在 Vercel Dashboard）：
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   NEXT_PUBLIC_CHAIN_ID=33431
   NEXT_PUBLIC_RPC_URL=https://edge-testnet.g.alchemy.com/public
   NEXT_PUBLIC_WETH_ADDRESS=0x...
   NEXT_PUBLIC_V2_FACTORY=0x...
   NEXT_PUBLIC_V2_ROUTER=0x...
   NEXT_PUBLIC_V3_FACTORY=0x...
   NEXT_PUBLIC_V3_POSITION_MANAGER=0x...
   NEXT_PUBLIC_TEST_TOKEN_A=0x...
   NEXT_PUBLIC_TEST_TOKEN_B=0x...
   ```
3. 配置构建设置：
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
4. 部署：点击 "Deploy"
5. 验证：访问部署 URL，测试所有功能

#### 5.3 更新项目 README

**文件路径：** `README.md`

**内容要点：**
- 项目介绍
- 部署的合约地址
- 前端访问 URL
- 本地开发指南
- 部署指南
- 测试指南

---

## 关键文件路径汇总

### 需要新建的文件（优先级排序）

**最高优先级（已完成 ✅）：**
1. ✅ `contracts/token/TestToken.sol` - 简化测试代币
2. ✅ `contracts/shared/WETH9.sol` - 从 node_modules/@uniswap/v2-periphery 复制
3. ~~`contracts/uniswap-v2/` - 整个目录重组~~ ❌ **已取消**（使用 npm 包）
4. ~~`contracts/uniswap-v3/` - 整个目录重组~~ ❌ **已取消**（使用 npm 包）

**高优先级（已完成 ✅）：**
5. ✅ `scripts/deploy/1-deploy-weth.ts`
6. ✅ `scripts/deploy/2-deploy-v2-factory.ts`
7. ✅ `scripts/deploy/3-deploy-v2-router.ts`
8. ✅ `scripts/deploy/4-deploy-v3-factory.ts`
9. ✅ `scripts/deploy/5-deploy-v3-periphery.ts`
10. ✅ `scripts/deploy/6-deploy-test-tokens.ts`
11. ✅ `scripts/deploy/deploy-all.ts`
12. ✅ `scripts/interact/create-v2-pair.ts`
13. ✅ `scripts/interact/create-v3-pool.ts`

**中优先级（待完成 ⏳）：**
14. ⏳ `frontend/` - 整个 Next.js 项目
15. ⏳ `frontend/lib/wagmi.ts`
16. ⏳ `frontend/lib/constants.ts`
17. ⏳ `frontend/app/mint/page.tsx`
18. ⏳ `frontend/app/create-pair/page.tsx`

**低优先级（待完成 ⏳）：**
19. ⏳ `docs/deployment-addresses.md`
20. ⏳ `docs/create-pair-guide.md`
21. ⏳ `docs/create-pool-guide.md`

### 需要修改的文件

1. ✅ `hardhat.config.ts` - 配置多版本 Solidity + Edge Testnet 网络（**已完成**）
2. ✅ `package.json` - 添加部署脚本命令（**已完成**）
3. ⏳ `.gitignore` - 添加 `deployments/`, `frontend/.next/`, `frontend/node_modules/`
4. ⏳ `README.md` - 更新项目说明

### ~~需要删除的文件/目录~~（已取消 ❌）

~~由于采用 npm 包方案，以下删除操作全部取消：~~
- ❌ **不需要**删除 `contracts/v2-core/` 的配置文件（保持原样）
- ❌ **不需要**删除 `contracts/v2-periphery/` 的配置文件（保持原样）
- ❌ **不需要**删除 `contracts/v3-core/` 的配置文件（保持原样）
- ❌ **不需要**删除 `contracts/v3-periphery/` 的配置文件（保持原样）

**说明**：这些目录是 npm 包管理的，保持原样不影响部署。

---

## 风险点和注意事项

### 🔥 Ethers.js v6 兼容性（关键）

**当前项目使用 Ethers.js v6**，与 v5 有重大 API 变化，必须注意：

#### 事件处理变化（最重要）
```typescript
// ❌ Ethers.js v5 写法（已废弃）
const receipt = await tx.wait();
const event = receipt.events.find(e => e.event === 'PairCreated');
const pairAddress = event.args.pair;

// ✅ Ethers.js v6 写法 - 方式1：从 logs 解析
const receipt = await tx.wait();
const log = receipt.logs.find(log => {
  try {
    const parsed = contract.interface.parseLog(log);
    return parsed && parsed.name === 'PairCreated';
  } catch {
    return false;
  }
});
if (log) {
  const parsed = contract.interface.parseLog(log);
  const pairAddress = parsed.args.pair;
}

// ✅ Ethers.js v6 推荐方式 - 方式2：直接查询（最简单）
const pairAddress = await factory.getPair(tokenA, tokenB);
```

#### 其他关键变化
| v5 API | v6 API | 说明 |
|--------|--------|------|
| `ethers.utils.parseEther()` | `ethers.parseEther()` | 直接在 ethers 上 |
| `contract.deployed()` | `contract.waitForDeployment()` | 等待部署 |
| `contract.address` | `await contract.getAddress()` | 异步获取地址 |
| `receipt.events` | `receipt.logs` | 事件变为日志 |
| `signer.getAddress()` | `await signer.getAddress()` | 异步获取 |

#### 前端（Viem）兼容性
前端使用 Wagmi + Viem，**不使用 Ethers.js**，因此：
- ✅ `parseEther` 从 `viem` 导入：`import { parseEther } from 'viem'`
- ✅ 事件监听使用 Wagmi 的 `useWaitForTransactionReceipt`
- ✅ 合约交互使用 `useReadContract` 和 `useWriteContract`

#### 缓解措施
- 部署脚本：统一使用 Ethers.js v6 API，避免混用
- 前端：使用 Viem API，完全独立于 Ethers.js
- 文档中所有代码示例已更新为 v6 兼容

---

### ⚠️ 高风险点

1. **Import 路径修复**：从 `@uniswap/v2-core/...` 改为相对路径可能遗漏，导致编译失败
   - **缓解措施**：编译时逐个修复错误，或使用 npm 包作为 fallback

2. **V3 依赖复杂**：V3 的 interfaces/ 和 libraries/ 互相依赖，可能缺少文件
   - **缓解措施**：完整复制 interfaces/ 和 libraries/ 目录

3. **V3 初始化价格**：sqrtPriceX96 计算错误会导致 pool 无法使用
   - **缓解措施**：使用 @uniswap/v3-sdk 的 `encodeSqrtRatioX96()` 函数

4. **Gas 不足**：部署 V3 合约 gas 消耗大，可能钱包余额不足
   - **缓解措施**：提前准备 0.5 ETH，分步部署

### ⚡ 中等风险点

5. **Solidity 版本冲突**：overrides 配置错误会导致编译失败
   - **缓解措施**：先测试编译单个合约，确认版本正确

6. **前端 V3 交互复杂**：tick 计算、价格范围选择对用户不友好
   - **缓解措施**：提供预设价格范围选项（Full Range / Narrow / Wide）

7. **Vercel 环境变量**：遗漏环境变量会导致前端无法调用合约
   - **缓解措施**：创建 `.env.local.example` 文件作为模板

### ✅ 低风险点

8. **文档编写**：文档滞后不影响功能
   - **缓解措施**：边部署边记录地址，最后统一整理

---

## 成功标准

### 合约部署成功标准（本期）
- ✅ 所有合约编译无错误
- ✅ V2 和 V3 Factory 合约成功部署到 Edge Testnet
- ✅ WETH 和测试代币成功部署
- ✅ `deployments/edge-testnet.json` 记录完整
- ✅ 至少创建 1 个 V2 Pair 和 1 个 V3 Pool（通过脚本验证）

### 前端成功标准（本期）
- ✅ 部署到 Vercel，可公开访问
- ✅ RainbowKit 连接钱包正常
- ✅ Mint 测试代币功能正常工作
- ✅ 创建 V2 Pair 功能正常（输入两个代币地址 → 创建成功）
- ✅ 创建 V3 Pool + 初始化价格功能正常（输入代币、费率、初始价格 → 创建并初始化成功）
- ✅ 所有交易状态显示正确（loading、success、error）

### 下一期成功标准
- ❌ 添加 V2 流动性功能
- ❌ 添加 V3 流动性功能
- ❌ Swap 交易功能

### 文档成功标准
- ✅ 部署地址文档完整
- ✅ 创建 Pair/Pool 操作指南清晰
- ✅ README 更新，包含访问 URL

---

## 预估时间线（实际 vs 原计划对比）

| 阶段 | 任务 | 原计划 | 实际耗时 | 累计时间 | 状态 |
|------|------|---------|---------|----------|------|
| 1 | ~~重构合约结构~~ ❌ 已取消 | 1.5 天 | 0 天 | - | ✅ 使用 npm 包 |
| 1 | 配置多版本编译器 + 创建合约 | 0.5 天 | 0.5 天 | 0.5 天 | ✅ 完成 |
| 1 | 测试编译 | 0.5 天 | 0.1 天 | 0.6 天 | ✅ 完成 |
| 2 | 编写部署脚本 | 1 天 | 1 天 | 1.6 天 | ✅ 完成 |
| 2 | 本地测试部署 | 0.5 天 | 0.2 天 | 1.8 天 | ✅ 完成 |
| 2 | Edge Testnet 正式部署 | 0.5 天 | - | - | ⏳ 待执行 |
| 2 | 验证合约（可选） | 0.5 天 | - | - | ⏳ 待执行 |
| 3 | 测试链上交互 | 0.5 天 | - | - | ⏳ 待执行 |
| 4 | 初始化 Next.js + 配置 | 0.5 天 | - | - | ⏳ 待执行 |
| 4 | 开发 Mint 页面 | 1 天 | - | - | ⏳ 待执行 |
| 4 | 开发创建 Pair/Pool 页面 | 2 天 | - | - | ⏳ 待执行 |
| 4 | ~~开发添加流动性页面~~ | 2 天 | - | - | ❌ 下一期 |
| 4 | 测试前端交互 | 0.5 天 | - | - | ⏳ 待执行 |
| 5 | 编写文档 | 1 天 | - | - | ⏳ 待执行 |
| 5 | 部署到 Vercel | 0.5 天 | - | - | ⏳ 待执行 |

**时间节省**：由于采用 npm 包方案，节省了约 1.5 天的重构时间。
**实际已耗时**：约 1.8 天（含文档更新）
**原计划总时间**：约 13 天（2 周）
**修正后预计总时间**：约 7-8 天（1.5 周）

---

## 下一步行动（已更新）

**当前状态**：已完成阶段 1 和阶段 2 的所有脚本开发，本地部署测试成功 ✅

**立即可执行任务**：

1. **选项 A：测试交互脚本**（可在本地测试）
   ```bash
   pnpm interact:create-v2-pair --network localhost
   pnpm interact:create-v3-pool --network localhost
   ```

2. **选项 B：部署到 Edge Testnet**（需要配置 .env 和 ETH）
   ```bash
   # 确保 .env 中有 PRIVATE_KEY 和钱包有足够 ETH (>= 0.5 ETH)
   pnpm deploy:all
   ```

3. **选项 C：开始前端开发**（可并行进行）
   - 初始化 Next.js 项目
   - 配置 RainbowKit + Wagmi

**建议执行顺序**：
- **优先**：选项 A（测试交互）→ 选项 B（Edge Testnet 部署）→ 选项 C（前端开发）
- **并行**：选项 A + 选项 C 可同时进行

**关键里程碑：**
- ✅ Day 1: 编译成功，脚本开发完成
- ✅ Day 2: 本地部署测试成功
- ⏳ Day 3: Edge Testnet 部署成功
- ⏳ Day 5-6: 前端功能完成
- ⏳ Day 7-8: 项目交付

---

## 参考资料

- Uniswap V2 文档: https://docs.uniswap.org/contracts/v2/overview
- Uniswap V3 文档: https://docs.uniswap.org/contracts/v3/overview
- RainbowKit 文档: https://www.rainbowkit.com/docs/installation
- Wagmi 文档: https://wagmi.sh/
- Edge Testnet 信息: BridgeConfig-testnet.json
