import { Address } from "@graphprotocol/graph-ts";
import { PairCreated } from "../../../generated/templates/Pair/Factory"

export function handleNewPair(event: PairCreated): void {
    // let protocol = getOrCreateDexAmm();
    // // create the tokens and tokentracker
    // let token0 = getOrCreateToken(event.params.token0);
    // let token1 = getOrCreateToken(event.params.token1);
    // let LPtoken = getOrCreateToken(event.params.pair);
    // let tokenTracker0 = getOrCreateTokenTracker(event.params.token0);
    // let tokenTracker1 = getOrCreateTokenTracker(event.params.token1);
    // tokenTracker0.derivedETH = findEthPerToken(tokenTracker0);
    // tokenTracker1.derivedETH = findEthPerToken(tokenTracker1);
    // createLiquidityPool(event, protocol, event.params.pair, token0, token1, LPtoken);
  }