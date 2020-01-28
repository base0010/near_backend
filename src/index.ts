import {Connection, ConnectionOptions, createConnection, getConnection, getRepository} from "typeorm"
import { Blocks,Transactions } from "./database/entity/models"
import {BlockRepository} from "./database/entity/BlockRepository";
import {NestFactory} from "@nestjs/core";
// import {WsAdapter} from '@nestjs/platform-ws'
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "./api/blocks/blocks.module";

import {NearRpc} from './nearRpc'

async function bootstrapServer() {
    const app = await NestFactory.create(BlocksModule)
    app.useWebSocketAdapter(new IoAdapter(app))
    await app.listen(3000)
}
const connOpts:ConnectionOptions = {
    type: "sqlite",
    database: "./database/db.sqlite",
    entities: [Blocks,Transactions],
    logging:true,
    synchronize: true
}

function getBlockRepository(connection:any): BlockRepository{
    return connection.getCustomRepository(BlockRepository)
}

class BlockSync {
    connection!:Connection
    blockRepository!:BlockRepository
    provider!:NearRpc

    isPolling:boolean = false;

    constructor() {
    }

    async start() {
        //db connection
        this.connection = await createConnection(connOpts)
        //db repository
        if (this.connection) {
            this.blockRepository = getBlockRepository(this.connection)
            console.log("DB Setup Complete")
        }
        //connect to rpc
        this.provider = new NearRpc("marcus")
        this.provider.connectRPC()
        //start polling block height from RPC
        this.isPolling = await this.provider.pollLatestBlock()


    }
    async getBlocks(){
        if(this.isPolling){
            const MAX_PROMISES = 500


            let responses = []
            for(let i = 0; i < MAX_PROMISES; i++){
                responses.push(this.provider.getBlock(i))
            }
            let results = await Promise.all(responses)

            let self = this
            results.map(async function(res){
                try {
                    await self.blockRepository.createAndSave({id: res.header.height, hash: res.header.hash})
                }catch (e) {
                    console.error(e)
                }

        })
    }
    }
}

const sync = new BlockSync()

 sync.start().then(async function(){
     await sync.getBlocks()
 })

// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
