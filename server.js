'use strict';
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs"); 

const httpServer = createServer(function (request, response) {
    console.log('Connection');
    var path = request.url;
    switch (path) {
       case "/0":
           response.writeHeader(200, 'Content-Type', 'application/json');
           response.write(JSON.stringify({
               "description": "Friendly OpenSea Creature that enjoys long swims in the ocean.",
               "name": "Dave Starbelly",
               "image": "https://weirdwar-server.herokuapp.com/cute"
           }));
           response.end();
           break;
       case "/cute":
           response.writeHeader(200, 'Content-Type', 'image/gif');
           fs.readFile(path.substring(1) + ".gif", (err, data) => {
               response.write(data);
               response.end();
           });      
           break;
       default:
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<br>Hello, World.</br>' + (new Date()).toISOString(), 'utf-8');
    console.log(new Date());
    response.end();
    }
});
httpServer.listen(process.env.PORT || 8001);

const io = new Server(httpServer, {});

var waiting = new Array();
var players = new Map();
function Player(socket) {
    this.socket = socket;
    this.wait = false;
    this.gaming = false;
}
function funGame(player1, player2) {
    console.log(player1.socket.id + "跟" + player2.socket.id + "的遊戲開始");
    player1.wait = false;
    player2.wait = false;
    player1.gaming = true;
    player2.gaming = true;

    const jumpgamep1 = () => {
        player2.socket.emit('Error', { 'error': "此玩家已中離" });      //如果有人中離，結束遊戲
        player2.gaming = false;
        console.log("有人跳game，遊戲結束");
        endaction();
    }
    const jumpgamep2 = () => {
        player1.socket.emit('Error', { 'error': "此玩家已中離" });      //如果有人中離，結束遊戲
        player1.gaming = false;
        console.log("有人跳game，遊戲結束");
        endaction();
    }
    function endaction() {
        player1.gaming = false;
        player2.gaming = false;
        player1.socket.removeAllListeners('gameover');
        player1.socket.off('disconnect', jumpgamep1);
        player1.socket.removeAllListeners('message');
        player2.socket.removeAllListeners('gameover');
        player2.socket.off('disconnect', jumpgamep2);
        player2.socket.removeAllListeners('message');
    }

    player1.socket.on("disconnect", jumpgamep1);
    player2.socket.on("disconnect", jumpgamep2);

    player1.socket.emit('start', { 'player_id': "1" });                 //遊戲開始訊號
    player2.socket.emit('start', { 'player_id': "2" });

    player1.socket.on('message', function (data) {                      //p1傳給p2
        player2.socket.emit('message', { 'action': data.action });
    });
    player2.socket.on('message', function (data) {                      //p2傳給p1
        player1.socket.emit('message', { 'action': data.action });
    });

    player1.socket.on('gameover', (data) => {                           //接收到遊戲結束訊號
        console.log("遊戲結束");
        endaction();
    });
    player2.socket.on('gameover', (data) => {
        console.log("遊戲結束");
        endaction();
    });
}
io.on("connection", (socket) => {
    var player = new Player(socket);
    players.set(socket, player);

    //console.log(player.wait);
    //console.log(players.get(socket).wait);
    console.log(socket.id + "的連線，目前玩家數: " + players.size);
    socket.on("find", function (data) {
        console.log(player.socket.id + "的狀態");
        console.log("等待中:" + player.wait);
        console.log("遊戲中:" + player.gaming);
        if (!player.wait && !player.gaming) {
            if (waiting.length < 1) {
                player.wait = true;
                waiting.push(player);
                console.log(player.socket.id + "開始尋找");
                console.log("等待人數: " + waiting.length);
            }
            else {
                funGame(waiting.pop(), player);
            }
        }
        else {/*玩家已在等待或遊玩*/ }

    })
    socket.on("cancel_find", function (data) {
        if (player.wait) {
            waiting.pop();
            player.wait = false;
            console.log(player.socket.id + "不想等了");
            console.log("等待人數: " + waiting.length);
        }
        else {
            console.log(player.socket.id + "你又沒在排隊");
            console.log("等待人數: " + waiting.length);
        }
    })
    socket.on("disconnect", () => {
        if (player.wait == true) {
            waiting.pop();
            console.log("等待人數: " + waiting.length);
        }
        players.delete(socket);
        console.log(socket.id + "的連線已中斷，目前玩家數: " + players.size);

    })
});







