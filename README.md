##Meerkat Analyser
#What is it? 
*This is a server that connects to the NEAR Protocol RPC and parses all blocks (and sub-block chunks)
for created account transactions on the NEAR Protocol Testnet

*It saves these to a SQLLiteDB and then serves out requests for information to this DB to our frontend using websocket/socket.io events



TODO: 

Update DB Schema to save all blocks as well as parse for transactions

Update the sync methods to reflect this and look at latest block recieved instead of latest block

Server Class Should do more abstracted server manager things 

Websockets emit events for all clients ex. 'accountsInBlock' event emits the result to all clients instead of just the requesting client 



