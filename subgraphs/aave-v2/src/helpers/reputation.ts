import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Account, Event, Position, Reputation } from "../../generated/schema"
import { daysDiff } from "./generic"


export function getOrCreateReputation(id: string): Reputation {
    let reputation = Reputation.load(id)
    if (reputation) {
      return reputation
    }
    reputation = new Reputation(id)
    reputation.exp = BigDecimal.zero()
    reputation.closedBorrowPositions = 0
    reputation.closedDepositPositions = 0
    reputation.save()
    return reputation
}

// export function updateReputation(account: Account, position: Position): void {
//     let expDelta = BigDecimal.zero()
//     let borrows: { amount: BigDecimal, blockTime: i32 }[] = []

//     for (let i = 0; i < position.events.length; i++) {
//         let event = Event.load(position.events[i]);
        
//         if (["BORROW", "DEPOSIT"].includes(event.eventType)) {
//             borrows.push({ amount: event.amount, blockTime: event.blockTime })
//         } else {
//             for(let j = 0; j < borrows.length; j++) {
//                 let days = daysDiff(borrows[j].blockTime, event.blockTime).toBigDecimal()
//                 let borrowAmount = borrows[j].amount
//                 let repayAmount = event.amount
//                 let diff = borrowAmount.minus(repayAmount)

//                 if (borrowAmount == BigDecimal.zero()) {
//                     continue
//                 }

                
//                 if (diff > BigDecimal.zero()) {
//                     expDelta = calculateExp(expDelta, borrowAmount, days)
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
    

    reputation.save()
}

export function calculateExp(current: BigDecimal, amount: BigDecimal, days: i32): BigDecimal {
    let multiplier = new BigDecimal(new BigInt(days / 365))
    return current.plus(amount.times(multiplier))
}