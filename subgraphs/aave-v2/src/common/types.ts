import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Event } from "../../generated/schema";

export class EventData {

    data: string
    size: i32

    constructor() {
        this.data = ""
        this.size = 0
    }

    private createEventEntry(amountUSD: string, eventType: string, blockTime: string): string {
        return amountUSD
        .concat("#")
        .concat(eventType)
        .concat("#")
        .concat(blockTime)
    }

    addEvent(event: Event): void {
        let newData: string = this.data
        if (this.size > 0) {
            newData = newData.concat('-')
        }
        newData = newData.concat(this.createEventEntry(event.amountUSD.toString(), event.eventType, event.blockTime.toString()))
        this.data = newData
        this.size += 1
    }

    getEvent(index: i32): string {
        if (index >= this.size) {
            return ""
        }
        return this.data.split('-')[index]
    }

    getAmount(index: i32): number {
        if (index >= this.size) {
            return 0
        }
        let result = this.data.split('-')[index]
        result = result.split('#')[0]
        let final = parseFloat(result)
        if (final) {
            return final
        }
        return 0
    }

    getEventType(index: i32): string {
        if (index >= this.size) {
            return ""
        }
        let result = this.data.split('-')[index]
        result = result.split('#')[1]
        if (result) {
            return result
        }
        return ""
    }

    getBlockTime(index: i32): number {
        if (index >= this.size) {
            return 0
        }
        let result = this.data.split('-')[index]
        result = result.split('#')[2]
        let final = parseInt(result)
        if (final) {
            return final
        }
        return 0
    }

    setAmount(index: i32, amount: number): void {
        if (index >= this.size) {
            return 
        }
        let item = this.data.split('-')[index]
        let newEntry = this.createEventEntry(amount.toString(), item.split('#')[1], item.split('#')[2])
        let newData = ""
        for (let i = 0; i < this.size; i++) {
            if (i > 0) {
                newData = newData.concat('-')
            }
            if (i == index) {
                newData = newData.concat(newEntry)
                continue
            }
            newData = newData.concat(this.data.split('-')[i])
        }
        this.data = newData
    }
}