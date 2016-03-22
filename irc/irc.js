var net = require('net');
var Message = require('./message');
var EventEmitter = require('events').EventEmitter;
var util = require('util');


module.exports = (function(){

    var connection = function(opt) {
        var self = this;
        var registered = false;

        self.conn = new net.Socket();
        self.server = opt.server;
        self.conn.connect((opt.port || 6667), opt.server, function() {
            console.log('Connected');
            self.conn.write("irc_api*vtest\r\n");

            self.emit('connect', {
                nick: opt.nick,
                server: opt.server
            });

        });

        self.conn.on('data', function(data) {
            if(registered == false) {
                self.conn.write("USER " + opt.nick + " * *  :" + opt.nick + "\r\n");
                self.conn.write("NICK " + opt.nick + "\r\n");
                registered = true;
            }
            if(opt.debug) {
                console.log('Received: ' + data);
            }
            if (data.toString().split(" ")[0] == "PING") {
                self.conn.write("PONG " + data.toString().split(" ")[1]);
            }
            var tmp = data.toString().split(/\r\n/gi).map(e => e + "\r\n").filter(e => e.toString() != "\r\n").map(e => {
                try {
                    e = new Message(e);
                } catch (error) {
                    e = undefined;
                }
                return e;
            });
            for (var i in tmp) {
                var msg = tmp[i];

                if (msg) {
                    if(opt.debug) {
                        console.log(msg);
                    }
                    msg.data = {};
                    msg.data.server = self.server;
                    self.emit('raw', msg);
                }
            }
        });

        self.conn.on('close', function() {
            console.log('Connection closed');
        });
        EventEmitter.call(self);
        self.addListener('raw', function(msg) {
            if (msg.command() == "MODE" || msg.command() == "rpl_endofmotd") {
                console.log("attempt join");
                for (var j in opt.channels) {
                    self.conn.write("JOIN " + opt.channels[j] + "\r\n");
                }
            }
        });
    };
    util.inherits(connection, EventEmitter);
    connection.prototype.send = function(text) {
        var self = this;
        self.conn.write(text);
    };
    /*

    console.log(msg);
    */


        return {
            connections: {},
            connect: function(opt) {
                this.connections[opt.server] = new connection(opt);
            }
        };
})();
