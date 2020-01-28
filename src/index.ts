import {Connection, ConnectionOptions, createConnection, getConnection, getRepository} from "typeorm"
import { Blocks,Transactions } from "./database/entity/models"
import {BlockRepository} from "./database/entity/BlockRepository";
import {NestFactory} from "@nestjs/core";
// import {WsAdapter} from '@nestjs/platform-ws'
import * as allSettled from 'promise.allsettled'
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "./api/blocks/blocks.module";
import {NearRpc} from './nearRpc'


class Result{
    val:any;
    err:any;
    constructor() {
        this.val = undefined
        this.err = undefined
    }
}

function promiseResult(promise:Promise<any>){
    return new Promise(res=>{
        const payload = new Result();
        promise.then((r)=>{
            payload.val = r
        }).catch((e)=>{
            payload.err = e
        }).then(()=>{
            res(payload)
        })
    })
}
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
    connection!: Connection
    blockRepository!: BlockRepository
    provider!: NearRpc

    isPolling: boolean;

    constructor() {
        this.isPolling = false
        // this.start().catch(console.error)
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

    async  saveBlocksFromRequests(requests:any[]) {
        console.log('insidesave')
        const responses = await Promise.all(requests.map(([_, req]) => req));
        const blocks = responses.flatMap((blockResult:any, index) => {
            const blockHeight = requests[index][0];
            if(blockResult.value)
                console.log(blockResult)
            return [blockResult.value];
        })
    }

    async getBlocks(startingBlock: number, endingBlock: number) {
        if (this.isPolling) {
            let height = 10
            const requests = []
            const saves = []

            while(height > 0){
                requests.push([height,promiseResult(this.provider.getBlock(height))])
                --height;

                saves.push(this.saveBlocksFromRequests(requests))

            }

            await Promise.all(saves)
        }
    }
}

const sync = new BlockSync()

 sync.start().then(async function(){
     await sync.getBlocks(1,100000)
 })

// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
