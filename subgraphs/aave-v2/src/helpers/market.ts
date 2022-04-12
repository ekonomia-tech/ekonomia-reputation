import { BigDecimal } from "@graphprotocol/graph-ts";
import { Market } from "../../generated/schema";

export function getMarket(marketId: string): Market {
    let market = Market.load(marketId);
    if (market) {
        return market;
    }
    return new Market("")
}


export function updateMarketStats(marketId: string, eventType: string, amount: BigDecimal): void {
   // TODO
}