# Uniswap V2/V3 部署与前端开发实施计划

## 项目目标

为 Edge Testnet 部署 Uniswap V2 和 V3 合约，创建前端界面支持 mint 测试代币、创建交易对/池、添加流动性功能，并维护完整的部署文档。

## 用户选择确认

- ✅ 部署版本：V2 和 V3 都部署
- ✅ 架构方案：精简部署（只保留核心合约）
- ✅ 前端技术栈：Next.js + RainbowKit + Wagmi + Viem
- ✅ 功能范围：Mint 测试代币 + 创建交易对/池 + 添加流动性

## 关键问题识别

### 当前项目的 3 个严重问题

1. **合约架构混乱**：v2-core、v3-core 等都是独立的 git 子项目，每个都有自己的 package.json 和 hardhat.config，会导致编译冲突
2. **Solidity 版本冲突**：V2 使用 0.5.16/0.6.6，V3 使用 0.7.6，但主配置只有 0.8.27
3. **缺少 Edge Testnet 配置**：hardhat.config.ts 中没有配置 Edge Testnet 网络（chainId: 33431）

---

## 实施方案（分 5 个阶段）

### 阶段 1：重构合约结构（2.5 天，优先级：最高）

#### 目标
精简合约结构，只保留核心部署文件，配置多版本 Solidity 编译器，添加 Edge Testnet 网络配置。

#### 1.1 精简合约文件结构

**新的目标结构：**
```
contracts/
├── shared/
│   └── WETH9.sol (从 v2-periphery 复制)
├── token/
│   ├── ExampleToken.sol (保持不变)
│   └── TestToken.sol (新建：简化版 ERC20，任何人可 mint)
├── uniswap-v2/
│   ├── core/
│   │   ├── UniswapV2Factory.sol
│   │   ├── UniswapV2Pair.sol
│   │   ├── UniswapV2ERC20.sol
│   │   ├── interfaces/ (IUniswapV2Factory, IUniswapV2Pair 等)
│   │   └── libraries/ (Math, UQ112x112, SafeMath)
│   └── periphery/
│       ├── UniswapV2Router02.sol
│       ├── interfaces/ (IUniswapV2Router02, IERC20, IWETH)
│       └── libraries/ (UniswapV2Library, TransferHelper, SafeMath)
└── uniswap-v3/
    ├── core/
    │   ├── UniswapV3Factory.sol
    │   ├── UniswapV3Pool.sol
    │   ├── UniswapV3PoolDeployer.sol
    │   ├── NoDelegateCall.sol
    │   ├── interfaces/ (完整目录)
    │   └── libraries/ (完整目录)
    └── periphery/
        ├── SwapRouter.sol
        ├── NonfungiblePositionManager.sol
        ├── NonfungibleTokenPositionDescriptor.sol
        ├── base/ (PeripheryImmutableState, PoolInitializer 等)
        ├── interfaces/ (必需接口)
        └── libraries/ (必需库)
```

**操作步骤：**
1. 创建新的目录结构 `contracts/uniswap-v2/` 和 `contracts/uniswap-v3/`
2. 从现有的 `v2-core`, `v2-periphery`, `v3-core`, `v3-periphery` 中复制核心合约文件
3. **删除所有子项目的配置文件**（package.json, hardhat.config.js, tsconfig.json）
4. **删除所有测试目录**（test/, examples/）
5. **修复 import 路径**：将 `@uniswap/v2-core/...` 改为相对路径 `../../core/...`
6. 从 `v2-periphery/contracts/test/WETH9.sol` 复制到 `contracts/shared/WETH9.sol`

**需要保留的核心文件清单：**
- V2 Core: UniswapV2Factory.sol, UniswapV2Pair.sol, UniswapV2ERC20.sol + 接口和库
- V2 Periphery: UniswapV2Router02.sol + 接口和库
- V3 Core: UniswapV3Factory.sol, UniswapV3Pool.sol, UniswapV3PoolDeployer.sol, NoDelegateCall.sol + 完整的 interfaces/ 和 libraries/
- V3 Periphery: SwapRouter.sol, NonfungiblePositionManager.sol, NonfungibleTokenPositionDescriptor.sol + base/, interfaces/, libraries/

**需要删除的文件：**
- 所有 `test/` 目录
- 所有 `examples/` 目录
- `UniswapV2Router01.sol`, `UniswapV2Migrator.sol`, `V3Migrator.sol`
- 所有子项目的 `package.json`, `hardhat.config.js`, `tsconfig.json`

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
        "contracts/uniswap-v2/core/**/*.sol": {
            version: "0.5.16",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        },
        "contracts/uniswap-v2/periphery/**/*.sol": {
            version: "0.6.6",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        },
        "contracts/shared/WETH9.sol": {
            version: "0.6.6",
            settings: { optimizer: { enabled: true, runs: 999999 } }
        },
        "contracts/uniswap-v3/**/*.sol": {
            version: "0.7.6",
            settings: {
                optimizer: { enabled: true, runs: 800 },
                metadata: { bytecodeHash: "none" }
            }
        }
    }
}
```

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
- 成功编译所有合约
- 生成 artifacts/ 目录，包含所有 ABI 和 bytecode
- 无错误和警告（可能有 Solidity 版本警告，忽略）

**风险点：**
- ⚠️ import 路径修复可能遗漏，导致编译失败
- ⚠️ V3 依赖复杂，可能缺少某些库文件

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
6. **NonfungibleTokenPositionDescriptor** (参数: WETH)
7. **NonfungiblePositionManager** (参数: factory, WETH, descriptor)
8. **TestToken x2** (部署 TokenA 和 TokenB)

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

**V2 Factory 部署（Ethers.js v6 兼容）：**
```typescript
const [deployer] = await ethers.getSigners();
console.log("Deploying with account:", await deployer.getAddress()); // v6: 异步

const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
const factory = await UniswapV2Factory.deploy(await deployer.getAddress()); // feeToSetter
await factory.waitForDeployment(); // v6: 不再是 deployed()

const factoryAddress = await factory.getAddress(); // v6: 异步获取地址
console.log("UniswapV2Factory deployed to:", factoryAddress);
```

**V3 Factory 部署（Ethers.js v6 兼容）：**
```typescript
const UniswapV3Factory = await ethers.getContractFactory("UniswapV3Factory");
const factory = await UniswapV3Factory.deploy(); // 无参数
await factory.waitForDeployment();

const factoryAddress = await factory.getAddress();
console.log("UniswapV3Factory deployed to:", factoryAddress);
```

**TestToken 部署（Ethers.js v6 兼容）：**
```typescript
const TestToken = await ethers.getContractFactory("TestToken");
const tokenA = await TestToken.deploy(
    "Test Token A",
    "TKA",
    ethers.parseEther("1000000") // v6: 不再是 utils.parseEther
);
await tokenA.waitForDeployment();

const tokenAAddress = await tokenA.getAddress();
console.log("Test Token A deployed to:", tokenAAddress);
```

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

### 阶段 3：测试链上交互（1 天）

#### 目标
验证部署的合约可以正常工作，创建测试用的 pair 和 pool。

#### 3.1 创建 V2 Pair

**文件路径：** `scripts/interact/create-v2-pair.ts`

```typescript
const factory = await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDRESS);
const tx = await factory.createPair(TOKEN_A, TOKEN_B);
const receipt = await tx.wait();

// Ethers.js v6: 从 logs 解析事件（方式1）
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
// 1. 创建 pool
const factory = await ethers.getContractAt("UniswapV3Factory", FACTORY_ADDRESS);
await factory.createPool(TOKEN_A, TOKEN_B, 3000); // 0.3%

// 2. 获取 pool 地址
const poolAddress = await factory.getPool(TOKEN_A, TOKEN_B, 3000);

// 3. 初始化价格 (1:1)
const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);
const sqrtPriceX96 = "79228162514264337593543950336"; // 1:1 price
await pool.initialize(sqrtPriceX96);
```

#### 3.3 测试添加流动性

**V2 添加流动性：**
```typescript
// 1. 授权
await tokenA.approve(ROUTER_ADDRESS, amountA);
await tokenB.approve(ROUTER_ADDRESS, amountB);

// 2. 添加流动性
const router = await ethers.getContractAt("UniswapV2Router02", ROUTER_ADDRESS);
await router.addLiquidity(
    TOKEN_A, TOKEN_B,
    amountA, amountB,
    0, 0, // slippage
    deployer.address,
    deadline
);
```

**V3 添加流动性（更复杂）：**
```typescript
// 使用 NonfungiblePositionManager.mint()
const positionManager = await ethers.getContractAt(
    "NonfungiblePositionManager",
    POSITION_MANAGER_ADDRESS
);

// 授权
await tokenA.approve(POSITION_MANAGER_ADDRESS, amountA);
await tokenB.approve(POSITION_MANAGER_ADDRESS, amountB);

// Mint position (Full Range)
await positionManager.mint({
    token0: TOKEN_A,
    token1: TOKEN_B,
    fee: 3000,
    tickLower: -887220, // MIN_TICK for tickSpacing 60
    tickUpper: 887220,  // MAX_TICK
    amount0Desired: amountA,
    amount1Desired: amountB,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: deadline
});
```

#### 3.4 验证成功

- ✅ V2 Pair 创建成功，地址记录
- ✅ V3 Pool 创建并初始化成功
- ✅ 添加流动性后余额变化正确
- ✅ 更新 `deployments/edge-testnet.json` 添加 pair/pool 地址

---

### 阶段 4：开发前端（7 天）

#### 目标
创建 Next.js 前端，配置 RainbowKit + Wagmi，实现三个核心功能页面。

#### 4.1 初始化 Next.js 项目

**命令：**
```bash
cd /Users/pis/workspace/edgex/edge-chain-uniswap-demo
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
pnpm add @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
pnpm add @uniswap/v3-sdk @uniswap/sdk-core # V3 价格计算
```

**项目结构：**
```
frontend/
├── app/
│   ├── layout.tsx (RainbowKit Provider)
│   ├── page.tsx (首页: 选择 V2/V3)
│   ├── mint/page.tsx
│   ├── create-pair/page.tsx
│   └── add-liquidity/page.tsx
├── components/
│   ├── wallet/ConnectButton.tsx
│   ├── v2/
│   │   ├── CreatePair.tsx
│   │   └── AddLiquidityV2.tsx
│   └── v3/
│       ├── CreatePool.tsx
│       └── AddLiquidityV3.tsx
├── lib/
│   ├── contracts/ (ABI 文件)
│   ├── wagmi.ts (配置)
│   └── constants.ts (合约地址)
├── package.json
└── next.config.js
```

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

#### 4.3 实现三个核心功能页面

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

**4.3.3 添加流动性页面**

**文件路径：** `frontend/app/add-liquidity/page.tsx`

**核心功能：**
- Tab 切换 V2 / V3
- **V2**: 输入 tokenA, tokenB, amountA, amountB → 授权 → 调用 `Router.addLiquidity()`
- **V3**: 输入 tokenA, tokenB, fee, 价格范围, 数量 → 授权 → 调用 `PositionManager.mint()`

**V2 组件：** `frontend/components/v2/AddLiquidityV2.tsx`
```typescript
// 1. 授权
await writeContract({
  address: tokenA,
  abi: ABIS.ERC20,
  functionName: 'approve',
  args: [CONTRACTS.V2.ROUTER, amountA],
});

// 2. 添加流动性
await writeContract({
  address: CONTRACTS.V2.ROUTER,
  abi: ABIS.UNISWAP_V2_ROUTER,
  functionName: 'addLiquidity',
  args: [tokenA, tokenB, amountA, amountB, 0, 0, userAddress, deadline],
});
```

**V3 组件：** `frontend/components/v3/AddLiquidityV3.tsx`
```typescript
// V3 更复杂，需要计算 tick 范围
// 提供预设选项: Full Range / Narrow / Wide
const PRESET_RANGES = {
  FULL: { tickLower: -887220, tickUpper: 887220 }, // tickSpacing 60
  NARROW: { tickLower: currentTick - 600, tickUpper: currentTick + 600 },
  WIDE: { tickLower: currentTick - 3000, tickUpper: currentTick + 3000 },
};

// 授权并 mint
await writeContract({
  address: CONTRACTS.V3.POSITION_MANAGER,
  abi: ABIS.UNISWAP_V3_POSITION_MANAGER,
  functionName: 'mint',
  args: [{
    token0: tokenA,
    token1: tokenB,
    fee: 3000,
    tickLower: selectedRange.tickLower,
    tickUpper: selectedRange.tickUpper,
    amount0Desired: amountA,
    amount1Desired: amountB,
    amount0Min: 0,
    amount1Min: 0,
    recipient: userAddress,
    deadline: deadline,
  }],
});
```

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

**测试流程：**
1. 访问 http://localhost:3000
2. 连接 MetaMask 到 Edge Testnet
3. 测试 Mint 代币
4. 测试创建 V2 Pair
5. 测试创建 V3 Pool
6. 测试添加 V2 流动性
7. 测试添加 V3 流动性

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

**最高优先级（阻塞后续步骤）：**
1. `contracts/token/TestToken.sol` - 简化测试代币
2. `contracts/shared/WETH9.sol` - 从 v2-periphery 复制
3. `contracts/uniswap-v2/` - 整个目录重组
4. `contracts/uniswap-v3/` - 整个目录重组

**高优先级（部署必需）：**
5. `scripts/deploy/1-deploy-weth.ts`
6. `scripts/deploy/2-deploy-v2-factory.ts`
7. `scripts/deploy/3-deploy-v2-router.ts`
8. `scripts/deploy/4-deploy-v3-factory.ts`
9. `scripts/deploy/5-deploy-v3-periphery.ts`
10. `scripts/deploy/6-deploy-test-tokens.ts`
11. `scripts/deploy/deploy-all.ts`

**中优先级（前端必需）：**
12. `frontend/` - 整个 Next.js 项目
13. `frontend/lib/wagmi.ts`
14. `frontend/lib/constants.ts`
15. `frontend/app/mint/page.tsx`
16. `frontend/app/create-pair/page.tsx`
17. `frontend/app/add-liquidity/page.tsx`

**低优先级（文档）：**
18. `docs/deployment-addresses.md`
19. `docs/create-pair-guide.md`
20. `docs/create-pool-guide.md`

### 需要修改的文件

1. `hardhat.config.ts` - 完全重写 solidity 配置 + 添加 edgeTestnet 网络（**最高优先级**）
2. `package.json` - 添加部署脚本命令
3. `.gitignore` - 添加 `deployments/`, `frontend/.next/`, `frontend/node_modules/`
4. `README.md` - 更新项目说明

### 需要删除的文件/目录

1. `contracts/v2-core/package.json`
2. `contracts/v2-core/hardhat.config.js`
3. `contracts/v2-core/test/` - 整个目录
4. `contracts/v2-periphery/package.json`
5. `contracts/v2-periphery/hardhat.config.js`
6. `contracts/v2-periphery/test/` - 整个目录
7. `contracts/v2-periphery/contracts/examples/` - 整个目录
8. `contracts/v3-core/package.json`
9. `contracts/v3-core/hardhat.config.js`
10. `contracts/v3-core/test/` - 整个目录
11. `contracts/v3-periphery/package.json`
12. `contracts/v3-periphery/hardhat.config.js`
13. `contracts/v3-periphery/test/` - 整个目录
14. `contracts/v3-periphery/contracts/test/` - 整个目录

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

### 合约部署成功标准
- ✅ 所有合约编译无错误
- ✅ 所有合约成功部署到 Edge Testnet
- ✅ `deployments/edge-testnet.json` 记录完整
- ✅ 至少创建 1 个 V2 Pair 和 1 个 V3 Pool
- ✅ 成功添加流动性到 Pair 和 Pool

### 前端成功标准
- ✅ 部署到 Vercel，可公开访问
- ✅ RainbowKit 连接钱包正常
- ✅ Mint 功能正常工作
- ✅ 创建 V2 Pair 功能正常
- ✅ 创建 V3 Pool + 初始化功能正常
- ✅ 添加 V2 流动性功能正常
- ✅ 添加 V3 流动性功能正常
- ✅ 所有交易状态显示正确

### 文档成功标准
- ✅ 部署地址文档完整
- ✅ 创建 Pair/Pool 操作指南清晰
- ✅ README 更新，包含访问 URL

---

## 预估时间线

| 阶段 | 任务 | 预估时间 | 累计时间 |
|------|------|---------|---------|
| 1 | 重构合约结构 | 1.5 天 | 1.5 天 |
| 1 | 配置多版本编译器 | 0.5 天 | 2 天 |
| 1 | 测试编译 | 0.5 天 | 2.5 天 |
| 2 | 编写部署脚本 | 1 天 | 3.5 天 |
| 2 | 本地测试部署 | 0.5 天 | 4 天 |
| 2 | Edge Testnet 正式部署 | 0.5 天 | 4.5 天 |
| 2 | 验证合约 | 0.5 天 | 5 天 |
| 3 | 测试链上交互 | 0.5 天 | 5.5 天 |
| 4 | 初始化 Next.js + 配置 | 0.5 天 | 6 天 |
| 4 | 开发 Mint 页面 | 1 天 | 7 天 |
| 4 | 开发创建 Pair/Pool 页面 | 2 天 | 9 天 |
| 4 | 开发添加流动性页面 | 2 天 | 11 天 |
| 4 | 测试前端交互 | 0.5 天 | 11.5 天 |
| 5 | 编写文档 | 1 天 | 12.5 天 |
| 5 | 部署到 Vercel | 0.5 天 | 13 天 |

**总时间：约 13 天（2 周）**

---

## 下一步行动

执行时按以下顺序进行：

1. **立即开始**：修改 `hardhat.config.ts`，配置多版本 Solidity 和 Edge Testnet 网络
2. **第 1 天**：重构合约结构，创建 `contracts/uniswap-v2/` 和 `contracts/uniswap-v3/`
3. **第 2 天**：修复 import 路径，测试编译
4. **第 3-5 天**：编写部署脚本，本地测试，Edge Testnet 部署
5. **第 6-11 天**：开发前端，测试交互
6. **第 12-13 天**：编写文档，部署到 Vercel

**关键里程碑：**
- ✅ Day 2: 编译成功
- ✅ Day 5: 合约部署成功
- ✅ Day 11: 前端功能完成
- ✅ Day 13: 项目交付

---

## 参考资料

- Uniswap V2 文档: https://docs.uniswap.org/contracts/v2/overview
- Uniswap V3 文档: https://docs.uniswap.org/contracts/v3/overview
- RainbowKit 文档: https://www.rainbowkit.com/docs/installation
- Wagmi 文档: https://wagmi.sh/
- Edge Testnet 信息: BridgeConfig-testnet.json
