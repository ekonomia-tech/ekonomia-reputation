import { BigInt } from "@graphprotocol/graph-ts"
import { Account, Reputation } from "../../generated/schema"

export function getOrCreateReputation(id: string): Reputation {
    let reputation = Reputation.load(id)
    if (reputation) {
      return reputation
    }
    reputation = new Reputation(id)
    reputation.exp = 0
    reputation.closedBorrowPositions = 0
    reputation.closedDepositPositions = 0
    reputation.save()
    return reputation
}

export function incrementReputationStats(account: Account, type: string): void {

    let reputation = getOrCreateReputation(account.reputation)
    if (type == "BOR") {
        reputation.closedBorrowPositions += 1
    } else {
        reputation.closedDepositPositions += 1
    }
    
    reputation.exp += 10
    reputation.save()
}