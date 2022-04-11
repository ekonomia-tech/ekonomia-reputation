import { Asset } from '../../generated/schema'
import { ERC20 } from '../../generated/PoolAddressesProviderRegistry/ERC20'
import { Address } from '@graphprotocol/graph-ts'

export function getOrCreateAsset(assetAddress: string): Asset {
    let asset = Asset.load(assetAddress)
    if (asset) {
        return asset
    }
    let assetContract = ERC20.bind(Address.fromString(assetAddress))
    asset = new Asset(assetAddress)
    asset.name = assetContract.name()
    asset.symbol = assetContract.symbol()
    asset.decimals = assetContract.decimals()

    asset.save()
    return asset
}