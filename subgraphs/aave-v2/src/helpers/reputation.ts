import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { Account, ClosedPositionsGain, Event, Position, Reputation } from "../../generated/schema"
import { EventData } from "../common/types"
import { daysDiff, getConcatenatedId } from "./generic"


export function getOrCreateReputation(id: string): Reputation {
    let reputation = Reputation.load(id)
    if (reputation) {
      return reputation
    }
    reputation = new Reputation(id)
    reputation.exp = BigDecimal.zero()
    reputation.closedBorrowPositions = 0
    reputation.closedDepositPositions = 0
    reputation.activityLog = []
    reputation.save()
    return reputation
}

export function getOrCreateClosedPositionGain(position: Position): ClosedPositionsGain {
    let cpgId = getConcatenatedId([position.id, "CPG"])
    let cpg = ClosedPositionsGain.load(cpgId)
    if (!cpg) {
        cpg = new ClosedPositionsGain(cpgId)
        cpg.position = position.id
        cpg.expGained = BigDecimal.zero()
        cpg.save()
    }
    return cpg
}

export function accrueReputationExp(account: Account, position: Position, expGained: BigDecimal): void {
    
    let accountReputation = getOrCreateReputation(account.reputation)
    
    if (position.type == "BOR") {
        accountReputation.closedBorrowPositions += 1
    } else {
        accountReputation.closedDepositPositions += 1
    }

    // Create the log entry for accumulation 
    // let activityLog = accountReputation.activityLog
    // let cpg = getOrCreateClosedPositionGain(position)
    // cpg.expGained = expGained
    // cpg.save()

    // // log the CPG into reputation acitivity log
    // activityLog.push(cpg.id)
    // accountReputation.activityLog = activityLog

    // Accrue reputation
    if (expGained > BigDecimal.zero()) {
        accountReputation.exp = accountReputation.exp.plus(expGained) 
    }
    
    accountReputation.save()

}


export function updateReputation(account: Account, position: Position): void {
    
    let events = new EventData()
    let accumulatives = new EventData()
    let expDelta = 0.0

    for (let i = 0; i < position.events.length; i++) {
        if (!position.events[i]) {
            continue
        }
        let ev = Event.load(position.events[i]);
        if (ev) {     
            if (["BORROW", "DEPOSIT"].includes(ev.eventType)) {
                accumulatives.addEvent(ev)
            } else {
                events.addEvent(ev)
            }
        }
        
    }

    // Iterate through the relevant events
    for (let i = 0; i < events.size; i++) {
        
        // In a deductive event, iterate through the accumulative events and deduct the amount until deduction is 0
        for(let j = 0; j < accumulatives.size; j++) {

            let days = daysDiff(accumulatives.getBlockTime(j), events.getBlockTime(i))
            let borrowAmount = accumulatives.getAmount(j)
            let repayAmount = events.getAmount(i)
            let diff = borrowAmount - repayAmount 

            if (borrowAmount == 0) {
                continue
            }
            
            if (diff > 0) {

                // accumulate exp based on the repaid amount over time
                expDelta = calculateExp(expDelta, repayAmount, days)
                
                // deduct the amount from the original accumulative event so in the next iteration, only partial amount will be eligible for processing
                accumulatives.setAmount(j, borrowAmount - repayAmount)
                break

            } else {

                // accumulate exp based on the repaid amount over time
                expDelta = calculateExp(expDelta, borrowAmount, days)

                // deduct the amount from the original event signifying the repaid amount is spanning over more than 1 accumulative event
                events.setAmount(i, (repayAmount - borrowAmount))

                // Zero out the current accumulative event so in the next iteration this event will be skipped and will not be dudcted from
                accumulatives.setAmount(j, 0)
            }
        }
    }

    if (expDelta > 0) {
        let bigIntExp = BigDecimal.fromString(expDelta.toString())
        accrueReputationExp(account, position, bigIntExp)
    }
    
}

export function calculateExp(current: number, amount: number, days: number): number {
    let multiplier = days / 365
    let totalDelta = amount * multiplier
    return current + totalDelta
}