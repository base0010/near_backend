import {
    EntityRepository, Repository
} from "typeorm";
import {Transaction} from "./models";




@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction>{

    async allBlocks():Promise<Transaction[]>{
        let blocks = await this.find()
        return blocks;

    }
    async findOneBlock(id:number):Promise<Transaction | undefined>{
        let block = await this.findOne({
            where: {id:id}
        })

        return block;
    }
    async deleteBlock(block:number | Transaction){
        await this.manager.delete(Transaction, typeof block === 'number'?
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
