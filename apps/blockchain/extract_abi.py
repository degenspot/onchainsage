import json; contract = json.load(open("contract.json")); abi = contract.get("abi", []); json.dump(abi, open("contract_abi.json", "w"), indent=2); print("ABI extracted successfully")
