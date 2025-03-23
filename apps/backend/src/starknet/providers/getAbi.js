import { RpcProvider } from "starknet";
import fs from "fs";

const provider = new RpcProvider({
  nodeUrl: "https://starknet-sepolia.infura.io/v3/a9a859f426df4da5a4f176032885f533", // Public RPC URL
});


async function getABI() {
  const classInfo = await provider.getClass("0x05b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564");
  console.log(JSON.stringify(classInfo.abi, null, 2));
  fs.writeFileSync("abi.json", JSON.stringify(classInfo.abi, null, 2));
console.log("ABI saved to abi.json");

}

getABI();