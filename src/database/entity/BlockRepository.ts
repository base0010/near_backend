import {
    EntityRepository, Repository, getRepository
} from "typeorm";

import {Blocks} from "./models";


//SQlite dosen't support enum datatype out of the box
export type TransactionMethodsTypes = "CreatedAccount" | "Transfer"


export enum TransactionMethods {
    accountCreated = "CreatedAccount", transfer = "Transfer"

}
//got this from webs
export function normalizeNumber(
    num: number | string, errorIfNotNumber: string)
    : number {
    if (typeof num === 'undefined') {
        throw new Error(`${errorIfNotNumber} -- ${num}`);
    }
    if (typeof num === 'number') return num;
    let ret = parseInt(num);
    if (isNaN(ret)) {
        throw new Error(`${errorIfNotNumber} ${ret} -- ${num}`);
    }
    return ret!;
}

@EntityRepository(Blocks)
export class BlockRepository extends Repository<Blocks>{

    async createAndSave(block:Blocks): Promise<number>{
        let b = new Blocks()
        b.transactions = block.transactions
        b.id = normalizeNumber(block.id, 'badblocknum')

        await this.save(b)
        return b.id;
    }
    async allBlocks():Promise<Blocks[]>{
        let blocks = await this.find()
        return blocks;

    }
    async findOneBlock(id:number):Promise<Blocks | undefined>{
        let block = await this.findOne({
            where: {id:id}
        })

        return block;
    }
    async deleteBlock(block:number | Blocks){
        await this.manager.delete(Blocks, typeof block === 'number'?
                                    block:block.id)
    }
    async getHighestBlockSaved(){
        const query = this.createQueryBuilder("Block")
        query.select("MAX(Block.id)", "max")
        const res = await query.getRawOne();
        console.log(`Highest Block in DB ${res.max}`)
        return res.max;
    }
}
