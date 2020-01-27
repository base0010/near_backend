import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
    OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket
} from '@nestjs/websockets';

import {Server, Client, Socket} from 'socket.io'
// import {""} from 'ws'
@WebSocketGateway()

export class BlocksGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server!:Server;
    client!:Client;
    blocks: number = 0;

    @SubscribeMessage('blocks')
    handleBlocks(@MessageBody() msg:string, @ConnectedSocket() client:Socket){
        // this.server.emit('blocks', msg)
        console.log(msg)
        client.broadcast.emit('blocks',this.blocks)
        this.blocks++;
        // console.log(msg)
    }

    async handleConnection(){
        // this.blocks++;
        console.log('client connected')
        this.server.emit('blocks',this.blocks)
    }

    async handleDisconnect(){
        this.server.emit('blocks', this.blocks)
    }


}
