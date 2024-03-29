import { Account, AccountInMarket, AccountInProtocol, Event } from "../../generated/schema";
import { getOrCreateAsset } from '../helpers/asset';
import { getMarket } from '../helpers/market';
import { getConcatenatedId, getOrCreateAssetTotals, getOrCreateCountTotals } from "./generic";
import { getOrCreateReputation } from "./reputation";

export function getOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId)
    let reputation = getOrCreateReputation(getConcatenatedId([account.id, "REP"]))
    let countTotals = getOrCreateCountTotals(getConcatenatedId([account.id, "count"]))
    account.hasBorrowed = false
    account.liquidatedCount = 0
    account.liquidatingCount = 0
    account.assets = []
    account.seasons = []
    account.reputation = reputation.id
    account.countTotals = countTotals.id
    account.save()
  }
  return account;
}


export function markAccountAsBorrowed(accountId: string): void {
  let account = getOrCreateAccount(accountId);
  account.hasBorrowed = true;
  account.save()
}

export function addToLiquidationCount(account: Account, isLiquidated: boolean): void {
  // Adds a count if account is liduidated or liquidating
  if (isLiquidated) {
    account.liquidatedCount += 1
  } else {
    account.liquidatingCount += 1
  }
  account.save()
}

export function getOrCreateAccountInProtocol(protocolId: string, accountId: string): AccountInProtocol {
  const acpId = getConcatenatedId([accountId, protocolId])
  let acp = AccountInProtocol.load(acpId)
  if (!acp) { 
    let countTotal = getOrCreateCountTotals(getConcatenatedId([acpId, "count"]))
    acp = new AccountInProtocol(acpId)
    acp.protocol = protocolId
    acp.account = accountId
    acp.countTotals = countTotal.id
    acp.save()
  }
  return acp
}

export function getOrCreateAccountInMarket(marketId: string, accountId: string): AccountInMarket {
  const acmId = getConcatenatedId([accountId, marketId])
  let acm = AccountInMarket.load(acmId)
  if (!acm) {
    let market = getMarket(marketId)
    let asset = getOrCreateAsset(market.asset)
    let countTotal = getOrCreateCountTotals(getConcatenatedId([acmId, "count"]))
    let assetTotal = getOrCreateAssetTotals(getConcatenatedId([acmId, asset.id]))
    
    acm = new AccountInMarket(acmId)
    acm.market = marketId
    acm.account = accountId
    acm.assetTotals = assetTotal.id
    acm.countTotals = countTotal.id
    acm.save()
  }
  return acm
}

export function updateAccountStats(account: Account, event: Event): void {
  let accountTotals = getOrCreateCountTotals(getConcatenatedId([account.id, "count"]))
  
  if(event.eventType == "BORROW") {
    accountTotals.borrowed += 1
  } else if(event.eventType == "REPAY") {
    accountTotals.repaid += 1
  } else if(event.eventType == "DEPOSIT") {
    accountTotals.deposited += 1
  } else if(event.eventType == "WITHDRAW") {
    accountTotals.withdrawn += 1
  } else if (event.eventType == "LIQUIDATION") {
    accountTotals.liquidated += 1
  }

  accountTotals.save()
}