import {
    EntityRepository, Repository, getRepository
} from "typeorm";

import {Block,Transaction} from "./models";


@EntityRepository(Block)
export class BlockRepository extends Repository<Block>{

    async allBlocks():Promise<Block[]>{
        let blocks = await this.find()
        return blocks;

    }
    async findOneBlock(id:number):Promise<Block | undefined>{
        let block = await this.findOne({
            where: {id:id}
        })

        return block;
    }
    async deleteBlock(block:number | Block){
        await this.manager.delete(Block, typeof block === 'number'?
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
