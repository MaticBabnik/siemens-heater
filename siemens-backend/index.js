const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const { config } = require("dotenv");
const express = require('express');
const { Server: WebSocketServer } = require('ws');   // include the webSocket library
const snap7 = require('node-snap7');

config();

const SIEMENS_IP = process.argv[2] || '192.168.117.222';
let WRITE = undefined;

const s7client = new snap7.S7Client();
const influx = new InfluxDB({
    url: 'http://home.sync.si:8086',
    token: process.env.TOKEN
});
const write = influx.getWriteApi(process.env.ORG, process.env.BUCKET, 's');
write.useDefaultTags({ location: process.env.LOCATION });

const wss = new WebSocketServer({ port: 8080 });
const connections = [];

const FACTOR = 300, OFFSET = 10;

function tempToUint(x) {
    return (x - OFFSET) * FACTOR;
}

function uintToTemp(x) {
    return x / FACTOR + OFFSET;
}

wss.on('connection', (client) => {
    connections.push(client)

    client.on('message', (data) => {
        console.log({ receivedData: data });
        try {
            const n = JSON.parse(data);
            if (typeof n == 'number') {
                writeTargetUint(tempToUint(n));
            } else {
                console.log({ n, type: typeof n })
            }
        } catch (e) {
            console.error("Dubu garbage")
            console.error(e);
        }
    });
    client.on('close', () => connections.splice(connections.indexOf(client), 1));
});


function broadcast(data) {
    connections.forEach(x => x.send(JSON.stringify(data)));
}

var DB1_0_int_digital_in = 0;  // digital IN
var tempmes = 0;   // analog IN
var DB1_4_int_digital_out = 0; // digital OUT
var DB1_6_int_stevec = 0;      // stevec


function read() {
    s7client.ConnectTo(SIEMENS_IP, 0, 1, function (err) {
        if (err) {
            return console.log('Napaka pri povezovanju.Code #' + err + '-' + s7client.ErrorText(err));
        }

        s7client.DBRead(1, 0, 8, function (err, res) {
            if (err)
                return console.log('Napaka pri branju Code #' + err + '-' + s7client.ErrorText(err));

            DB1_0_int_digital_in = 256 * res[0] + res[1];  // digital IN
            tempmes = (res[4] << 8) + res[5];
            DB1_4_int_digital_out = 256 * res[4] + res[5]; // digital OUT
            DB1_6_int_stevec = 256 * res[6] + res[7];      // stevec


            const point1 = new Point('temperature')
                .floatField('value', uintToTemp(tempmes))

            write.writePoint(point1)
            write.flush();

            broadcast(res);  //poslje podatke iz krmilnika k odjemalcu		
        });
    });
}

function writeTargetUint(x) {
    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt16BE(x);

    s7client.ConnectTo(SIEMENS_IP, 0, 1, (err) => {
        if (err) console.log("failed write");

        s7client.DBWrite(1, 2, 2, buf, (err2) => {
            if (err2)
                console.log("failedWrite")
        })
    });
}


// TODO: maybe implement ???
// function vpisiVrednostiVkrmilnikSIEMENS(analogniIzhod, digitalniIzhodi) {
//     s7client.ConnectTo(SIEMENS_IP, 0, 1, function (err) {
//         if (err) {
//             return console.log('Napaka pri povezovanju.Code #' + err + '-' + s7client.ErrorText(err));
//         }

//         //Vpis v krmilnik ... vrednost je v bufferju (16 bit int)
//         const bufanal = Buffer.allocUnsafe(2);
//         //vpis analognega izhoda
//         bufanal.writeUInt16BE(analogniIzhod, 0, 2);
//         s7client.DBWrite(1, 8, 2, bufanal, function (err) {
//             if (err)
//                 return console.log('Napaka pri vpisu. Code #' + err + '-' + s7client.ErrorText(err));
//         });
//         //vpis digitalnih izhodov v krmilnik
//         const bufdig = Buffer.allocUnsafe(2);
//         bufdig.writeUInt16BE(digitalniIzhodi, 0, 2);
//         s7client.DBWrite(1, 4, 2, bufdig, function (err) {
//             if (err)
//                 return console.log('Napaka pri vpisu. Code #' + err + '-' + s7client.ErrorText(err));
//         });
//     });
// }

setInterval(function () {
    read();
}, 200);

writeTargetUint(0);