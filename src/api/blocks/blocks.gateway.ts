import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
    OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket
} from '@nestjs/websockets';
import {Server, Client, Socket} from 'socket.io'
import {getManager,EntityManager} from "typeorm"
import {Transaction} from "../../database/entity/models";

@WebSocketGateway()
export class BlocksGateway implements OnGatewayConnection, OnGatewayDisconnect {
    entityManager!:EntityManager
    constructor() {
        this.entityManager = getManager();
    }
    @WebSocketServer() server!:Server;
    client!:Client;
    blocks: number = 0;

    @SubscribeMessage('allAccounts')
    async handleBlocks(@MessageBody() msg:string, @ConnectedSocket() client:Socket){

        let query = await this.entityManager.find(Transaction)
        let count = this.entityManager.count(Transaction)
        this.server.emit('returnAllAccounts',[query,count])

    }
    @SubscribeMessage('accountsInBlock')
    async getAccountsInBlock(@MessageBody() msg:number, @ConnectedSocket() client:Socket){

        console.log(`querying block ${msg} for accounts`)
        let query = await this.entityManager.query(`SELECT COUNT(DISTINCT("Transaction"."rName")) as "cnt" FROM "Transaction" WHERE "Transaction"."cId" = ${msg}`)
        console.log(query)
        this.server.emit('returnAccountsInBlock', query)
    }

    async handleConnection(){
        console.log('client connected')

    }

    async handleDisconnect(){
        console.log('client disconnected')
    }


}
