import {Connection, ConnectionOptions, createConnection, getConnection, getRepository} from "typeorm"
import { Blocks,Transactions } from "./database/entity/models"
import {BlockRepository} from "./database/entity/BlockRepository";
import {NestFactory} from "@nestjs/core";
// import {WsAdapter} from '@nestjs/platform-ws'
import * as allSettled from 'promise.allsettled'
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "./api/blocks/blocks.module";
import {NearRpc} from './nearRpc'
import {BlockHeader, BlockResult, ChunkHeader, ChunkResult} from "nearlib/lib/providers/provider";


class Result{
    // val:BlockResult|undefined;
    val:any
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

            const requests: any[] = []

            const saves = []

            while (height > 0) {
                console.log(requests.length)
                requests.push([height, promiseResult(this.provider.getBlock(height))])
                --height;
                // saves.push(this.saveBlocksFromRequests(requests))

            }
            let responses = await Promise.all(requests.map(([_, res]) => res))
            responses.map((re) => {
                console.log(re.val.header.hash)
            })
        }
    }

    async getChunkTxsForBlock(fufilled:Result[]){

        let chunkWTxs: any = fufilled.map((fufilledResult)=> {
            fufilledResult.val.chunks.map((chunk:ChunkHeader)=>{
                if(chunk.encoded_length>8){
                    return([fufilledResult.val.header,promiseResult(this.provider.provider.chunk(chunk.chunk_hash))])

                }
            })
        })

        let chunkswithTxns = await Promise.all(chunkWTxs.map((chunks: any)=>chunks))

        console.log(chunkswithTxns)


    }


    async getBlockRange(start: number, end: number) {
        if (start > end) {
            return
        }
        const MAX_CONCURRENT_REQUESTS = 1000
        let delta = end - start
        const runs = delta / MAX_CONCURRENT_REQUESTS + 1;
        let height = start;
        for (let i = 1; i < runs; i++) {
            let requests: any[] = []
            let numReqs = delta < MAX_CONCURRENT_REQUESTS ? delta : MAX_CONCURRENT_REQUESTS;
            for (let j = 0; j < numReqs; j++) {
                requests.push([height, promiseResult(this.provider.getBlock(height))])
                delta--
                height++
            }
            let responses = await Promise.all(requests.map(([_, res]) => res))
            //filter responses for accounts

            let responseValues = responses.filter(response=>response.val !== undefined).map(response=>{
                return response.val
            })

           let bigChunks = responseValues.flatMap((res)=>{
                let chunks = res.chunks
                 return chunks.filter((chunk: { encoded_length: number; })=>chunk.encoded_length>8)
            })


            let blockByChunks = await Promise.all(bigChunks.map(async(chunk:ChunkHeader)=>{
                const blockHeight = chunk.height_included
                const dets = await this.provider.provider.chunk(chunk.chunk_hash)
                return{height:blockHeight,chunk_details:dets}
                }
            ))

            const bByChunksWTxs = blockByChunks.filter(bc=>bc.chunk_details.transactions.length > 0)


            // @ts-ignore
            let got = bByChunksWTxs.flatMap((v)=> {

                if (v.chunk_details.transactions.filter(tx =>
                    // @ts-ignore
                    tx.actions.includes("CreateAccount")
                )){
                    return v
                }



            })


            got.map((i)=>{

                // @ts-ignore
                console.log(i.height, "\n\n",i.chunk_details.transactions[0].actions)
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

    //todo:end off by one

    await sync.getBlockRange(702550,702564)

})
// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
