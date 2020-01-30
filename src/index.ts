import {NearRpc} from './nearRpc'
import {ChunkHeader} from "nearlib/lib/providers/provider";
import {promiseResult} from "./utils";
import {Server} from "./database/Server";
import {Block,Transaction} from "./database/entity/models";

class BlockSync {
    readonly provider: NearRpc
    readonly server:Server;
    private isPolling: boolean = false;
    readonly MAX_CONCURRENT_REQUESTS:number = 1000

    constructor() {
        this.server = new Server()
        this.provider = new NearRpc("marcus")
    }
    async init() {
        //connect to rpc
        this.provider.connectRPC()
        //start polling block height from RPC
        this.isPolling = await this.provider.pollLatestBlock()
        await this.server.init()

    }
    async parseBlockForAccounts(responseValue:any){
        //look for chunks with encoded length > 8
        let bigChunks:ChunkHeader[] = responseValue.flatMap((res:any)=>{
            let chunks = res.chunks
            let block = res.header

            return chunks.filter((chunk: { encoded_length: number; })=>chunk.encoded_length>8)
        })
        let blockByBigChunks = await Promise.all(bigChunks.map(async(chunk:ChunkHeader)=>{
                const blockHeight = chunk.height_included
                const dets = await this.provider.provider.chunk(chunk.chunk_hash)

                //heightByDetails
                return{height:blockHeight,chunk_details:dets}
            }
        ))
        const blockByBigChunksWithTxs = blockByBigChunks.filter(bc=>bc.chunk_details.transactions.length > 0)

        blockByBigChunksWithTxs.flatMap((heightByDetails)=> {

            //the transaction types from nearlib don't matchup on .actions & .reciever_id perhaps spec changed
            heightByDetails.chunk_details.transactions.map(async(tx:any,index)=>{
                //do actions in the transaction include "CreateAccount"?
                if(tx.actions.includes("CreateAccount")){
                    //these could use constructors
                    const t = new Transaction()
                    t.rName = tx.receiver_id
                    t.id = index + heightByDetails.height
                    t.transactionType = "CreateAccount"

                    const block = new Block()
                    block.id = heightByDetails.height
                    block.height = heightByDetails.height
                    block.transactions = [t]

                    this.server.saveBlockAndTransaction(t,block).then(()=>console.log("saved stuff to db"))
                    }
                }
            )}
        )
    }

    async getBlockHeights(){
        //todo:this should return highest block saved not highest block with accounts
        const storedHeight = await this.server.getHighestBlockSaved()
        const rpcHeight = this.provider.highestBlock
        return {db:storedHeight,rpc:rpcHeight}
    }
    async getBlockToCurrentHeight(){
        //get highest from DB
        let height = await this.getBlockHeights()
        while(height.db < this.provider.highestBlock){
            await this.getBlockRange(height.db,this.provider.highestBlock).then(()=>console.log("syncedup"));
            height = await this.getBlockHeights();
        }
    }

    async getBlockRange(start: number, end: number) {
        if (start > end) {return}
        let delta = end - start
        const runs = delta / this.MAX_CONCURRENT_REQUESTS + 1;

        let height = start;
        for (let i = 1; i < runs; i++) {
            // console.log(height)
            let requests: any[] = []
            let numReqs = delta < this.MAX_CONCURRENT_REQUESTS ? delta : this.MAX_CONCURRENT_REQUESTS;
            for (let j = 0; j < numReqs; j++) {
                requests.push([height, promiseResult(this.provider.getBlock(height))])
                delta--
                height++
            }
            let responses = await Promise.all(requests.map(([_, res]) => res))
            //filter responses for accounts
            //todo:better type
            let fufilledResponses:any = responses.filter(response=>response.val !== undefined).map(response=>{
                return response.val
            })
            await this.parseBlockForAccounts(fufilledResponses)
            requests.length = 0
        }
    }
}

const sync = new BlockSync()

sync.init().then(async()=>{
    console.log("started")

    //todo:end off by one
    // console.time()
    await sync.getBlockToCurrentHeight();
    // this.
    // console.timeEnd()
})
// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
