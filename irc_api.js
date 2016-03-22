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
            console.log(obj.prefix())
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
            console.log(obj.params());
            return {
                action: 'addUsers',
                args: [obj.server, obj.args()[2], obj.trailing().split(" ").filter(e => e != ""), ["updateUsers"]]
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
                args: [obj.nick, obj.args()[0],
                    []
                ]
            }
        },
        /*'NOTICE': function(obj) {
            return {
                action: 'notice',
                args: [obj.args(), obj.server, ["updateRooms"]]
            };
        },*/
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
                args: [obj.server, obj.nick, obj.args[0],
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
        '/me': function(obj, self) {
            //('PRIVMSG', this.channel, '\001ACTION ' + text.substr(4) + '\001');
            return {
                action: 'actionMsg',
                args: ['PRIVMSG', self.channel, '\001ACTION ' + obj.substr(4) + '\001'],
                msg: '\001ACTION ' + obj.substr(4) + '\001',
                channel: self.channel,
                /*
                action: 'actionMsg',
                room: obj.args[0],
                from: obj.nick,
                msg: obj.args[1],
                server: obj.server
                */
                // server, to, msg, from, callbacks
                args_: [self.current.server, self.current.room, '\001ACTION ' + obj.substr(4) + '\001', self.current.nick, ["updateMessages"]],
                send: "PRIVMSG "+self.current.room+" :\001ACTION "+obj.substr(4)+"\001"+"\r\n"
            }
        },
        '/join': function(obj, self) {
            var channels = obj.substr(6).split(' ');
            self.channel = channels[channels.length - 1];
            return {
                action: 'join',
                args: ['JOIN'].concat(obj.substr(6).split(' ')),
                msg: '',
                // server, to, msg, from, callbacks
                args_: [obj.substr(6).split(' ')[0], null, []],
                send: ['JOIN'].concat(obj.substr(6).split(' ')).join(" ")+"\r\n"
            }
        },
        '/nick': function(obj, self) {
            var old_nick = self.userName;
            self.userName = obj.substr(6).split(' ')[0];
            return {
                args: ['NICK', obj.substr(6).split(' ')[0]],
                msg: obj.substr(6).split(' ')[0],
                channel: self.channel,
                from: old_nick //obj.substr(5).split(' ')[0],
            }
        },
        '/msg': function(obj, self) {
            var channels = obj.substr(5).split(' ')[0];
            self.channel = obj.substr(5).split(' ')[0];
            return {
                action: "addMsg",
                args: ['PRIVMSG', obj.substr(5).split(' ')[0], obj.substr(channels.length + 5)],
                // server, to, msg, from, callbacks
                args_: [self.server, obj.substr(5).split(' ')[0], obj.substr(channels.length + 5), self.userName, ["updateMessages", "updateRooms"]]
            }
        },
        ' ': function(obj, self) {
            return {
                action: 'addMsg',
                args: ['PRIVMSG', self.current.room, obj],
                msg: obj,
                channel: self.current.room,
                // server, to, msg, from, callbacks
                args_: [self.current.server, self.current.room, obj, self.current.nick, ["updateMessages"]],
                send: "PRIVMSG " + self.current.room + " :" + obj + "\r\n"
            }
        }
    },
    changeChannel: function(server, channel) {
        console.log("changing something")
        console.log(channel);
        this.current.server = server;
        this.current.room = channel;
        this.webContents.send('client-server', {
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
        console.log(this);
        var match = text.match(/\/.+?(?=\s)/);
        var args = this.send_cmds[((match == null) ? " " : match[0])](text, self);
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
