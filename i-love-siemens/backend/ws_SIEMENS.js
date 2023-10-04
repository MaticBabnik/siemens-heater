/*
SIEMENS-websocket Server
18. avgust 2020

Za zagon te datoteke v komandno vrstico vpišeš:
node ws_SEMENS.js IP_PLC_krmilnika

(IP_PLC_krmilnika = npr. 192.168.117.222)

shoutout setnicar
shoutout vegova
*/
var IP_SIEMENS_krmilnika = process.argv[2];
var zeljaZaVpisSIEMENS = 0;

var WebSocketServer = require('ws').Server;   // include the webSocket library

// configure the webSocket server:
var SERVER_PORT = 8080;                 // port number for the webSocket server
var wss = new WebSocketServer({ port: SERVER_PORT }); // the webSocket server
var connections = new Array;            // list of connections to the server


// ------------------------ webSocket Server event functions


wss.on('connection', handleConnection);


function handleConnection(client) {
    console.log("Nova povezava!");        // you have a new client
    connections.push(client);             // add this client to the connections array

    client.on('message', sendToSIEMENS);      // when a client sends a message,
    client.on('close', function () {           // when a client closes its connection
        console.log("Povezava se je zaprla");       // print it out
        var position = connections.indexOf(client); // get the client's position in the array
        connections.splice(position, 1);        // and delete it from the array
    });
}
// This function broadcasts messages to all webSocket clients
function broadcast(data) {
    for (c in connections) {     // iterate over the array of connections
        connections[c].send(JSON.stringify(data)); // send the data to each connection
        //connections[c].send(data); // send the data to each connection
        console.log(data);
    }
}

function sendToSIEMENS(data) {
    console.log('received: %s', data);
    //var posamezneVrednosti=data.split('#');
    //analogniIzhod=posamezneVrednosti[0];
    //digitalniIzhodi=posamezneVrednosti[1];
    //zeljaZaVpisSIEMENS=1;
}

function spremeni_INT_to_UINT(vred) {
    if (vred > 0x7fff)
        return (vred - 0xffff - 1);
    else
        return vred;
}


/* *******************************************************/
var DB1_0_int_digital_in = 0;  // digital IN
var DB1_2_int_analog_in = 0;   // analog IN
var DB1_4_int_digital_out = 0; // digital OUT
var DB1_6_int_stevec = 0;      // stevec
var DB1_8_int_analog_out = 0;    // analog OUT


////////////////////////////////////////////////////////////
///////////////    SIEMENS    //////////////////////////////
///////////////   node-snap7  //////////////////////////////
////////////////////////////////////////////////////////////

var snap7 = require('node-snap7');

var s7client = new snap7.S7Client();



function bere_SIEMENS() {

    s7client.ConnectTo(IP_SIEMENS_krmilnika, 0, 1, function (err) {
        if (err) {
            return console.log('Napaka pri povezovanju.Code #' + err + '-' + s7client.ErrorText(err));
        }

        //Iz podatkovnega bloka DB1 prebere 8 bajtov
        s7client.DBRead(1, 0, 8, function (err, res) {
            if (err)
                return console.log('Napaka pri branju Code #' + err + '-' + s7client.ErrorText(err));
            DB1_0_int_digital_in = 256 * res[0] + res[1];  // digital IN
            DB1_2_int_analog_in = 256 * res[2] + res[3];   // analog IN
            DB1_4_int_digital_out = 256 * res[4] + res[5]; // digital OUT
            DB1_6_int_stevec = 256 * res[6] + res[7];      // stevec

            //izpisuje v ukaznem oknu
            console.log(res);
            console.log(DB1_6_int_stevec);
            broadcast(res);  //poslje podatke iz krmilnika k odjemalcu		
        });



    });
}

function vpisiVrednostiVkrmilnikSIEMENS(analogniIzhod, digitalniIzhodi) {
    s7client.ConnectTo(IP_SIEMENS_krmilnika, 0, 1, function (err) {
        if (err) {
            return console.log('Napaka pri povezovanju.Code #' + err + '-' + s7client.ErrorText(err));
        }

        //Vpis v krmilnik ... vrednost je v bufferju (16 bit int)
        const bufanal = Buffer.allocUnsafe(2);
        //vpis analognega izhoda
        bufanal.writeUInt16BE(analogniIzhod, 0, 2);
        s7client.DBWrite(1, 8, 2, bufanal, function (err) {
            if (err)
                return console.log('Napaka pri vpisu. Code #' + err + '-' + s7client.ErrorText(err));
        });
        //vpis digitalnih izhodov v krmilnik
        const bufdig = Buffer.allocUnsafe(2);
        bufdig.writeUInt16BE(digitalniIzhodi, 0, 2);
        s7client.DBWrite(1, 4, 2, bufdig, function (err) {
            if (err)
                return console.log('Napaka pri vpisu. Code #' + err + '-' + s7client.ErrorText(err));
        });
    });
}

//periodično bere vrednosti iz krmilnika SIEMENS
setInterval(function () {
    bere_SIEMENS();
    if (zeljaZaVpisSIEMENS) {
        vpisiVrednostiVkrmilnikSIEMENS(analogniIzhod, digitalniIzhodi);
        zeljaZaVpisSIEMENS = 0;
    }
}, 200);

