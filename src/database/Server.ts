import {Connection, ConnectionOptions, createConnection, getConnection, getRepository} from "typeorm"
import { Blocks,Transactions } from "./entity/models"
import {BlockRepository} from "./entity/BlockRepository";
import {NestFactory} from "@nestjs/core";
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "../api/blocks/blocks.module";

export class Server {
    connection!: Connection
    blockRepository!: BlockRepository
    connOpts:ConnectionOptions = {
        type: "sqlite",
        database: "./database/db.sqlite",
        entities: [Blocks,Transactions],
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
            console.log("DB Connected")
        }
        await this.bootstrapServer().then(()=>(console.debug("API Server Started")))

    }
}
