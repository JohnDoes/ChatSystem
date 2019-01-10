//'use strict';



var http = require('http');
var socketio = require('socket.io');
var port = process.env.PORT || 3000;
var fs = require('fs');
var page;
var searchDB, searchStr, intoDB, intoId, IntoDB;

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end((err) => {
    console.log('client has disconnected');
    if (err) {
      console.log('error during disconnection', err.stack);
    }
  });
});

/*
var server = http.createServer(function (req, res) {
    console.log(req.url);
	if(req.url == "/"){
        page = '/enter.html';
    }else {
        page = '/chat.html';
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(__dirname + page, 'UTF-8'));
    console.log(page);
}).listen(port);
*/

var server = http.createServer();
server.on("request", doRequest);
server.listen(port);
console.log("Server running");

function getRequestType(request){
  if ( request.url.indexOf(".html") != -1) {
    return "html";
  }
  if ( request.url.indexOf(".jpg") != -1) {
    return "jpeg";
  }
  if ( request.url.indexOf(".js") != -1) {
    return "js";
  }
  if ( request.url.indexOf(".css") != -1) {
    return "css";
  }
  if ( request.url.indexOf(".png") != -1) {
    return "png";
  }
  return "";
}

function doRequest(request, response) {
    switch(getRequestType(request)) {
    case "html":
        fs.readFile("."+request.url, "UTF-8",
            function (err, data) {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(data);
                response.end();
            }
        );
        break;
    case "css":
        fs.readFile("."+request.url, "UTF-8",
            function (err, data) {
                response.writeHead(200, {"Content-Type": "text/css"});
                response.write(data);
                response.end();
            }
        );
        break;
    case "js":
        fs.readFile("."+request.url, "UTF-8",
            function (err, data) {
                response.writeHead(200, {"Content-Type": "text/js"});
                response.write(data);
                response.end();
            }
        );
        break;
    case "jpeg":
        fs.readFile("."+request.url, "binary",
            function (err, data) {
                response.writeHead(200, {"Content-Type": "image/jpeg"});
                response.write(data, "binary");
                response.end();
            }
        );
        break;
    case "png":
        fs.readFile("."+request.url, "binary",
            function (err, data) {
                response.writeHead(200, {"Content-Type": "image/png"});
                response.write(data, "binary");
                response.end();
            }
        );
        break;
    default:
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(fs.readFileSync(__dirname + '/chat.html', 'UTF-8'));        
    }
};


var io = socketio.listen(server);

var pastRoom, rowLength, namecheck;

io.sockets.on('connection', function (socket) {
    socket.on('join', function(data) {
        socket.join(data.value);
        console.error(data.value);
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: true,
        });
          
        client.connect();
        client.query("SELECT COUNT (name) FROM rooms WHERE name = $1 ;",[data.value], (err, res) => {
            if (err) {
                console.error(err);
                throw err;
            }
            console.log(res.rows[0].count);
            if (res.rows[0].count == 0) {
                client.query("SELECT COUNT (*) FROM rooms;", (err, res) => {
                    if (err) {
                        console.error(err);
                        throw err;
                    }
                    console.log(res.rows[0].count);
                    rowLength = parseInt(res.rows[0].count) + 1;
                    insert(rowLength);
                });
                function insert(rowLength) {
    //                intoDB = "INSERT INTO rooms(id, name) VALUES (" + rowLength + ", '" + pastRoom + "');";
    //                client.query(intoDB, (err) => {
                    client.query("INSERT INTO rooms(id, name) VALUES ($1, $2);", [rowLength, data.value], (err) => {
                        if (err) {
                            console.error(err);
                            throw err;
                        }
                    });
                    client.query("SELECT * FROM rooms;", (err, res) => {
                        if (err) {
                            console.error(err);
                            throw err;
                        }
                        console.log(res);
                        client.end((err) => {
                            console.log('client has disconnected');
                            if (err) {
                            console.log('error during disconnection', err.stack);
                            }
                        });
                    });
                }
            }else {
                client.end((err) => {
                    console.log('client has disconnected');
                    if (err) {
                        console.log('error during disconnection', err.stack);
                    }
                });
            }
        });
   });

    socket.on('pos', function (data) {
        io.to(data.id).emit('posit', data.value);
        //console.error(data.id);
    });
    socket.on('erase', function (data) {
        io.to(data.id).emit('eraseAll', data.value);
        //console.error(data.id);
    });
    socket.on('sendChat', function (data) {
        io.to(data.id).emit('returnChat', { value: data.value, name: data.name });
        //console.log(data);
    });
    socket.on('sendImg', function (data) {
        io.to(data.id).emit('returnImg', { value: data.value, name: data.name });
        //console.log(data);
    });
    socket.on('sendReq', function (data) {
        io.to(data.id).emit('returnReq', { value: "req" });
        //console.log(data);
    });
    socket.on('sendName', function (data) {
        io.to(data.id).emit('returnName', { tag: data.tag, name: data.name });
        //console.log(data);
    });    
    socket.on('sendThum', function (data) {
        io.to(data.id).emit('addThum', { value: data.value, name: data.name });
        //console.log(data);
    });
    socket.on('thumToBoard', function (data) {
        io.to(data.id).emit('addBoard', { value: data.value, name: data.name });
        //console.log(data);
    });
    socket.on('canvasToChat', function (data) {
        io.to(data.id).emit('addThum', { value: data.value, name: data.name });
        //console.log(data);
    });
    socket.on('sendRoomName', function (data) {
        pastRoom = data.value;
//        client.connect();
//        client.connect(function(err) {
//            if (err) throw err;
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: true,
        });
        
        client.connect();
        client.query("SELECT COUNT (*) FROM rooms;", (err, res) => {
            if (err) {
                console.error(err);
                throw err;
            }
            console.log(res.rows[0].count);
            rowLength = parseInt(res.rows[0].count) + 1;
            insert(rowLength);
        });
        function insert(rowLength) {
//                intoDB = "INSERT INTO rooms(id, name) VALUES (" + rowLength + ", '" + pastRoom + "');";
//                client.query(intoDB, (err) => {
            client.query("INSERT INTO rooms(id, name) VALUES ($1, $2);", [rowLength, pastRoom], (err) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
            });
            client.query("SELECT * FROM rooms;", (err, res) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
                console.log(res);
                client.end((err) => {
                    console.log('client has disconnected');
                    if (err) {
                        console.log('error during disconnection', err.stack);
                    }
                });
            });
        }
//        });
    });
    socket.on('confRoomName', function(data) {
        namecheck = data.value;
        console.log(namecheck);
//        searchDB = "SELECT COUNT (name) FROM rooms WHERE name = '" + namecheck + "' ;";
//        client.query(searchDB, (err, res) => {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: true,
        });
        
        client.connect();
        client.query("SELECT COUNT (name) FROM rooms WHERE name = $1 ;",[namecheck], (err, res) => {
            if (err) {
                console.error(err);
                throw err;
            }
            console.log(res.rows[0].count);
            if (res.rows[0].count == 0) {
                socket.emit('permit', {value: true});
            }else {
                socket.emit('permit', {value: false});
            }
            client.end((err) => {
                console.log('client has disconnected');
                if (err) {
                  console.log('error during disconnection', err.stack);
                }
            });
        });
    });
    socket.on('audioMute', function (data) {
        io.to(data.id).emit('returnMute', { judge: data.judge, value: data.value, name: data.name });
        console.log(data);
    });
});
