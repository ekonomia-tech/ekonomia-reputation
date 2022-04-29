import { log } from '@graphprotocol/graph-ts';
import { getOrCreateAsset } from '../../../compound-v2/src/helpers/asset';
import { Account, Event } from '../../generated/schema';
import { Borrow, Deposit, LiquidationCall, Repay, Withdraw } from '../../generated/templates/LendingPool/LendingPool';
import { addToLiquidationCount, getOrCreateAccount, markAccountAsBorrowed } from '../helpers/account';
import { toUSD } from '../helpers/asset';
import { exponentToBigDecimal } from '../helpers/generic';
import { getMarket, updateStatistics } from '../helpers/market';
import { getProtocol } from '../helpers/protocol';

export function handleBorrow(event: Borrow): void {
    
    let market = getMarket(event.params.reserve.toHexString());
    let protocol = getProtocol(market.protocol)
    let asset = getOrCreateAsset(market.asset);
    let account = getOrCreateAccount(event.params.user.toHexString())
    let onBehalfOf: Account 
  
    let borrowId = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.transactionLogIndex.toString());
    
    let borrowAmount = event.params.amount
      .toBigDecimal()
      .div(exponentToBigDecimal(asset.decimals))
      .truncate(asset.decimals)
  
    let eventEntry = new Event(borrowId);
    eventEntry.eventType = "BORROW"
    eventEntry.market = market.id
    eventEntry.account = account.id

    if (event.params.onBehalfOf) {
      onBehalfOf = getOrCreateAccount(event.params.onBehalfOf.toHexString())
      eventEntry.onBehalfOf = onBehalfOf.id
    }

    eventEntry.amount = borrowAmount;
    eventEntry.amountUSD = toUSD(asset.id, eventEntry.amount)
    eventEntry.borrowRate = event.params.borrowRate;
    eventEntry.interestRateMode = event.params.borrowRateMode.toI32()
    eventEntry.blockTime = event.block.timestamp.toI32()
    eventEntry.blockNumber = event.block.number.toI32()
    eventEntry.save();

    if (onBehalfOf) {
      updateStatistics(onBehalfOf, market, protocol, eventEntry)
      markAccountAsBorrowed(onBehalfOf.id)
      return
    }
    markAccountAsBorrowed(account.id)
    updateStatistics(account, market, protocol, eventEntry)
  
  }

export function handleDeposit(event: Deposit): void {
    
    let market = getMarket(event.params.reserve.toHexString());
    let protocol = getProtocol(market.protocol)
    let asset = getOrCreateAsset(market.asset);
    let account = getOrCreateAccount(event.params.user.toHexString())
    let onBehalfOf: Account 

    let depositId = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.transactionLogIndex.toString());

    let depositAmount = event.params.amount
      .toBigDecimal()
      .div(exponentToBigDecimal(asset.decimals))
      .truncate(asset.decimals)

    let eventEntry = new Event(depositId);
    eventEntry.eventType = "DEPOSIT"
    eventEntry.market = market.id
    eventEntry.account = account.id
    
    if (event.params.onBehalfOf) {
      onBehalfOf = getOrCreateAccount(event.params.onBehalfOf.toHexString())
      eventEntry.onBehalfOf = onBehalfOf.id
    }

    eventEntry.amount = depositAmount
    eventEntry.amountUSD = toUSD(asset.id, eventEntry.amount)
    eventEntry.blockTime = event.block.timestamp.toI32()
    eventEntry.blockNumber = event.block.number.toI32()
    eventEntry.save();

    if (onBehalfOf) {
        updateStatistics(onBehalfOf, market, protocol, eventEntry)
        return
    }
    updateStatistics(account, market, protocol, eventEntry)
}

export function handleWithdraw(event: Withdraw): void {
   
    let market = getMarket(event.params.reserve.toHexString())
    let protocol = getProtocol(market.protocol)
    let asset = getOrCreateAsset(market.asset);
    let account = getOrCreateAccount(event.params.user.toHexString())
    let to = getOrCreateAccount(event.params.to.toHexString())

    let depositId = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.transactionLogIndex.toString());

    let depositAmount = event.params.amount
      .toBigDecimal()
      .div(exponentToBigDecimal(asset.decimals))
      .truncate(asset.decimals)

    let eventEntry = new Event(depositId);
    eventEntry.eventType = "WITHDRAW"
    eventEntry.market = market.id
    eventEntry.account = account.id
    eventEntry.amount = depositAmount
    eventEntry.amountUSD = toUSD(asset.id, eventEntry.amount)
    eventEntry.blockTime = event.block.timestamp.toI32()
    eventEntry.blockNumber = event.block.number.toI32()
    eventEntry.to = to.id
    eventEntry.save();
    
    updateStatistics(account, market, protocol, eventEntry)
}

export function handleRepay(event: Repay): void {
   
    let market = getMarket(event.params.reserve.toHexString())
    let protocol = getProtocol(market.protocol)
    let asset = getOrCreateAsset(market.asset);
    let account = getOrCreateAccount(event.params.user.toHexString())
    let repayer = getOrCreateAccount(event.params.repayer.toHexString())

    let repayId = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.transactionLogIndex.toString());

    let repayAmount = event.params.amount
      .toBigDecimal()
      .div(exponentToBigDecimal(asset.decimals))
      .truncate(asset.decimals)

    let eventEntry = new Event(repayId);
    eventEntry.eventType = "REPAY"
    eventEntry.market = market.id
    eventEntry.account = account.id
    eventEntry.payer = repayer.id
    eventEntry.amount = repayAmount
    eventEntry.amountUSD = toUSD(asset.id, eventEntry.amount)
    eventEntry.blockTime = event.block.timestamp.toI32()
    eventEntry.blockNumber = event.block.number.toI32()
    eventEntry.save();

    updateStatistics(account, market, protocol, eventEntry)
}

export function handleLiquidate(event: LiquidationCall): void {
   
    let market = getMarket(event.params.debtAsset.toHexString())
    let protocol = getProtocol(market.protocol)
    let asset = getOrCreateAsset(market.asset);
    let collateralMarket = getMarket(event.params.collateralAsset.toHexString())
    let collateralAsset = getOrCreateAsset(collateralMarket.asset)
    let account = getOrCreateAccount(event.params.user.toHexString())
    let liquidator = getOrCreateAccount(event.params.liquidator.toHexString())

    addToLiquidationCount(account, true)
    addToLiquidationCount(liquidator, false)

    let repayId = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.transactionLogIndex.toString());

    let LiquidateAmount = event.params.debtToCover
      .toBigDecimal()
      .div(exponentToBigDecimal(asset.decimals))
      .truncate(asset.decimals)

    let liquidatedCollateralAmount = event.params.liquidatedCollateralAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(collateralAsset.decimals))
      .truncate(collateralAsset.decimals)

    let eventEntry = new Event(repayId);
    eventEntry.eventType = "LIQUIDATION"
    eventEntry.market = market.id
    eventEntry.account = account.id
    eventEntry.liquidator = liquidator.id
    eventEntry.amount = LiquidateAmount
    eventEntry.amountUSD = toUSD(asset.id, eventEntry.amount)
    eventEntry.blockTime = event.block.timestamp.toI32()
    eventEntry.blockNumber = event.block.number.toI32()
    eventEntry.save();
    
    updateStatistics(account, market, protocol, eventEntry)
}


// export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  
//   let market = getMarket(event.params.reserve.toHexString())
//   market.liquidityRate = event.params.liquidityRate
//   market.liquidityIndex = event.params.liquidityIndex
//   market.stableBorrowRate = event.params.stableBorrowRate
//   market.variableBorrowIndex = event.params.variableBorrowIndex
//   market.variableBorrowRate = event.params.variableBorrowRate

//   market.save()
// }