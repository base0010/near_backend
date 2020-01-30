import {Connection, ConnectionOptions, createConnection, EntityManager, getManager} from "typeorm"
import {Block,Transaction} from "./entity/models"
import {BlockRepository} from "./entity/BlockRepository";
import {TransactionRepository} from "./entity/TransactionRepository";
import {NestFactory} from "@nestjs/core";
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "../api/blocks/blocks.module";

export class Server {
    connection!: Connection
    blockRepository!: BlockRepository
    transactionRepository!:TransactionRepository
    entityManger!:EntityManager

    connOpts:ConnectionOptions = {
        type: "sqlite",
        database: "./database/db.sqlite",
        entities: [Block,Transaction],
        logging:true,
        synchronize: true
    }
    constructor() {

    }
    async bootstrapServer() {
        const app = await NestFactory.create(BlocksModule)
        app.useWebSocketAdapter(new IoAdapter(app))
        await app.listen(3000)
    }
    async init(){
        //db connection
        this.connection = await createConnection(this.connOpts)
        //db repository
        if (this.connection) {
            this.blockRepository = this.connection.getCustomRepository(BlockRepository)
            this.transactionRepository = this.connection.getCustomRepository(TransactionRepository)
            this.entityManger = getManager();
            console.log("DB Connected")
        }
        await this.bootstrapServer().then(()=>(console.debug("WS API Server Started")))

    }
    async saveBlockAndTransaction(tx:Transaction,block:Block){
        try {
            await this.entityManger.save(tx)
            await this.entityManger.save(block)
        }catch (e) {
            console.log(e)
            throw e;
        }
    }
    async getHighestBlockSaved(){
        const query = this.entityManger.createQueryBuilder(Block,"Block")
        query.select("MAX(Block.id)", "max")
        const res = await query.getRawOne();
        console.log(`Highest Block With TXs in DB ${res.max}`)
        return res.max;
    }
}
