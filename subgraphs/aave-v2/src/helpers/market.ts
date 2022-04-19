import { BigDecimal } from "@graphprotocol/graph-ts";
import { Account, Event, Market, Position, Protocol } from "../../generated/schema";
import { getOrCreateAccount, getOrCreateAccountInMarket, updateAccountStats } from "./account";
import { getOrCreateAsset } from "./asset";
import { getConcatenatedId, getOrCreateAssetTotals, getOrCreateCountTotals } from "./generic";
import { updateProtocolStats } from "./protocol";
import { incrementReputationStats } from "./reputation";

export function getMarket(marketId: string): Market {
    let market = Market.load(marketId);
    if (market) {
        return market;
    }
    return new Market("")
}

export function updateStatistics(account: Account, market: Market, protocol: Protocol , event: Event): void {
    updateMarketPositions(account, market, event)
    updateMarketStats(account, market, event)
    updateProtocolStats(account, protocol, event)
    updateAccountStats(account, event)
}

export function updateMarketStats(account: Account, market: Market, event: Event): void {
  let asset = getOrCreateAsset(market.asset)
  let aim = getOrCreateAccountInMarket(market.id, account.id)
  let aimAsset = getOrCreateAssetTotals(getConcatenatedId([aim.id, asset.id]))
  let aimCount = getOrCreateCountTotals(getConcatenatedId([aim.id, "count"]))
  
  if(event.eventType == "BORROW") {
    aimAsset.borrowed = aimAsset.borrowed.plus(event.amount)
    aimCount.borrowed += 1
  } else if(event.eventType == "REPAY") {
    aimAsset.repaid = aimAsset.repaid.plus(event.amount)
    aimCount.repaid += 1
  } else if(event.eventType == "DEPOSIT") {
    aimAsset.deposited = aimAsset.deposited.plus(event.amount)
    aimCount.deposited += 1
  } else if(event.eventType == "WITHDRAW") {
    aimAsset.withdrawn = aimAsset.withdrawn.plus(event.amount)
    aimCount.withdrawn += 1
  } else if (event.eventType == "LIQUIDATION") {
    aimAsset.liquidated = aimAsset.liquidated.plus(event.amount)
    aimCount.liquidated += 1
  }

  aimAsset.save()
  aimCount.save()
}

export function updateMarketPositions(account: Account, market: Market, event: Event): void {

  if (!(account.id && market.id)) {
    return
  }

  // verify the event is not LIQUIDATION or TRANSFER
  if (!shouldProcess(event.eventType)) {
    return;
  }

  let position = getOrCreatePosition(account.id, market.id, event.eventType, '')
  
  // In case of a closed position, if there is a remainder of interest to be paid, but the balance is under 0, then the 
  // repayment will be added to the last closed position as a repayment event
  if (isPartialRepayment(position, event)) {
    updateLastPositionPartialPayment(position, event)
    return
  }
  updatePosition(position, event)
}

export function getOrCreatePosition(accountId: string, marketId: string, eventType: string, loc: string): Position {
  let type = ["BORROW", "REPAY"].includes(eventType) ? "BOR" : "LEN"; 
  let positionId = getConcatenatedId([accountId, marketId, type, loc])  
  let position = Position.load(positionId);
    if (position) {
      return position
    }
    position = new Position(positionId);
    position.account = accountId
    position.market = marketId
    position.type = type
    position.balance = BigDecimal.zero()
    position.borrowed = BigDecimal.zero()
    position.repaid = BigDecimal.zero()
    position.deposited = BigDecimal.zero()
    position.withdrawn = BigDecimal.zero()
    position.isActive = true
    position.events = []
    position.interestPaid = BigDecimal.zero()
    position.closedPositions = []

    return position
    
}

export function calculatePositionBalance(position: Position): BigDecimal {
  let balance = BigDecimal.zero();
  for(let i = 0; i < position.events.length; i++) {
    let current = Event.load(position.events[i]);
    if (!current) {
      continue;
    }
    if (["BORROW", "WITHDRAW"].includes(current.eventType)) {
      balance = balance.minus(current.amount)
    } else if (["REPAY", "DEPOSIT"].includes(current.eventType)){
      balance = balance.plus(current.amount)
    }
  }

  return balance
}

export function updatePosition(position: Position, event: Event): void {
  
  let potentialInterest = BigDecimal.zero()
  let newPos: Position
  let account = getOrCreateAccount(position.account)
  
  let pEvents = position.events
  pEvents.push(event.id)
  position.events = pEvents
  position.save()

  if (position.type == "BOR") {
    if (event.eventType == "BORROW") {
      position.borrowed = position.borrowed.plus(event.amount)
    } else {
      position.repaid = position.repaid.plus(event.amount)
    }
    
    // Calculate the status of the position and the interest if repaid in any form.
    potentialInterest = position.repaid.minus(position.borrowed)
    
    if (potentialInterest >= BigDecimal.zero()) {
      
      // If repaid > borrow, it means the position has been repaid and the remainder is
      // the interest. In this case we create a new postion that will act as legacy
      // and will be added to the closedPositions[] array
      // The original position will be reset and will be reused to identify an active position in the market.
      
      newPos = createChildPosition(position, potentialInterest)
      let cEvents = position.closedPositions
      cEvents.push(newPos.id)
      position.closedPositions = cEvents
      position.save()

      incrementReputationStats(account, "BOR")

      position = resetPositionStats(position)
      position.save()
    }
    
  } else {
    if (event.eventType == "DEPOSIT") {
      position.deposited = position.deposited.plus(event.amount)
    } else {
      position.withdrawn = position.withdrawn.plus(event.amount)
    }

    // Calculate the status of the position and the interest if repaid in any form.
    potentialInterest = position.withdrawn.minus(position.deposited)
    
    if (potentialInterest > BigDecimal.zero()) {

      // If withdrawn > deposit, it means the position has been withdrawn and the remainder is
      // the interest. In this case we create a new postion that will act as legacy
      // and will be added to the closedPositions[] array
      // The original position will be reset and will be reused to identify an active position in the market.

      newPos = createChildPosition(position, potentialInterest)
      let cEvents = position.closedPositions
      cEvents.push(newPos.id)
      position.closedPositions = cEvents
      position.save()

      incrementReputationStats(account,"LEN")

      position = resetPositionStats(position)
      position.save()

    }
  }

  position.balance = calculatePositionBalance(position);

  position.save();

}


export function resetPositionStats(position: Position): Position {
  position.balance = BigDecimal.zero()
  position.borrowed = BigDecimal.zero()
  position.repaid = BigDecimal.zero()
  position.deposited = BigDecimal.zero()
  position.withdrawn = BigDecimal.zero()
  position.isActive = false
  position.events = []
  position.interestPaid = BigDecimal.zero()

  return position
}

export function createChildPosition(position: Position, interest: BigDecimal): Position {
  let loc = (position.closedPositions.length + 1).toString()
  let type = position.type == "BOR" ? "BORROW" : "DEPOSIT"
  let newPos = getOrCreatePosition(position.account, position.market, type, loc)
  
  newPos.borrowed = position.borrowed
  newPos.repaid = position.repaid
  newPos.deposited = position.deposited
  newPos.withdrawn = position.withdrawn
  newPos.closedPositions = []
  newPos.isActive = false
  newPos.interestPaid = interest
  newPos.events = position.events
  newPos.save()

  return newPos
}

export function isPartialRepayment(position: Position, event: Event ): boolean {
    return !position.isActive && event.eventType == "REPAY" && event.amount > BigDecimal.zero()
}

export function getLastClosedPosition(position: Position): Position {
  return new Position(position.closedPositions[position.closedPositions.length - 1])
}

export function updateLastPositionPartialPayment(position: Position, event: Event): void {
  let lastPosition = getLastClosedPosition(position)
  let updatedEvents = lastPosition.events
  updatedEvents.push(event.id)
  lastPosition.events = updatedEvents
  lastPosition.interestPaid = lastPosition.interestPaid.plus(event.amount)
  lastPosition.repaid = lastPosition.repaid.plus(event.amount) 
  lastPosition.save()
}

export function shouldProcess(eventType: string): boolean {
  return !["LIQUIDATION", "TRANSFER"].includes(eventType)
}