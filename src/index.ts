import {NearRpc} from './nearRpc'
import {BlockHeader, BlockResult, ChunkHeader, ChunkResult} from "nearlib/lib/providers/provider";
import {Result,promiseResult} from "./utils";
import {Server} from "./database/Server";

class BlockSync {
    provider: NearRpc
    server:Server;

    isPolling: boolean = false;
    MAX_CONCURRENT_REQUESTS:number = 1000

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
        let bigChunks = responseValue.flatMap((res:any)=>{
            let chunks = res.chunks
            return chunks.filter((chunk: { encoded_length: number; })=>chunk.encoded_length>8)
        })
        let blockByChunks = await Promise.all(bigChunks.map(async(chunk:ChunkHeader)=>{
                const blockHeight = chunk.height_included
                const dets = await this.provider.provider.chunk(chunk.chunk_hash)
                return{height:blockHeight,chunk_details:dets}
            }
        ))
        // @ts-ignore
        const bByChunksWTxs = blockByChunks.filter(bc=>bc.chunk_details.transactions.length > 0)
        // @ts-ignore
        bByChunksWTxs.flatMap((v)=> {
            // @ts-ignore
            v.chunk_details.transactions.map((tx)=>{
                if(tx.actions.includes("CreateAccount")){

                    // @ts-ignore
                    console.log(`Found Account @ ${v.height}`)
                    console.log(tx.receiver_id)

                    this.server.blockRepository.createAndSave({id:1, height:1, transactions:{id:1, transactionType:"CreateAccount",recieverName:tx.receiver_id}})

                    }
                }
            )}
        )
    }

    async getBlockToCurrentHeight(){
        //get highest from DB
        const storedHeight = 700000
        while(storedHeight < this.provider.highestBlock){
            await this.getBlockRange(storedHeight,this.provider.highestBlock);
        }
    }


    async getBlockRange(start: number, end: number) {
        if (start > end) {return}
        let delta = end - start
        const runs = delta / this.MAX_CONCURRENT_REQUESTS + 1;
        let height = start;
        for (let i = 1; i < runs; i++) {
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
            let rV:any = responses.filter(response=>response.val !== undefined).map(response=>{
                return response.val
            })
            await this.parseBlockForAccounts(rV)
            requests.length = 0
        }
    }
}

const sync = new BlockSync()

sync.init().then(async()=>{
    console.log("started")

    //todo:end off by one

    await sync.getBlockRange(748270,748274);

})
// bootstrapServer().catch(console.error)
// async function testRPCConnection()
// {
//
//
// }
// testRPCConnection().catch(console.error)
