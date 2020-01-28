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
        this.isPolling = true
        // this.start().catch(console.error)
    }

    async start() {
        //db connection
        this.connection = await createConnection(connOpts)
        //db repository
        if (this.connection) {
            this.blockRepository = getBlockRepository(this.connection)
            console.log("DB Setup Completss")
        }
        //connect to rpc
        this.provider = new NearRpc("marcus")


        this.provider.connectRPC()
        //start polling block height from RPC
        // this.isPolling = await this.provider.pollLatestBlock()



    }

    async getBlocks(startingBlock: number, endingBlock: number) {
        if (this.isPolling) {
            let height = 1000

            const requests:any[] = []

            const saves = []

            while(height > 0){
                console.log(requests.length)
                requests.push([height,promiseResult(this.provider.getBlock(height))])
                --height;
                // saves.push(this.saveBlocksFromRequests(requests))

            }
           let responses =  await Promise.all(requests.map(([_,res])=> res))
            responses.map((re)=>{
                console.log(re.val.header.hash)
            })
        }
    }


    async getBlockRange(start:number, end:number) {
        if (start > end) {return}
        const MAX_CONCURRENT_REQUESTS = 1000
        let delta = end - start
        const runs = delta/MAX_CONCURRENT_REQUESTS + 1;

        let height = start;
        for(let i = 1; i < runs; i++) {
            let requests: any[] = []
            let numReqs = delta < MAX_CONCURRENT_REQUESTS? delta: MAX_CONCURRENT_REQUESTS;
            console.log(requests.length)

            for(let j = 0; j < numReqs; j++) {
                requests.push([height, promiseResult(this.provider.getBlock(height))])
                delta--
                height++
            }
            let responses =  await Promise.all(requests.map(([_,res])=> res))
            responses.map((f)=>{
                if(f.val){
                    console.log(f.val.header.hash)
                    // this.blockRepository.createAndSave({id:f.val.header.height,hash:f.val.header.hash})
                }
            })
            requests.length = 0
        }
    }
}

const sync = new BlockSync()

sync.start().then(async()=>{
    console.log("started")

    // let res:any[]= []
    // for(let i=0; i< 150; i++){
    //    let b = await  sync.provider.getBlock(i)
    //     console.log(b)
    // }
    await sync.getBlockRange(1,2000)

})

// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
