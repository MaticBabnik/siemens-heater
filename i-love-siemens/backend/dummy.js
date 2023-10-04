
const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ port: 8080 });
const connections = new Map();

let gcid = 0;

wss.on('connection', (sock, rq) => {
    const id = gcid++;

    connections.set(id, sock);

    sock.on('close', () => {
        connections.delete(id);
    });
})

const rb = Buffer.alloc(8);
let c = 0;
let vw = 0x0001;

setInterval(() => {
    rb.writeUInt16BE(Math.floor(Math.random() * 0xffff), 0);
    rb.writeUInt16BE(Math.floor((Math.sin(Date.now() / 1000) + 1) * 0x7fff), 2);
    rb.writeUInt16BE(vw, 4);
    rb.writeUInt16BE(c++, 6);

    for (let conn of connections.values()) {
        conn.send(JSON.stringify(rb));
    }
}, 100);