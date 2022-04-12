import { MarketEntered, MarketExited, MarketListed, NewCloseFactor, NewCollateralFactor, NewLiquidationIncentive, NewMaxAssets, NewPriceOracle } from "../../generated/Comptroller/Comptroller"
import { CToken } from "../../generated/templates"
import { getOrCreateAccount, getOrCreateAccountInMarket, getOrCreateAccountInProtocol } from "../helpers/account"
import { mantissaFactorBD  } from "../helpers/generic"
import { getOrCreateMarket } from "../helpers/market"
import { getProtocol } from "../helpers/protocol"

export function handleMarketListed(event: MarketListed): void {
    // Dynamically index all new listed tokens
    CToken.create(event.params.cToken)
    // Create the market for this token, since it's now been listed.
    let market = getOrCreateMarket(event.params.cToken.toHexString())
}

export function handleMarketEntered(event: MarketEntered): void {
    let market = getOrCreateMarket(event.params.cToken.toHexString())
    let account = getOrCreateAccount(event.params.account.toHexString())
    let protocol = getProtocol(market.protocol)
    getOrCreateAccountInProtocol(protocol.id, account.id, "LT")
    getOrCreateAccountInMarket(market.id, account.id, "LT")
}