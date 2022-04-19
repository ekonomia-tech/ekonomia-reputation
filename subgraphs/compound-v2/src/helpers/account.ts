import { BigDecimal } from "@graphprotocol/graph-ts";
import { Account, AccountInMarket, AccountInProtocol } from "../../generated/schema";
import { getOrCreateAsset } from "./asset";
import { getConcatenatedId, getOrCreateAssetTotals, getOrCreateCountTotals } from "./generic";
import { getOrCreateMarket } from "./market";

export function getOrCreateAccount(accountId: string): Account {
    let account = Account.load(accountId);
    if (!account) {
      account = new Account(accountId)
      account.hasBorrowed = false
      account.liquidatedCount = 0
      account.liquidatingCount = 0
      account.assets = []
      account.seasons = []
      account.reputationRequested = false
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

export function getOrCreateAccountInMarket(marketId: string, accountId: string): AccountInMarket {
  const acmId = getConcatenatedId([accountId, marketId])
  let acm = AccountInMarket.load(acmId)
  if (!acm) {
    let market = getOrCreateMarket(marketId)
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

export function getOrCreateAccountInProtocol(protocolId: string, accountId: string) : AccountInProtocol {
  let aipId = getConcatenatedId ([protocolId, accountId])
  let aip = AccountInProtocol.load(aipId);
  if (aip) {
    return aip
  }
  aip = new AccountInProtocol(aipId)
  
  let countTotals = getOrCreateCountTotals(getConcatenatedId([aipId, "count"]))
  aip.account = accountId
  aip.protocol = protocolId
  aip.countTotals = countTotals.id
  
  aip.save()

  return aip

}