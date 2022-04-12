import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Comptroller/ERC20";
import { Market, Protocol } from "../../generated/schema";
import { CToken } from "../../generated/templates/CToken/CToken";
import { getOrCreateAsset } from "./asset";
import { CETH_ADDRESS , DAI_V1_ADDRESS , UNITROLLER_ADDRESS , zeroBD } from "./generic";
import { createProtocol } from "./protocol";

export function getOrCreateMarket(marketAddress: string): Market {
    let market = Market.load(marketAddress);
    if (market) {
        return market
    }
    
    let contract = CToken.bind(Address.fromString(marketAddress))
    let protocol = Protocol.load("COMPOUND-ETHREUM")
    if (!protocol) {
      protocol = createProtocol(Address.fromString(UNITROLLER_ADDRESS), "COMPOUND")
    }

    let assetAddress: Address;
    let assetSymbol: string
    let assetName: string
    let assetDecimals: i32


    // It is CETH, which has a slightly different interface
    if (marketAddress == CETH_ADDRESS ) {
      market = new Market(marketAddress.toString())
      assetAddress = Address.fromString(
        '0x0000000000000000000000000000000000000000',
      )
      assetDecimals = 18
      assetName = 'Ether'
      assetSymbol = 'ETH'
      // It is all other CERC20 contracts
    } else {
      market = new Market(marketAddress)
      assetAddress = contract.underlying()
      let underlyingContract = ERC20.bind(assetAddress as Address)
      assetDecimals = underlyingContract.decimals()
      if (assetAddress.toHexString() != DAI_V1_ADDRESS) {
        assetName = underlyingContract.name()
        assetSymbol = underlyingContract.symbol()
      } else {
        assetName = 'Dai Stablecoin v1.0 (DAI)'
        assetSymbol = 'DAI'
      }
    }

    let asset = getOrCreateAsset(assetAddress.toHexString());
    asset.name = assetName
    asset.symbol = assetSymbol
    asset.decimals = assetDecimals
    asset.save()


    market.name = assetName
    market.protocol = protocol.id
    market.asset = asset.id
    market.collateralBackedAsset = null
    market.save()
    
    return market
}

export function updateMarketStats(marketId: string, eventType: string, amount: BigDecimal): void {
  //  TODO
}
