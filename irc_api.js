var irc = require('./irc/irc');

module.exports = {
    rpl_cmds: {
        'rpl_motd': function(obj) {
            // server, to, msg, from, callbacks
            return {
                action: 'addMsg',
                args: [obj.server, obj.server, obj.trailing(), obj.server, ["updateMessages"]]
            };
        },
        'PRIVMSG': function(obj) {
            if (obj.trailing().substr(0, 12).indexOf("ACTION") != -1) {

                return {
                    action: 'actionMsg',
                    room: obj.args()[0],
                    from: obj.nickname(),
                    msg: obj.trailing(),
                    server: obj.server,
                    args: [obj.server, obj.args()[0], obj.trailing(), obj.nickname(), ["updateMessages"]]
                };
            } else {
                // server, to, msg, from, callbacks

                return {
                    action: 'addMsg',
                    args: [obj.server, obj.args()[0], obj.trailing(), obj.nickname(), ["updateMessages"]]
                };
            }
        },
        'rpl_namreply': function(obj) {
            // (server, room, users, callbacks)

            return {
                action: 'addUsers',
                args: [obj.server, obj.args()[2], obj.trailing().split(" ").filter(e => e != ""), ["updateUsers"]]
            }
        },
        'PART' : function(obj) {
            return {
                action: 'part',
                args: [obj.nickname(), obj.args()[0], obj.server,
                    ['updateRooms', 'updateTopic', 'updateMessages', 'updateUsers']
                ]
            }
        },
        'JOIN': function(obj) {
            var room;
            if(obj.args().length  == 0 || obj.args()[0] == ":") {
                room = obj.trailing();
            } else {
                room = obj.args()[0]
            }
            return {
                action: 'join',
                args: [obj.server, room, obj.nickname(), []]
            };
        },
        'QUIT': function(obj) {
            return {
                action: 'quit',
                args: [obj.nickname(), obj.args()[0], obj.server,
                    ['updateRooms', 'updateTopic', 'updateMessages', 'updateUsers']
                ]
            }
        },
        'NOTICE': function(obj) {
            return {
                action: 'notice',
                args: [obj.trailing(), obj.server, ["updateRooms"]]
            };
        },
        'rpl_isupport': function(obj) {
            return {
                action: 'isupport',
                rpl_isupport: obj.args()[0],
                server: obj.server
            };
        },
        'connect': function(obj) {
            return {
                action: 'connect',
                args: [obj.username, obj.server, ["updateNick"]]
            };
        },
        'NICK': function(obj) {
            return {
                action: 'changeNick',
                nick: obj.args[0],
                old: obj.nick,
                args: [obj.server, obj.nickname(), obj.trailing(),
                    ["updateUsers", "updateNick", "updateMessages"]
                ]
            }
        },
        'rpl_topic': function(obj) {
            return {
                action: 'setTopic',
                args: [obj.server, obj.args()[1], obj.trailing(),
                    ["updateTopic"]
                ],
                rpl_topic: obj.args()[1],
                server: obj.server
            };
        },
        'TOPIC': function(obj) {
                return {
                    action: 'setTopic',
                    args: [obj.server, obj.args()[0], obj.trailing(),
                        ["updateTopic"]
                    ],
                    rpl_topic: obj.trailing(),
                    server: obj.server
                };
            }
            /*,
                    'rpl_welcome': function(obj) {
                        return {rpl_welcome: obj.args[0], server: obj.server, msg: obj.args[1]};
                    }*/
    },
    send_cmds: {
        'me': function(obj, self) {
            return {
                action: 'actionMsg',

                args_: [self.current.server, self.current.room, '\001ACTION ' + obj.substr(4) + '\001', self.current.nick, ["updateMessages"]],
                send: "PRIVMSG "+self.current.room+" :\001ACTION "+obj.substr(4)+"\001"+"\r\n"
            }
        },
        'join': function(obj, self) {
            var channels = obj.substr(6).split(' ');
            self.channel = channels[channels.length - 1];
            return {
                action: 'join',

                args_: [obj.substr(6).split(' ')[0], null, []],
                send: ['JOIN'].concat(obj.substr(6).split(' ')).join(" ")+"\r\n"
            }
        },
        'part': function(obj, self) {
            return {
                action: "part",
                args_: [self.current.nick, "intentionally leaving", self.current.room, self.current.server, ['updateRooms', 'updateTopic', 'updateMessages', 'updateUsers']],
                send: "PART "+self.current.room+" user decided to leave\r\n"
            }
        },
        'quit': function(obj, self) {
            return {
                action: "quit",
                args_: [self.current.nick, "intentionally quitting", self.current.server, ['updateRooms', 'updateTopic', 'updateMessages', 'updateUsers']],
                send: "QUIT user decided to quit\r\n"
            }
        },
        'nick': function(obj, self) {
            var old_nick = self.current.nick;
            self.current.nick = obj.substr(6).split(' ')[0];
            return {
                action: "changeNick",

                args_: [self.current.server, old_nick, obj.substr(6).split(' ')[0], ["updateUsers", "updateNick", "updateMessages"]],
                send: "NICK "+obj.substr(6).split(' ')[0]+"\r\n"
            }
        },
        'msg': function(obj, self) {
            var channels = obj.substr(5).split(' ')[0];
            self.current.room = obj.substr(5).split(' ')[0];
            return {
                action: "addMsg",

                args_: [self.current.server, obj.substr(5).split(' ')[0], obj.substr(channels.length + 5), self.userName, ["updateMessages", "updateRooms"]],
                send: "PRIVMSG "+obj.substr(5).split(' ')[0]+" "+obj.substr(channels.length + 5)+"\r\n"
            }
        },
        ' ': function(obj, self) {
            return {
                action: 'addMsg',

                args_: [self.current.server, self.current.room, obj, self.current.nick, ["updateMessages"]],
                send: "PRIVMSG " + self.current.room + " :" + obj + "\r\n"
            }
        }
    },
    quit: function(data) {
        irc.connections[data.server].quit();
        delete irc.connections[data.server];
    },
    changeChannel: function(server, channel) {

        this.current.server = server;
        this.current.room = channel;
        return this.webContents.send('client-server', {
            action: 'changeRoom',
            args: [server, channel, ['updateRooms', 'updateMessages', 'updateUsers', 'updateTopic']]
        });

    },
    set: function(type, value) {
        //(action.split(".").reduce(function(o, x) { return o[x] }, actions))(arg.data);
        this.current[type] = value;
    },
    connect: function(data) {
        var self = this;
        var webContents = self.webContents = data.webContents;
        self.current = {
            server: data.server,
            room: "",
            nick: data.nick
        };
        irc.connect(data);
        irc.connections[data.server].addListener('connect', function(data) {
            self.webContents.send('client-server', self.rpl_cmds['connect']({
                    username: data.nick,
                    server: data.server
                }));
        })
        irc.connections[data.server].addListener('raw', function(obj) {
            console.log(obj._crlfstr);
            if (obj.command && self.rpl_cmds[obj.command()]) {
                obj.server = obj.data.server;
                webContents.send('client-server', self.rpl_cmds[obj.command()](obj));
            }
        })

    },
    say: function(text) {
        var self = this;
        var cmd = (/^\/([a-z][a-z0-9_\-]*)/gim).exec(text);//ext.match(/\/.+?(?=\s)/);
        cmd = cmd && cmd[1] && (cmd[1]+'').toLowerCase();
        var args = this.send_cmds[((cmd == null) ? " " : cmd)](text, self);
        irc.connections[this.current.server].send(args.send);
        //this.client.send.apply(this.client, );
        self.webContents.send('client-server', {
            action: args.action,
            args: args.args_

        });
        if (args.callback) {
            this[args.callback](args.from);
        }

    }

};
