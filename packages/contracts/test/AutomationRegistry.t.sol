// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/Vm.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/AutomationRegistry.sol";
import "../src/ExecutionProxy.sol";

contract MockERC20 {
    string public symbol;
    uint8  public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _symbol) { symbol = _symbol; }

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        return true;
    }
}

contract MockAggregator {
    MockERC20 public outputToken;
    uint256   public outputAmount;

    constructor(MockERC20 _out, uint256 _amount) {
        outputToken  = _out;
        outputAmount = _amount;
    }

    fallback() external payable {
        outputToken.mint(msg.sender, outputAmount);
    }
}

contract AutomationRegistryTest is Test {
    AutomationRegistry registry;
    ExecutionProxy    proxy;
    MockERC20          tokenIn;
    MockERC20          tokenOut;
    MockAggregator     aggregator;

    address owner   = address(this);
    address user    = makeAddr("user");
    address keeper  = makeAddr("keeper");

    function setUp() public {
        // Deploy ExecutionProxy
        ExecutionProxy impl = new ExecutionProxy();
        bytes memory initData = abi.encodeCall(ExecutionProxy.initialize, (address(this), 0)); // 0% fee
        ERC1967Proxy proxyContract = new ERC1967Proxy(address(impl), initData);
        proxy = ExecutionProxy(payable(address(proxyContract));

        // Deploy registry
        AutomationRegistry regImpl = new AutomationRegistry();
        bytes memory regInitData = abi.encodeCall(AutomationRegistry.initialize, (address(proxy)));
        ERC1967Proxy regProxy = new ERC1967Proxy(address(regImpl), regInitData);
        registry = AutomationRegistry(address(regProxy));

        // Deploy tokens
        tokenIn  = new MockERC20("WETH");
        tokenOut = new MockERC20("USDC");

        // Deploy mock aggregator
        aggregator = new MockAggregator(tokenOut, 2000e6);

        // Approve aggregator target on ExecutionProxy
        proxy.setApprovedTarget(address(aggregator), true);

        // Fund user
        tokenIn.mint(user, 10 ether);

        // Authorize keeper
        registry.setKeeper(keeper, true);
    }

    function test_createOrder() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        uint256 orderId = registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );

        assertEq(orderId, 0, "First order ID should be 0");
        assertEq(registry.orders(0).user, user, "Order user mismatch");
        assertTrue(registry.orders(0).active, "Order should be active");
        vm.stopPrank();
    }

    function test_keeperExecutesOrder() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        uint256 orderId = registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );
        vm.stopPrank();

        uint256 userBalanceBefore = tokenOut.balanceOf(user);

        vm.startPrank(keeper);
        registry.executeOrder(orderId);
        vm.stopPrank();

        uint256 received = tokenOut.balanceOf(user) - userBalanceBefore;
        assertGt(received, 0, "User should receive output tokens");
        assertFalse(registry.orders(orderId).active, "Order should be inactive after execution");
    }

    function test_userCanCancelOrder() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        uint256 orderId = registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );

        registry.cancelOrder(orderId);
        assertFalse(registry.orders(orderId).active, "Order should be inactive after cancel");
        vm.stopPrank();
    }

    function test_revert_executeOrder_unauthorizedKeeper() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        uint256 orderId = registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );
        vm.stopPrank();

        address fakeKeeper = makeAddr("fake");
        vm.startPrank(fakeKeeper);
        vm.expectRevert(AutomationRegistry.Unauthorized.selector);
        registry.executeOrder(orderId);
        vm.stopPrank();
    }

    function test_revert_executeOrder_gasPriceTooHigh() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        uint256 orderId = registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );
        vm.stopPrank();

        vm.startPrank(keeper);
        vm.expectRevert(AutomationRegistry.GasPriceTooHigh.selector);
        vm.deal(address(this), 10 ether);
        registry.executeOrder{gasPrice: 100 gwei}(orderId);
        vm.stopPrank();
    }

    function test_revert_createOrder_expired() public {
        vm.startPrank(user);
        tokenIn.approve(address(registry), 1 ether);

        vm.expectRevert("Expiry must be future");
        registry.createOrder(
            address(tokenIn),
            address(tokenOut),
            1 ether,
            1900e6,
            block.timestamp - 1,
            block.timestamp + 1 days,
            address(aggregator),
            ""
        );
        vm.stopPrank();
    }
}
