var irc = require('irc');

module.exports = {
    rpl_cmds: {
        'rpl_motd': function(obj) {
            // server, to, msg, from, callbacks
            return {
                action: 'addMsg',
                args: [obj.server, obj.server, obj.args[1], obj.server, ["updateMessages"]]
            };
        },
        'PRIVMSG': function(obj) {

            if (obj.args[1].substr(0, 12).indexOf("ACTION") != -1) {

                return {
                    action: 'actionMsg',
                    room: obj.args[0],
                    from: obj.nick,
                    msg: obj.args[1],
                    server: obj.server,
                    args: [obj.server, obj.args[0], obj.args[1], obj.nick, ["updateMessages"]]
                };
            } else {
                // server, to, msg, from, callbacks

                return {
                    action: 'addMsg',
                    args: [obj.server, obj.args[0], obj.args[1], obj.nick, ["updateMessages"]]
                };
            }
        },
        'rpl_namreply': function(obj) {
            // (server, room, users, callbacks)
            return {
                action: 'addUsers',
                args: [obj.server, obj.args[2], obj.args[3].split(" "), ["updateUsers"]]
            }
        },
        'JOIN': function(obj) {
            return {
                action: 'join',
                args: [obj.args[0], obj.nick, []]
            };
        },
        'QUIT': function(obj) {
            return {
                action: 'quit',
                args: [obj.nick, obj.args[0],
                    []
                ]
            }
        },
        'NOTICE': function(obj) {
            return {
                action: 'notice',
                args: [obj.args, obj.server, ["updateRooms"]]
            };
        },
        'rpl_isupport': function(obj) {
            return {
                action: 'isupport',
                rpl_isupport: obj.args,
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
                args:[obj.server, obj.nick, obj.args[0], ["updateUsers", "updateNick", "updateMessages"]]
            }
        },
        'rpl_topic': function(obj) {
                return {
                    action: 'setTopic',
                    args: [obj.server, obj.args[1], obj.args[2], ["updateTopic"]],
                    rpl_topic: obj.args[1],
                    server: obj.server
                };
            },
            'TOPIC': function(obj) {
                return {
                    action: 'setTopic',
                    args: [obj.server, obj.args[0], obj.args[1], ["updateTopic"]],
                    rpl_topic: obj.args[1],
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
                args_: [self.server, self.channel, '\001ACTION ' + obj.substr(4) + '\001', self.userName, ["updateMessages"]]
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
                args_: [obj.substr(6).split(' ')[0], null, []]
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
                args: ['PRIVMSG', self.channel, obj],
                msg: obj,
                channel: self.channel,
                // server, to, msg, from, callbacks
                args_: [self.server, self.channel, obj, self.userName, ["updateMessages"]]
            }
        }
    },
    changeChannel: function(channel) {
        console.log("changing something")
        console.log(channel);
        this.channel = channel;
        this.webContents.send('client-server', {
            action: 'changeRoom',
            args: [channel, ['updateRooms', 'updateMessages', 'updateUsers', 'updateTopic']]
        });
    },
    start: function(server, username, realName, channels, webContents, port) {
        var webContents = this.webContents = webContents;
        var self = this;
        this.client = new irc.Client(server, username, {
            channels: channels,
            userName: username,
            realName: realName,
            port: (port || 6667),
            debug: true
        });
        this.userName = username;
        this.server = server;

        this.client.addListener('connect', function(obj) {
            webContents.send('client-server', self.rpl_cmds['connect']({
                username: self.userName,
                server: self.server
            }));
        });
        this.client.addListener('raw', function(obj) {
            console.log(JSON.stringify(obj));
            if (obj.command && self.rpl_cmds[obj.command]) {
                obj.server = self.server;
                webContents.send('client-server', self.rpl_cmds[obj.command](obj));
            }
        });
        this.client.addListener('error', function(message) {
            console.log('error: ', message);
        });
        this.channel = channels[0];
    },
    say: function(text) {
        var self = this;
        var match = text.match(/\/.+?(?=\s)/);
        var args = this.send_cmds[((match == null) ? " " : match[0])](text, self);
        this.client.send.apply(this.client, args.args);
        this.webContents.send('client-server', {
            action: args.action,
            args: args.args_

        });
        if (args.callback) {
            this[args.callback](args.from);
        }
    }
};
