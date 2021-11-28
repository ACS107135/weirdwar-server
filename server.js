'use strict';
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
var re = /[^0-9]/;

const httpServer = createServer(function (request, response) {
    var path = request.url;

    if (path.length <= 5 && path.length >= 2 && !re.test(path.substring(1, 5))) {
        var DNA = path.substring(1);
        var elem, head, eyes, patt;
        var type, atama, me, hana;
        if (DNA.length < 4)
            for (var i = 0; DNA.length < 4; i++) {
                DNA = "0" + DNA;
            }

        switch (DNA.charAt(0)) {
            case "0": case "1":
                elem = "w"; type = "Water"; break;
            case "2": case "3":
                elem = "f"; type = "Fire"; break;
            case "4": case "5":
                elem = "g"; type = "Grass"; break;
            case "6": case "7":
                elem = "s"; type = "Light"; break;
            case "8": case "9":
                elem = "d"; type = "Dark"; break;
        }
        switch (DNA.charAt(1)) {
            case "0": case "1": case "2": case "3":
                head = "a"; atama = "Nothing"; break;
            case "4": case "5":
                head = "1"; atama = "Straw Hat"; break;
            case "6": case "7":
                head = "2"; atama = "Bean Sprout"; break;
            case "8": case "9":
                head = "3"; atama = "Wig"; break;
        }
        switch (DNA.charAt(2)) {
            case "0": case "1": case "2": case "3":
                eyes = "b"; me = "Nothing"; break;
            case "4": case "5":
                eyes = "4"; me = "Sunglasses"; break;
            case "6": case "7":
                eyes = "5"; me = "Glasses"; break;
            case "8": case "9":
                eyes = "6"; me = "Eyelash"; break;
        }
        switch (DNA.charAt(3)) {
            case "0": case "1": case "2": case "3":
                patt = "c"; hana = "Nothing"; break;
            case "4": case "5":
                patt = "7"; hana = "Circle"; break;
            case "6": case "7":
                patt = "8"; hana = "Jag"; break;
            case "8": case "9":
                patt = "9"; hana = "Stripe"; break;
        }

        response.writeHeader(200, {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET"
        });
        response.write(JSON.stringify({
            "description": "HELLO!",
            "name": "Gene: " + DNA,
            "background_color": "#FFFFDF",
            "image": "https://raw.githubusercontent.com/ACS107135/weirdwar-server/master/Gene/" + elem + head + eyes + patt + ".png",
            "attributes": [{
                "trait_type": "Type",
                "value": type
            },
            {
                "trait_type": "Head",
                "value": atama
            },
            {
                "trait_type": "Eye",
                "value": me
            },
            {
                "trait_type": "Pattern",
                "value": hana
            }]
        }));
        response.end();
    }
    else {
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
        player1.socket.removeAllListeners('victory');
        player1.socket.off('disconnect', jumpgamep1);
        player1.socket.removeAllListeners('firstsubmit');
        //player1.socket.removeAllListeners('message');
        player1.socket.removeAllListeners('surrender');
        player1.socket.removeAllListeners('endturn');
        player1.socket.removeAllListeners('burncell');
        player1.socket.removeAllListeners('darkswap');
        player2.socket.removeAllListeners('victory');
        player2.socket.off('disconnect', jumpgamep2);
        player2.socket.removeAllListeners('firstsubmit');
        //player2.socket.removeAllListeners('message');
        player2.socket.removeAllListeners('surrender');
        player2.socket.removeAllListeners('endturn');
        player2.socket.removeAllListeners('burncell');
        player2.socket.removeAllListeners('darkswap');
    }

    player1.socket.on("disconnect", jumpgamep1);
    player2.socket.on("disconnect", jumpgamep2);

    player1.socket.emit('start', { 'player_id': "1" });                 //遊戲開始訊號
    player2.socket.emit('start', { 'player_id': "2" });

    player1.socket.on('firstsubmit', (myTeam)=> {
        console.log(myTeam);
        player2.socket.emit('firstenemy', myTeam);
    });
    player2.socket.on('firstsubmit', (myTeam)=> {
        player1.socket.emit('firstenemy', myTeam);
    });

    // player1.socket.on('message', function (data) {                      //p1傳給p2
    //     player2.socket.emit('message', { 'action': data.action });
    // });
    // player2.socket.on('message', function (data) {                      //p2傳給p1
    //     player1.socket.emit('message', { 'action': data.action });
    // });

    player1.socket.on('victory', (data) => {                           //接收到遊戲結束訊號
        console.log("遊戲結束");
        endaction();
    });
    player2.socket.on('victory', (data) => {
        console.log("遊戲結束");
        endaction();
    });

    player1.socket.on('surrender', () => {
        player2.socket.emit('enemysurreder');
        endaction();
    });
    player2.socket.on('surrender', () => {
        player1.socket.emit('enemysurreder');
        endaction();
    });

    player1.socket.on('endturn', (myTeam) => {
        player2.socket.emit('newturn', myTeam);
    });
    player2.socket.on('endturn', (myTeam) => {
        player1.socket.emit('newturn', myTeam);
    });

    player1.socket.on('burncell', (burnedCells) => {
        player2.socket.emit('burncell', burnedCells);
    });
    player2.socket.on('burncell', (burnedCells) => {
        player1.socket.emit('burncell', burnedCells);
    });

    player1.socket.on('darkswap', (enemyTeam) => {
        player2.socket.emit('darkswap', enemyTeam);
    });
    player2.socket.on('darkswap', (enemyTeam) => {
        player1.socket.emit('darkswap', enemyTeam);
    });

}

io.on("connection", (socket) => {
    var player = new Player(socket);
    players.set(socket, player);

    //console.log(player.wait);
    //console.log(players.get(socket).wait);
    console.log(socket.id + "的連線，目前玩家數: " + players.size);
    socket.on("find", function () {
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
    socket.on("cancel_find", function () {
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







// case "/dog.PNG":
            //     response.writeHeader(200, 'Content-Type', 'image/png');
            //     fs.readFile(path.substring(1) , (err, data) => {
            //         response.write(data);
            //         response.end();
            //     });      
            //     break;