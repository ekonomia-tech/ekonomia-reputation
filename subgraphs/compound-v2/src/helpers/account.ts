import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Account, AccountInMarket, AccountInProtocol } from "../../generated/schema";
import { getOrCreateAsset } from "./asset";
import { getOrCreateAssetTotals, getOrCreateCountTotals, getOrCreateUSDTotals, zeroBD, zeroInt } from "./generic";
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

export function getOrCreateAccountInProtocol(protocolId: string, accountId: string, period: string): AccountInProtocol {
  const acpId = protocolId
    .concat('-')
    .concat(accountId)
    .concat('-')
    .concat(period);

  let acp = AccountInProtocol.load(acpId)
  if (!acp) { 
    let USDTotal =  getOrCreateUSDTotals(acpId.concat("-USD"))
    let countTotal = getOrCreateCountTotals(acpId.concat("-count"))
    acp = new AccountInProtocol(acpId)
    acp.protocol = protocolId
    acp.account = accountId
    acp.USDTotals = USDTotal.id
    acp.countTotals = countTotal.id
    acp.save()
  }
  return acp
}

export function getOrCreateAccountInMarket(marketId: string, accountId: string, period: string): AccountInMarket {
  const acmId = marketId.concat('-').concat(accountId).concat('-').concat(period);
  let acm = AccountInMarket.load(acmId)
  if (!acm) {
    let market = getOrCreateMarket(marketId)
    let asset = getOrCreateAsset(market.asset)
    let USDTotal =  getOrCreateUSDTotals(acmId.concat("-USD"))
    let countTotal = getOrCreateCountTotals(acmId.concat("-count"))
    let assetTotal = getOrCreateAssetTotals(acmId.concat("-").concat(asset.id))
    
    acm = new AccountInMarket(acmId)
    acm.market = marketId
    acm.account = accountId
    acm.USDTotals = USDTotal.id
    acm.assetTotals = assetTotal.id
    acm.countTotals = countTotal.id
    acm.save()
  }
  return acm
}

export function updateAccountStats(protocolId: string, marketId: string, accountId: string, amount: BigDecimal, eventType: string): void {
  // TODO

}