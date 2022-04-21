import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Account, Event, Position, Reputation } from "../../generated/schema"
import { daysDiff } from "./generic"


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

// export function updateReputation(account: Account, position: Position): void {
//     let total = BigDecimal.zero()
//     let totalExp = 0
//     let parts: { amount: BigDecimal, blockTime: i32 }[] = []

//     for (let i = 0; i < position.events.length; i++) {
//         let event = Event.load(position.events[i]);
        
//         if (["BORROW", "DEPOSIT"].includes(event.eventType)) {
//             parts.push({ amount: event.amount, blockTime: event.blockTime })
//             total = total.plus(event.amount)
//         } else {
//             for(let j = 0; j < parts.length; j++) {
//                 let days = daysDiff(parts[j].blockTime, event.blockTime)
//                 let diff = parts[j].amount.minus(event.amount)

               
//                 if (diff > BigDecimal.zero()) {
//                     break
//                 }
//             }
//         }

//     }
// }

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