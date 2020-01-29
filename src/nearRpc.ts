import * as nearlib from 'nearlib'
import { ConnectionOptions, createConnection ,getConnection,getRepository} from "typeorm"
import { Blocks,Transactions } from "./database/entity/models"
import {BlockRepository} from "./database/entity/BlockRepository";
import {NestFactory} from "@nestjs/core";
// import {WsAdapter} from '@nestjs/platform-ws'
import {IoAdapter} from "@nestjs/platform-socket.io";
import {BlocksModule} from "./api/blocks/blocks.module";
import {BlockResult} from "nearlib/lib/providers/provider";


type NearConfig  = {
    networkId:string;
    nodeUrl:string;
    contractName?:string;
    walletUrl?:string;

}
export class NearRpc {
    accountName:string;
    nearConfig:NearConfig;

    provider!:nearlib.providers.JsonRpcProvider;
    statusPollTime:number = 1000;

    highestBlock:number = 0;
    pollHeight:boolean =true;

    constructor(contractName:string, environment?:string){
        //todo: some configs
        this.accountName = contractName;
        this.nearConfig = this.getConfig()

    }


    getConfig(configType?:string){
        switch(configType){
            default:
                return {
                    networkId: 'default',
                    nodeUrl: 'https://rpc.nearprotocol.com',
                    contractName: this.accountName,
                    walletUrl: 'https://wallet.nearprotocol.com',
                }
        }
    }
     connectRPC() {
         //todo:this only works within Window scope
         //     const connected = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } },this.nearConfig))
         //      console.log(`Connected to NEAR RPC ${connected}`)
         //
         this.provider = new nearlib.providers.JsonRpcProvider(this.nearConfig.nodeUrl)

     }
    async getBlock(block:number):Promise<BlockResult>{
        return this.provider.block(block)
    }
     async getLatestBlock():Promise<number>{

        const status =  await this.provider.status()
         const blockHeight =  status.sync_info.latest_block_height
         return blockHeight
     }
    async pollLatestBlock():Promise<boolean>{
        //we resolve on the initial Rpc Block Height recieved and keep polling
        return new Promise(resolve => setInterval(async()=> {
            const latest = await this.getLatestBlock()
            if(this.highestBlock < latest) {
                this.highestBlock = latest
                    resolve(true)
                // await blockRepository.createAndSave({id:res.header.height,hash:res.header.hash})
            }
        },this.statusPollTime))

    }


}
