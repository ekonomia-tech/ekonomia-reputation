import { Address } from "@graphprotocol/graph-ts";
import { Account, Event, Protocol } from "../../generated/schema";
import { getOrCreateAccountInProtocol } from "./account";
import { getConcatenatedId, getOrCreateCountTotals } from "./generic";

export function createProtocol(protocolAddress: Address, name: string): Protocol {
    let network = getNetwork(protocolAddress.toHexString())
    let protocolId = getConcatenatedId([name, network])
    let protocol = new Protocol(protocolId)
    protocol.network = network
    protocol.address = protocolAddress
    protocol.type = "POOLED"
    protocol.save()

    return protocol;
}

export function getProtocol(protocolId: string): Protocol {
    let protocol = Protocol.load(protocolId);
    if (protocol) {
        return protocol;
    }
    return new Protocol("");
}

export function getNetwork(protocolAddress: string): string {
    return "ETHEREUM"
}

export function updateProtocolStats(account: Account, protocol: Protocol, event: Event): void {
  let aip = getOrCreateAccountInProtocol(protocol.id, account.id)
  let aipCount = getOrCreateCountTotals(getConcatenatedId([aip.id, "count"]))

  if(event.eventType == "BORROW") {
    aipCount.borrowed += 1
  } else if(event.eventType == "REPAY") {
    aipCount.repaid += 1
  } else if(event.eventType == "DEPOSIT") {
    aipCount.deposited += 1
  } else if(event.eventType == "WITHDRAW") {
    aipCount.withdrawn += 1
  } else if (event.eventType == "LIQUIDATION") {
    aipCount.liquidated += 1
  }
}