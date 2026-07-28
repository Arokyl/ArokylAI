// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ExecutionProxy.sol";

contract DeployArc is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("ARC_DEPLOYER_PRIVATE_KEY");
        address feeVault = vm.envOr("FEE_VAULT", vm.addr(deployerKey));
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(10));

        if (deployerKey != 0) {
            vm.startBroadcast(deployerKey);
        } else {
            vm.startBroadcast();
        }

        ExecutionProxy impl = new ExecutionProxy();
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), "");
        ExecutionProxy proxied = ExecutionProxy(payable(address(proxy)));
        proxied.initialize(feeVault, feeBps);

        console.log("ExecutionProxy (proxy):", address(proxied));
        console.log("ExecutionProxy (impl):", address(impl));
        console.log("Fee vault:", feeVault);
        console.log("Fee bps:", feeBps);
        console.log("Chain: Arc Testnet (13371)");

        vm.stopBroadcast();
    }
}