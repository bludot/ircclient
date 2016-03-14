var irc = require('irc');

module.exports = {
    rpl_cmds: {
        'rpl_motd': function(obj) {
            return {
                room: obj.server,
                from: "system",
                msg: obj.args[1]
            };
        },
        'PRIVMSG': function(obj) {
            console.log(obj.args[1].substr(0, 12));
            if (obj.args[1].substr(0, 12).indexOf("ACTION") != -1) {
                return {
                    room: obj.args[0],
                    from: obj.nick,
                    msg: obj.args[1]
                };
            } else {
                return {
                    room: obj.args[0],
                    from: obj.nick,
                    msg: obj.args[1]
                };
            }
        },
        'rpl_namreply': function(obj) {
            console.log(obj.args[3].split(" "));
            return {
                users: obj.args[3].split(" ")
            }
        },
        'JOIN': function(obj) {
            return {
                join: obj.args[0],
                nick: obj.nick,
                server: obj.server
            };
        },
        'QUIT': function(obj) {
            return {
                quit: [obj.nick, obj.args[0]]
            }
        },
        'NOTICE': function(obj) {
            return {
                notice: obj.args,
                server: obj.server
            };
        },
        'rpl_isupport': function(obj) {
            return {
                rpl_isupport: obj.args,
                server: obj.server
            };
        },
        'connect': function(obj) {
            return {
                connect: obj.username
            };
        },
        'rpl_topic': function(obj) {
            return {rpl_topic: obj.args[2], server: obj.server};
        }
    },
    send_cmds: {
        '/me': function(obj, self) {
            //('PRIVMSG', this.channel, '\001ACTION ' + text.substr(4) + '\001');
            return {
                args: ['PRIVMSG', self.channel, '\001ACTION ' + obj.substr(4) + '\001'],
                msg: ''
            }
        },
        '/join': function(obj, self) {
            var channels = obj.substr(6).split(' ');
            self.channel = channels[channels.length-1];
            return {
                args: ['JOIN'].concat(obj.substr(6).split(' ')),
                msg: ''
            }
        },
        ' ': function(obj, self) {
            return {
                args: ['PRIVMSG', self.channel, obj],
                msg: obj
            }
        }
    },
    changeChannel: function(channel) {
        this.channel = channel;
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
        /*this.client.addListener('message', function (from, to, message) {
            console.log(from + ' => ' + to + ': ' + message);
            webContents.send('client-server', {msg: message, from: from});
        });*/
        this.client.addListener('connect', function(obj) {
            webContents.send('client-server', self.rpl_cmds['connect']({username: this.userName}));
        });
        this.client.addListener('raw', function(obj) {
            console.log(JSON.stringify(obj));
            if (obj.command && self.rpl_cmds[obj.command]) {
                webContents.send('client-server', self.rpl_cmds[obj.command](obj));
            }
        });
        this.client.addListener('error', function(message) {
            console.log('error: ', message);
        });
        this.channel = channels[0];
    },
    say: function(text) {
        var match = text.match(/\/.+?(?=\s)/);
        var args = this.send_cmds[((match == null)? " ": match[0])](text, this);
            this.client.send.apply(this.client, args.args);
        this.webContents.send('client-server', {
            room: this.channel,
            msg: args.msg,
            from: this.userName
        });
    }
};
