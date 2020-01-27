import { ConnectionOptions, createConnection ,getConnection,getRepository} from "typeorm"
import { Block,Transactions } from "./database/entity/models"
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
    entities: [Block,Transactions],
    logging:true,
    synchronize: true
}

function getBlockRepository(connection:any): BlockRepository{
    return connection.getCustomRepository(BlockRepository)
}
async function main(){

    //db connection
    const connection = await createConnection(connOpts)
    //db repository
    const blockRepository = getBlockRepository(connection)

    let provider = new NearRpc("marcus")
    provider.connectRPC()

    const pollLatestBlock = async function(){
        setInterval(async()=> {
            const latest = await provider.getLatestBlock()
            if(provider.highestBlock !== latest) {
                provider.highestBlock = latest
                const res = await provider.getBlock(provider.highestBlock)
                console.log(res.header.hash)
                await blockRepository.createAndSave({id:res.header.height,hash:res.header.hash})
            }
        },1000)

    }
 await pollLatestBlock()

    // const latestRpcBlock = async function(){
    //     setInterval(async()=> {
    //         const latest = await provider.getLatestBlock()
    //         if(provider.highestBlock !== latest) {
    //             provider.highestBlock = latest
    //             const res = await provider.getBlock(provider.highestBlock)
    //             console.log(res.header.hash)
    //             await blockRepository.createAndSave({id:res.header.height,hash:res.header.hash})
    //         }
    //     },1000)
    // }
    while(1==1){
        let RpcHighest = provider.highestBlock
        let DbHighest = await blockRepository.getHighestBlockSaved();
        let delta = RpcHighest - DbHighest
        console.log(`we need to get ${delta} blocks from the rpc`)
        let getCount = 0;
        let promiseArray = [];
            for (let i = 0; i <= delta; i++) {
                if(getCount < 1000) {
                    let blockToGet = DbHighest + delta
                    promiseArray.push(await provider.getBlock(blockToGet))
                    getCount++
                }
            }
            let blockArr = await Promise.all(promiseArray)
            console.log(blockArr)


    }


    // const bRange = 100
    // for(let i = 0; i < bRange; i++){
    //     let block = await provider.getBlock(i)
    //     let tmpBlock = {
    //         hash: block.header.hash,
    //         id: i
    //     }
    //     console.log("saving block ",i)
    //     await blockRepository.createAndSave(tmpBlock)
    // }
    //




}

main().catch(console.error)
// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
