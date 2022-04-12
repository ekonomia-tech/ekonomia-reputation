import { Market } from '../../generated/schema'
import { ReserveInitialized } from '../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator'
import { getOrCreateAsset } from '../helpers/asset'
import { getProtocol } from '../helpers/protocol'

export function handleReserveInitialized(event: ReserveInitialized): void {
    let protocol = getProtocol("AAVE-V2-ETHEREUM")
    let market = new Market(event.params.asset.toHexString())
    let asset = getOrCreateAsset(event.params.asset.toHexString())
    let aTokenAsset = getOrCreateAsset(event.params.aToken.toHexString())
    
    market.name = asset.name
    market.protocol = protocol.id
    market.asset = asset.id
    market.collateralBackedAsset = aTokenAsset.id
    market.save();
}