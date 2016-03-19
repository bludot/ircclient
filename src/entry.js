// entry.js
var React = require('react');
var ReactDom = require('react-dom');

import { Scrollbars } from 'react-custom-scrollbars';

var trigger = function(data) {
  var mouseup = function(e) {
  var changeNode = window.positions.affect.node;
    var change_ = window.positions.affect.change(e.pageX||e.touches[0].pageX, window.positions.org);
    changeNode.style[window.positions.affect.style] = window.positions.node.clientWidth + "px";

    console.log(change_);

    window.positions.node.style.width = window.positions.width + change_ + "px";
    delete window.positions;
    window.removeEventListener('mousemove', mousemove, false);
    window.removeEventListener('mouseup', mouseup, false);
    window.removeEventListener('touchmove', mousemove, false);
    window.removeEventListener('touchend', mouseup, false);
    console.log(window.positions);
  }
  var mousemove = function(e) {

    var changeNode = window.positions.affect.node;
    var change_ = window.positions.affect.change(e.pageX||e.touches[0].pageX, window.positions.org);
    changeNode.style[window.positions.affect.style] = window.positions.node.clientWidth + "px";

    console.log(change_);

    window.positions.node.style.width = window.positions.width + change_ + "px";

  };
  var mousedown = function(e) {
    if (!window.positions) {
      window.positions = {
        org: e.pageX || e.touches[0].pageX,
        width: parseInt(this.data.node.clientWidth),
        affect: this.data.affect,
        node: this.data.node
      };
    }
    window.addEventListener('mousemove', mousemove, false);
    window.addEventListener('touchmove', mousemove, false);
    window.addEventListener('mouseup', mouseup, false);
    window.addEventListener('touchend', mouseup, false);
  };
  for (var i = 0; i < data.node.length; i++) {
  var trigger = document.createElement('div');
  trigger.className = "trigger";
  for(var j in data.style) {
  	trigger.style[j] = data.style[j];
  }
  data.node[i].appendChild(trigger);
    data.node[i].querySelector('.trigger').data = {
      node: data.node[i],
      affect: data.affect
    }
    data.node[i].querySelector('.trigger').addEventListener('mousedown', mousedown, false);
    data.node[i].querySelector('.trigger').addEventListener('touchstart', mousedown, false);
  }

};/*
{
	'server': {
        server_url: 	'irc.example.net', // server url
        server_name: 'server', // server netowrk name
        nick: 		"nick", // your nick in server,
        rooms: {
        'room': {
                server: 	true, // true || false,
                topic: 		"topic", // room topic
                active:     true, // true || false if the room is currently selected
                users: 		[
                                {
                                    type: 		'ops', // type of user in plain text
                                    code_color: '#000', // color of the user status
                                    nick: 		"nick", // nick of the user
                                    color:      '#000', // nick color
                                    code: 		'@' // symbol for the user
                                }
                            ], // users in room
                msgs: 		[
                                {
                                    time:   "00:00",//time stamp
                                    msg: 	'msg', // message
                                    from: 	'nick' // nick from which it came
                                }
                            ] // messages in this room
            }
        }
    }
}*/
var data = {
    change: function() {
        if (this.msgListener.updateMessages) {
            this.msgListener.updateMessages(this);
            this.msgListener.updateUsers(this);
            this.msgListener.updateRooms(this);
            this.msgListener.updateTopic(this);
            this.msgListener.updateNick(this);
        }
        return this;
    },
    view: {
        layout: [
            'rooms',
            'mainArea',
            'users'
        ]
    },
    current: {
        server: null,
        room: null,
        nicks: {},
    },
    data: [],
    msgListener: {
        userTypes: {
            '&': {
                type: 'admin',
                color: '#9879D1', //&
                order: 0
            },
            '@': {
                type: 'ops',
                color: '#C1D189', //@
                order: 1
            },
            '%': {
                type: 'halfops',
                color: '#A7B085', //%
                order: 2
            },
            '+': {
                type: 'voiced',
                color: '#00D35C', //+
                order: 3
            },
            ' ': {
                type: 'member',
                color: 'transparent',
                order: 4
            }
        },
        hashColor: function(str) {
            for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
            for (var i = 0, colour = "#"; i < 3; colour += ("195" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
            return colour;
        },
        parseUsers: function(users) {
            var userTypes = data.msgListener.userTypes;
            var hashColor = data.msgListener.hashColor;
            var un_users = users.map(function(user) {
                var type = 'member';
                var code_color = 'transparent';
                var nick = user;
                var code = ' ';
                var color = hashColor(user);

                if (userTypes[user.substr(0, 1)]) {
                    type = userTypes[user.substr(0, 1)].type;
                    code_color = userTypes[user.substr(0, 1)].color;
                    nick = user.substr(1);
                    code = user.substr(0, 1);
                    color = hashColor(user.substr(1))
                };
                return {
                    type: type,
                    code_color: code_color,
                    nick: nick,
                    color: color,
                    code: code
                }
            });
            return un_users.sort(function(a, b) {
                if (userTypes[a.code].order > userTypes[b.code].order) {
                    return 1;
                }
                if (userTypes[a.code].order < userTypes[b.code].order) {
                    return -1;
                }
                return 0;
            });
        },
        userSort: function(users) {
            var userTypes = data.msgListener.userTypes;
            return users.sort(function(a, b) {
                if (userTypes[a.code].order > userTypes[b.code].order) {
                    return 1;
                }
                if (userTypes[a.code].order < userTypes[b.code].order) {
                    return -1;
                }
                return 0;
            });
        },
        room: function(opt) {
            var room = {
                server: true, // true || false,
                server_name: data.current.server,
                topic: "", // room topic
                name: "",
                active: false,
                users: [], // users in room
                /*{
                    type: 		'ops', // type of user in plain text
                    code_color: '#000', // color of the user status
                    nick: 		"nick", // nick of the user
                    color:      '#000', // nick color
                    code: 		'@' // symbol for the user
                }*/

                msgs: [] // messages in this room

                /*{
                    time:   "00:00",//time stamp
                    msg: 	'msg', // message
                    from: 	'nick' // nick from which it came
                }*/
            };
            var keys = Object.keys(room);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (opt[k] !== undefined) {
                    room[k] = opt[k];
                }
            }
            return room;
        },
        server: function(opt, self) {
            var server = {
                server_url: "", // server url
                server_name: "", // server netowrk name
                nick: "", // your nick in server,
                rooms: {}
            };
            var keys = Object.keys(server);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (opt[k] !== undefined) {
                    server[k] = opt[k];
                }
            }
            server.rooms[opt.server_url] = new self.room({
                server: opt.server,
                name: opt.server
            });
            return server;
        },
        changeNick: function(server, old, new_, callbacks) {
            var self = this;
            if(old == data.current.nicks[server].nick) {
                data.current.nicks[server].nick = new_;
            }
            var old_nick = old;
            var new_nick = new_;
            for(var i in data.data[server].rooms) {
                data.data[server].rooms[i].users = data.data[server].rooms[i].users.map(function(e) {
                    if(e.nick == old_nick) {
                        e.nick = new_nick;
                    }
                    return e;
                });
                data.data[server].rooms[i].nick = new_nick;
            }
            callbacks.forEach(e => self[e](data));
        },
        changeRoom: function(server, room, callbacks) {
            var self = this;
            var room = room.toLowerCase();
            console.log("Server: "+server);
            console.log("Room: "+room);
            data.data[data.current.server].rooms[data.current.room].active = false;
            data.current.server = server;
            data.current.room = room;
            data.data[server].rooms[room].active = true;
            ipcRenderer.send('client-server', {
                action: 'irc.set',
                data: {
                    type: "server",
                    value: server
                }
            });
            ipcRenderer.send('client-server', {
                action: 'irc.set',
                data: {
                    type: "room",
                    value: room
                }
            });
            callbacks.forEach(e => self[e](data));
        },
        setTopic: function(server, room, topic, callbacks) {
            var self = this;
            var room = room.toLowerCase();
            data.data[server].rooms[room].topic = topic;
            callbacks.forEach(e => self[e](data));
        },
        actionMsg: function(server, to, msg, from, callbacks) {
            var self = this;
            var callbacks = callbacks;
            // if room doesnt exist add it
            var to = to.toLowerCase();


            if(to == data.current.nicks[server].nick.toLowerCase()) {
                to = from.toLowerCase();
            }
            if (!data.data[server].rooms[to]) {
                /*data.data[server].rooms[to] = new self.room({
                    server: false
                });*/
                // it was a new room so update the list
                callbacks = ["updateRooms"].concat(callbacks);
                //self.join(to, data.current.nicks[server].nick, []);
            }

            // we have the room at this point, add the message
            var time = new Date();
            data.data[server].rooms[to].msgs.push({
                time: time,
                msg: msg,
                action: true,
                from: from
            });

            callbacks.forEach(e => self[e](data));

        },
        addMsg: function(server, to, msg, from, callbacks) {
            var self = this;
            var callbacks = callbacks;
            // if room doesnt exist add it
            var to = to.toLowerCase();
            if(to == data.current.nicks[server].nick.toLowerCase()) {
                console.log("current nick match");
                to = from.toLowerCase();
            }
            if (!data.data[server].rooms[to]) {
                console.log("room doesnt exist");
                data.data[server].rooms[to] = new self.room({
                    server: false,
                    name: to
                });
                // it was a new room so update the list
                callbacks = ["updateRooms"].concat(callbacks);
                //self.join(to, data.current.nicks[server].nick, ["updateRooms"]);
            }

            // we have the room at this point, add the message
            var time = new Date();
            data.data[server].rooms[to].msgs.push({
                time: time,
                msg: msg,
                from: from
            });

            callbacks.forEach(e => self[e](data));
            console.log(data);

        },
        addUsers: function(server, room, users, callbacks) {
            var self = this;
            var room = room.toLowerCase();
            if (!data.data[server].rooms[room].users || data.data[server].rooms[room].users.length < 2) {
                data.data[server].rooms[room].users = self.parseUsers(users);
            } else {
                var users_ = self.userSort(data.data[server].rooms[room].users.concat(self.parseUsers(users)));

                data.data[server].rooms[room].users = users_;
            }

            callbacks.forEach(e => self[e](data));
        },
        notice: function(msg, server, callbacks) {
            var self = this;

            // create the server space in data
            if(!data.data[server]) {
                data.data[server] = new self.server({
                    server_url: server,
                    server: true
                }, self);
            }

            // set current server
            data.current.room = server;

            // callbacks
            callbacks.forEach(e => self[e](data));
        },
        quit: function(nick, msg, callbacks) {
            var self = this;

            for (var i in data.data[data.current.server].rooms) {
                if(data.data[data.current.server].rooms[i].users.find(e => e.nick == nick)) {
                    self.addMsg.apply(self, [data.current.server, i, nick + " has left the channel: " + msg, "-", ["updateMessages"]]);
                };
                data.data[data.current.server].rooms[i].users = data.data[data.current.server].rooms[i].users.filter(e => e.nick != nick);
            }
            var callbacks = ["updateMessages", "updateUsers"];
            callbacks.forEach(e => self[e](data));

        },
        join: function(room, nick, callbacks) {
            var self = this;
            var room = room.toLowerCase();
            if (!data.data[data.current.server].rooms[room]) {
                //data.data[data.current.server].rooms[data.current.room].active = false;
                data.data[data.current.server].rooms[room] = new self.room({
                    server: false,
                    active: true,
                    name: room
                }, self);
                //data.current.room = room;
                // it was a new room so update the list

                callbacks = ["updateRooms", "updateMessages"].concat(callbacks);
                callbacks.forEach(e => self[e](data));
                self.changeRoom.apply(self, [data.current.server, room, ["updateRooms"]]);
            }
            if(nick) {
                if (nick == data.data[data.current.server].rooms[room].nick) {

                } else {
                    self.addUsers.apply(self, [data.current.server, room, [nick],
                        ["updateUsers"]
                    ]);
                    self.addMsg.apply(self, [data.current.server, room, nick + " has joined the channel", "-", ["updateMessages"]]);
                    callbacks.forEach(e => self[e](data));
                }
            }
            /*
            join: obj.args[0],
            nick: obj.nick,
            server: obj.server
            */

            // callbacks

        },
        //updateNick:
        connect: function(nick, server, callbacks) {
            var self = this;
            data.current.server = server;
            data.current.nicks[server] = {
                nick: nick
            };
            data.data[server] = new self.server({
                server_url: server,
                server: true
            }, self);
            //data.data[data.current.server].rooms[data.current.room].active = true;
            var server = server;
            ipcRenderer.send('client-server', {
                action: 'irc.set',
                data: {
                    type: "server",
                    value: server
                }
            });
            callbacks.forEach(e => self[e](data));
        },
        listener: function() {
            var self = this;
            ipcRenderer.on('client-server', function(event, arg) {
                //console.log(arg); // prints "pong"
                /*var callback = self.callback;
                var updateRight = self.updateRight;
                var updateLeft = self.updateLeft;
                var parseUsers = self.parseUsers;
                var userSort = self.userSort;
                var updateTopic = self.updateTopic;
                var updateNick = self.updateNick;
                var changeRoom = self.changeRoom;*/
                if (self[arg.action]) {
                    console.log(arg.args);
                    self[arg.action].apply(self, arg.args);
                }
                /*if(arg.connect) {
                    data.tmp_name = arg.connect;
                    updateNick(data);
                } else if(arg.rpl_topic) {
                    data.data[data.current_room].topic = arg.rpl_topic;
                    updateTopic(data);
                } else if(arg.msg) {
                    var room = arg.room;
                    if(room == data.tmp_name) {
                        room = arg.from;//arg.from = data.tmp_name;
                    }
                  if(!data.data[room]) {
                    data.data[room] = {
                        room: room,
                        server: false,
                        topic: "",
                        server_name: arg.server,
                        nick: data.tmp_name,
                        users: [],
                        msgs: []
                    };
                    updateLeft(data);
                  }

                  var time = new Date();
                    data.data[room].msgs.push({
                        time: time,
                        msg: arg.msg,
                        from: arg.from
                    });

                    callback(data);
                    if(arg.from == room) {
                        updateLeft(data);
                        changeRoom(room);
                        updateLeft(data);
                    }
                    //updateRight(data.data);
                } else if(arg.users) {
                    if(!data.data[data.current_room].users || data.data[data.current_room].users.length < 2) {
                        data.data[data.current_room].users = parseUsers(arg.users);
                } else {
                    var users = userSort(data.data[data.current_room].users.concat(parseUsers(arg.users)));
                    console.log("more users!");
                    console.log(users);
                    data.data[data.current_room].users = users;
                }
                  console.log("got users");
                  updateRight(data);
                } else if(arg.join) {
                  data.current_room = arg.join;
                  if(!data.data[arg.join]) {
                    data.data[arg.join] = {
                        server: false,
                        server_name: arg.server,
                        nick: data.tmp_name,
                        room: arg.join,
                        topic: "",
                        active: true,
                        users: [],
                        msgs: []
                    };
                    data.data[data.last_active].active = false;
                    data.last_active = arg.join;
                    updateLeft(data);
                    callback(data);
                } else {
                    var users = userSort(data.data[data.current_room].users.concat(parseUsers([arg.nick])));
                    data.data[arg.join].users = users;
                    var time = new Date();
                    data.data[arg.join].msgs.push({
                        time: time,
                        msg: arg.nick+" has joined",
                        from: "-"
                    });
                    updateRight(data);
                    callback(data);
                }
            } else if(arg.nick) {
                if(data.tmp_name == arg.old) {
                    data.tmp_name = arg.nick;
                }
                var nick = arg.nick;
                var old = arg.old;
                for(var i in data.data) {
                    var room = data.data[i];
                    room.users = room.users.map(function(user) {
                        if(user.nick == old) {
                            user.nick = nick;
                        }
                        return user;
                    })
                    data.data[i] = room;
                }
                updateRight(data);

            } else if(arg.quit) {
                var time = new Date();
                data.data[data.current_room].msgs.push({
                    time: time,
                    msg: arg.quit[0]+" quit - "+arg.quit[1],
                    from: "-"
                });
                callback(data);
                var nick = arg.quit[0];
                for(var i in data.data) {
                    data.data[i].users = data.data[i].users.map(function(a) {
                        if(a.nick != nick) {
                            return a;
                        }
                    }).filter(e => e);
                }
                //data.data[data.current_room].users.splice(data.data[data.current_room].users.indexOf(arg.quit[0]), 1);

                updateRight(data);
            } else if(arg.notice) {
                if(!data.data[arg.server]) {
                    data.data[arg.server] = {
                    room: arg.server,
                    nick: data.tmp_name,
                    active: true,
                    server: true,
                    topic: "",
                    server_name: arg.server,
                    users: [],
                    msgs: []
                };
                data.last_active = arg.server;
                }
                var time = new Date();
                data.data[arg.server].msgs.push({
                    time: time,
                    msg: arg.notice[1],
                    from: arg.notice[1]
                });
                updateLeft(data);
            } else if(arg.rpl_isupport) {
                data.data[arg.server].server_name = arg.rpl_isupport.find(function(obj) {
                    return obj.indexOf("NETWORK=") != -1;
                }).substr(8);
                data.data[arg.server].room = data.data[arg.server].server_name;
                updateLeft(data);
            }
*/
            });
            return true;
        },
        set: function(kind, value) {
            this[kind] = value;
        }
    }
};


var Messages = React.createClass({

    getInitialState: function() {

        return {
            data: this.props.data.change()
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateMessages', this.updateHandler);
        //this.props.data.msgListener.listener();
    },
    updateHandler: function(data) {
        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
        this.refs.scrollbars.scrollToBottom();
    },

    render: function() {
        var state_data = this.state.data.data;
        var state_data_ = this.state.data;
        var messageNodes = function(room, msgs) {
            var room = room;
            return msgs.map(function(msg) {
                var _from = msg.from;


                var color = "#aaa";
                if(room.users.length > 0) {
                    if(room.users.find(function(a) { return a.nick == _from;})) {
                        color = room.users.find(function(a) { return a.nick == _from;}).color;
                    }
                }

                var style = {color: color};
                if(msg.msg.substr(0, 12).indexOf("ACTION") != -1) {
                    msg.msg = msg.msg.substr(7);
                }
                var message = msg.msg.split(' ').map(function(a) {
                    var tmp_nick;
                    var space = String.fromCharCode(32);
                    if(tmp_nick = room.users.find(b => a == b.nick)) {
                        return (<span style={{color: tmp_nick.color, fontWeight: '600'}}>{tmp_nick.nick+space}</span>);
                    } else {
                        var b = a+space;
                        if(a != "") {
                            return (<span>{b}</span>);
                        }
                    }
                });
                var from = {
                    msg:msg.from,
                    style:{}
                };
                if(msg.action) {
                    from.msg = "- "+msg.from;
                    from.style={fontStyle: 'italic'};
                }
                return (<li key={msg.key} style={from.style}><time>{msg.time.toUTCString().match(/\d+?:\d.+?:\d.+?/)[0]}</time><span><span style={style}>{from.msg}</span><span>{message}</span></span></li>);
            });
        };

        var roomsNodes = function() {


            var nodes = [];
            for(var i in state_data) {
                for(var j in state_data[i].rooms) {
                    var messages = messageNodes(state_data[i].rooms[j], state_data[i].rooms[j].msgs);
                    var active = (state_data[i].rooms[j].active ? "active": "");
                    nodes.push(<ul data-room={j} className={active}>{messages}</ul>);
                }
            }
            return nodes;
        };


        return (<div className="messages"><Scrollbars ref="scrollbars"><div>{roomsNodes()}</div></Scrollbars></div>);
    }
});
var Input = React.createClass({
    getInitialState: function() {
        return {
            value: "",
            data: this.props.data
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateNick', this.updateHandler);
        //this.props.data.msgListener.listener();
    },
    updateHandler: function(data) {
        this.setState({
            data: data
        });
    },
    handleInput: function(event) {
        this.setState({
            value: event.target.value
        });

    },
    handleKeyDown: function(event) {
        if (event.keyCode == 9) {
            event.preventDefault();
        }
        this.setState({
            value: event.target.value
        })
    },
    handleKeyUp: function(event) {


        if (event.keyCode == 13) {


            if(this.state.value.substr(0,2) == "##") {
                var args = this.state.value.split(" ");
                ipcRenderer.send('client-server', {
                    action: 'irc.connect',
                    data: JSON.parse(this.state.value.substr(3))
                });
            } else {
            ipcRenderer.send('client-server', {
                action: 'irc.send',
                data: {
                    msg: this.state.value
                }
            });
        }

        this.refs.input_.value = "";
        this.setState({
            value: ""
        });
    } else if(event.keyCode == 9) {
        var input = this.refs.input_;
        var sel = {
          start: input.selectionStart,
          collapsed: input.selectionStart === input.selectionEnd,
          suggestText: input.value.substring(0, input.selectionStart).split(' ').pop().toLowerCase()
        };
        if (sel.suggestText && sel.suggestText.length > 1) {
          var postFix = sel.isAtStart ? ': ' : ' ';
          var users = this.state.data.data[this.state.data.current.server].rooms[this.state.data.current.room].users;
          for (var i in users) {
            if (users[i].nick.substring(0, sel.suggestText.length).toLowerCase() === sel.suggestText) {
              input.value = input.value.substring(0, sel.start - sel.suggestText.length) + users[i].nick + postFix + input.value.substring(sel.start);
              input.selectionStart = input.selectionEnd = sel.start - sel.suggestText.length + users[i].nick.length + postFix.length;
              break;
            }
          }
        }
    }
        return true;
    },
    render: function() {
        var nick = (this.state.data.current.nicks[this.state.data.current.server] || {nick: "nick"}).nick;
        return (<div className="msg-input"><span>{nick}</span><span><input type="text" ref="input_" value={this.state.value} onInput={this.handleInput} onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp}/></span></div>);
    }
});
var MinimizeBtn = React.createClass({
    onClick: function(event) {
        ipcRenderer.send('client-server', {
            action: 'win.minimize'
        });
        return true;
    },
    render: function() {
        return (<i className="material-icons" onClick={this.onClick}>remove</i>)
    }
})
var KioskBtn = React.createClass({
    onClick: function(event) {
        ipcRenderer.send('client-server', {
            action: 'win.setKiosk'
        });
        return true;
    },
    render: function() {
        return (<i className="material-icons" onClick={this.onClick}>zoom_out_map</i>)
    }
})
var CloseBtn = React.createClass({
    onClick: function(event) {
        ipcRenderer.send('client-server', {
            action: 'win.close'
        });
        return true;
    },
    render: function() {
        return (<i className="material-icons" onClick={this.onClick}>clear</i>)
    }
});
var Rooms = React.createClass({
    getInitialState: function() {

        return {
            data: this.props.data.change()
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateRooms', this.updateHandler);
        //this.props.data.msgListener.set('changeRoom', this.changeRoom);
        //
    },
    updateHandler: function(data) {

        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
    },
    changeRoom: function(server, room) {
        console.log("changing rooms");
        console.log(room);
        ipcRenderer.send('client-server', {
            action: 'irc.changeChannel',
            data: {
                server: server,
                room: room
            }
        });

        /*this.setState({
            data: this.props.data.change()
        });
        console.log(this.state.data);*/
    },
    render: function() {

        var state_data = this.props.data;

        var rooms = [];
        for(var i in state_data.data) {

              for(var j in state_data.data[i].rooms) {
                  var server = state_data.data[i].rooms[j].server;
                  var active = state_data.data[i].rooms[j].active;
                  var classname = "room_list"+ (server ? " server":"") + (active ? " active":"");

                  rooms.push(<li className={classname} data-room={j} onClick={this.changeRoom.bind(this, i, j)}>{j}</li>);
            }
        }

        return(<div className="left_side"><Scrollbars ref="scrollbars"><ul>{rooms}</ul></Scrollbars></div>);
    }
});
var Users = React.createClass({
  getInitialState: function() {

      return {
          data: this.props.data.change()
      };
  },
  componentDidMount: function() {
      this.props.data.msgListener.set('updateUsers', this.updateHandler);
      //
  },
  updateHandler: function(data) {

      this.setState({
          data: data
      });
      //var node = this.getDOMNode();
      //node.scrollTop = node.scrollHeight;
  },
    render: function() {
      var users = "";
      var state_data = this.props.data;
      if(state_data.current.room != null && state_data.data[state_data.current.server]) {
        users = state_data.data[state_data.current.server].rooms[state_data.current.room].users.map(function(user) {
            var parent_style = {color: user.color};
            var style = {'background': ''+user.code_color+''};
        return (<li className="user_list" style={parent_style}><span className="user_dot" style={style}></span>{user.nick}</li>);
      });
      }
        return(<div className="right_side"><Scrollbars ref="scrollbars"><ul>{users}</ul></Scrollbars></div>);
    }
});
var MainArea = React.createClass({
    render: function() {
        return(<div className="MainArea">
        <Input data={this.props.data}/>
        <Messages data={this.props.data} />
        </div>);
    }
});
var Topic = React.createClass({
    getInitialState: function() {

        return {
            data: this.props.data.change()
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateTopic', this.updateHandler);
        //
    },
    updateHandler: function(data) {

        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
    },
    render: function() {
        var topic = (<span></span>);
        var room = (<span></span>);
        if(this.state.data.current.server) {
            topic = (<span>{this.props.data.data[this.state.data.current.server].rooms[this.state.data.current.room].topic}</span>);
            room = (<span>{this.state.data.current.room}</span>);
        }
        return (<div className="topic">{room}{topic}</div>)
    }
});
var App = React.createClass({
    render: function() {
        var drag_area = {
            'WebkitAppRegion': 'drag'
        }
        /*
        <Rooms data={this.props.data}/>
        <MainArea data={this.props.data}/>
        <Users data={this.props.data}/>
        */

        var mainAreaNodes = {
            rooms: <Rooms data={this.props.data}/>,
            mainArea: <MainArea className="mainarea" data={this.props.data}/>,
            users: <Users data={this.props.data}/>
        };
        var mainarea = this.props.data.view.layout.map(function(a) {
            return mainAreaNodes[a];
        });

        return (<div>
            <div className="top-btns" style={drag_area}>
            <Topic data={this.props.data}/>
            <CloseBtn/>
            <KioskBtn/>
            <MinimizeBtn/>
            </div>
            {mainarea}
            </div>
        )
    }
})
ReactDom.render( < App data={data}
        />, document.getElementById('react-root'));
data.msgListener.listener();

trigger({
  node: [document.querySelector('.left_side')],
  style: {
  right:0
  },
  affect: {
    node: document.querySelector('.MainArea'),
    style: "left",
    change: function(a, b) {
      return a - b;
    }
  }
});
trigger({
  node: [document.querySelector('.right_side')],
  style: {
  left:0
  },
  affect: {
    node: document.querySelector('.MainArea'),
    style: "right",
    change: function(a, b) {
      return b - a;
    }
  }
});
