import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { AssetTotal, CountTotal, USDTotal } from "../../generated/schema"

export function exponentToBigDecimal(decimals: i32): BigDecimal {
    let bd = BigDecimal.fromString('1')
    for (let i = 0; i < decimals; i++) {
      bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}

export let zeroBD = BigDecimal.fromString('0')
export let zeroInt = BigInt.fromString('0');
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(18)

export const AAVE_V2_REGISTRY = "0x52D306e36E3B6B02c153d0266ff0f85d18BCD413"


export function getOrCreateUSDTotals(id: string): USDTotal {
  let usdt = USDTotal.load(id);
  if (usdt) {
    return usdt;
  }
  usdt = new USDTotal(id);
  usdt.depositedUSD = BigDecimal.zero()
  usdt.withdrawnUSD = BigDecimal.zero()
  usdt.borrowedUSD = BigDecimal.zero()
  usdt.repaidUSD = BigDecimal.zero()
  usdt.liquidatedUSD = BigDecimal.zero()
  usdt.save()
  
  return usdt
}

export function getOrCreateAssetTotals(id: string): AssetTotal {
let assetTotal = AssetTotal.load(id);
if (assetTotal) {
  return assetTotal;
}
assetTotal = new AssetTotal(id);
assetTotal.deposited = BigDecimal.zero()
assetTotal.withdrawn = BigDecimal.zero()
assetTotal.borrowed = BigDecimal.zero()
assetTotal.repaid = BigDecimal.zero()
assetTotal.liquidated = BigDecimal.zero()
assetTotal.save()

return assetTotal
}

export function getOrCreateCountTotals(id: string): CountTotal {
let countTotal = CountTotal.load(id);
if (countTotal) {
  return countTotal;
}
countTotal = new CountTotal(id);
countTotal.deposited = 0
countTotal.withdrawn = 0
countTotal.borrowed = 0
countTotal.repaid = 0
countTotal.liquidated = 0
countTotal.save()

return countTotal
}


export function getConcatenatedId(list: string[]): string {
  let result = "";
  for(let i = 0; i < list.length; i++) {
    if (!list[i]) {
      continue
    }
    result = result.concat(list[i]);
    if (i+1 < list.length && list[i+1]) [
      result = result.concat('-')
    ]
  }
  return result;
}