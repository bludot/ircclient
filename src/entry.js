// entry.js
var React = require('react');
var ReactDom = require('react-dom');
import { Scrollbars } from 'react-custom-scrollbars';
/*
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
        if(this.msgListener.callback) {
            this.msgListener.updateMessages(this);
            this.msgListener.updateRight(this);
            this.msgListener.updateLeft(this);
            this.msgListener.updateTopic(this);
            this.msgListener.updateNick(this);
    }
        return this;
    },

    current: {
        server: "",
        room:   "",
    },
    data: [],
    msgListener: {
        userTypes: {
            '&': {
                type:'admin',
                color: '#9879D1',//&
                order: 0
            },
            '@': {
                type: 'ops',
                color: '#C1D189',//@
                order: 1
            },
            '%': {
                type: 'halfops',
                color: '#A7B085',//%
                order: 2
            },
            '+': {
                type: 'voiced',
                color: '#00D35C',//+
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
          for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
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

                if(userTypes[user.substr(0,1)]) {
                    type = userTypes[user.substr(0,1)].type;
                    code_color = userTypes[user.substr(0,1)].color;
                    nick = user.substr(1);
                    code = user.substr(0,1);
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
                if(userTypes[a.code].order > userTypes[b.code].order) {
                return 1;
                }
                if(userTypes[a.code].order < userTypes[b.code].order) {
                return -1;
                }
                return 0;
            });
        },
        userSort: function(users) {
            var userTypes = data.msgListener.userTypes;
            return users.sort(function(a, b) {
                if(userTypes[a.code].order > userTypes[b.code].order) {
                return 1;
                }
                if(userTypes[a.code].order < userTypes[b.code].order) {
                return -1;
                }
                return 0;
            });
        },
        room: function(opt) {
            var room =  {
                    server: 	true, // true || false,
                    topic: 		"", // room topic
                    active:     true,
                    users: 		[], // users in room
                    /*{
                        type: 		'ops', // type of user in plain text
                        code_color: '#000', // color of the user status
                        nick: 		"nick", // nick of the user
                        color:      '#000', // nick color
                        code: 		'@' // symbol for the user
                    }*/

                    msgs: 		[] // messages in this room

                    /*{
                        time:   "00:00",//time stamp
                        msg: 	'msg', // message
                        from: 	'nick' // nick from which it came
                    }*/
                };
                var keys = Object.keys(room);
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    if (opt[k] !== undefined){
                        room[k] = opt[k];
                    }
                }
                return room;
        },
        server: function(opt, self) {
            var server = {
                server_url: 	"", // server url
                server_name: "", // server netowrk name
                nick: 		"", // your nick in server,
                rooms: {}
            };
                var keys = Object.keys(server);
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    if (opt[k] !== undefined){
                        server[k] = opt[k];
                    }
                }
                server.rooms[opt.server_url] = new self.room({server: opt.server});
            return server;
        },
        updateRooms: function() {
            this.updateLeft(data);
        },
        addMsg: function(server, to, msg, from, callbacks) {
            var self = this;
            var callbacks = callbacks;
            // if room doesnt exist add it
            if(!data.data[server].rooms[to]) {
                data.data[server].rooms[to] = new self.room({server: false});
                // it was a new room so update the list
                callbacks = ["updateRooms"].concat(callbacks);
            }

            // we have the room at this point, add the message
            var time = new Date();
            data.data[server].rooms[to].msgs.push({
                time: time,
                msg: msg,
                from: from
            });

            callbacks.forEach(e => self[e](data));
        },
        addUsers: function() {

        },
        notice: function(msg, server, callbacks) {
            var self = this;
            data.current.server = server;
            // create the server space in data
            data.data[server] = new self.server({server_url: server, server: true}, self);

            // set current server
            data.current.server = server;
            console.log(data.data);
            // callbacks
            callbacks.forEach(e => self[e](data));
        },
        join: function(room, nick, callbacks) {
            var self = this;
            console.log(data.data);

            if(!data.data[data.current.server].rooms[room]) {
                data.data[data.current.server].rooms[room] = new self.room({server: false}, self);
                // it was a new room so update the list
                callbacks = ["updateRooms"].concat(callbacks);
            }
            if(nick == data.data[data.current.server].rooms[room].nick) {

            } else {

            }
/*
join: obj.args[0],
nick: obj.nick,
server: obj.server
*/

            // callbacks
            callbacks.forEach(e => self[e](data));
        },
        connect: function(nick, callbacks) {
            var self = this;
            // create the server space in data
            //data.data[server] = new self.server({server_url: server, nick: nick, server: true}, self);

            // set current server
            //data.current.server = server;

            // callbacks
            //callbacks.forEach(e => self[e](data));
        },
        listener: function() {
            var self = this;
            ipcRenderer.on('client-server', function(event, arg) {
                console.log(arg); // prints "pong"
                /*var callback = self.callback;
                var updateRight = self.updateRight;
                var updateLeft = self.updateLeft;
                var parseUsers = self.parseUsers;
                var userSort = self.userSort;
                var updateTopic = self.updateTopic;
                var updateNick = self.updateNick;
                var changeRoom = self.changeRoom;*/
                if(self[arg.action]) {

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

                console.log("the color");
                console.log(_from);
                console.log(room);
                console.log(room.users);
                var color = "#aaa";
                if(room.users.length > 0) {
                    if(room.users.find(function(a) { return a.nick == _from;})) {
                        color = room.users.find(function(a) { return a.nick == _from;}).color;
                    }
                }
                console.log(color);
                var style = {color: color};
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
                return (<li key={msg.key}><time>{msg.time.toUTCString().match(/\d+?:\d.+?:\d.+?/)[0]}</time><span><span style={style}>{msg.from}</span><span>{message}</span></span></li>);
            });
        };

        var roomsNodes = function() {


            var nodes = [];
            for(var i in state_data) {
                for(var j in state_data[i].rooms) {
                    var messages = messageNodes(state_data[i].rooms[j], state_data[i].rooms[j].msgs);
                    var active = (state_data[i].rooms[j].active? "active": "");
                    nodes.push(<ul data-room={j} className={active}>{messages}</ul>);
                }
            }
            return nodes;
        };

        console.log(roomsNodes());
        console.log(this.state.data);
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
        console.log(event.keyCode);
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

            console.log("test");
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
        var nick = this.state.data.tmp_name || "nick";
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
var Left_side = React.createClass({
    getInitialState: function() {

        return {
            data: this.props.data.change()
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateLeft', this.updateHandler);
        this.props.data.msgListener.set('changeRoom', this.changeRoom);
        //
    },
    updateHandler: function(data) {
        console.log("updateLeft handler has run");
        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
    },
    changeRoom: function(room) {
        this.props.data.data[this.props.data.current.server].rooms[this.props.data.current.room].active = false;
        this.props.data.current.room = room;
        this.props.data.data[this.props.data.current.server].rooms[room].active = true;
        ipcRenderer.send('client-server', {
            action: 'irc.changeChannel',
            data: {
                room: room
            }
        });
        console.log("##########################CHANGE ROOM!");
        console.log(this.props.data);
        this.props.data.change();
        this.setState({
            data: this.props.data.change()
        });
    },
    render: function() {

        var state_data = this.props.data;
        console.log("rendering left side");
        console.log(this.props.data);
        var rooms = [];
        for(var i in state_data.data) {
              //var style = {'background': ''+user.color+''};
              for(var j in state_data.data[i].rooms[j]) {
                  var server = state_data.data[i].rooms[j].server_name;
                  var active = state_data.data[i].rooms[j].active;
                  var classname = "room_list"+ (server ? " server":"") + (active ? " active":"");
                  rooms.push(<li className={classname} data-room={j} onClick={this.changeRoom.bind(this, j)}>{state_data.data[i].rooms[room].room}</li>);
            }
        }
        console.log(rooms);
        return(<div className="left_side"><Scrollbars ref="scrollbars"><ul>{rooms}</ul></Scrollbars></div>);
    }
});
var Right_side = React.createClass({
  getInitialState: function() {

      return {
          data: this.props.data.change()
      };
  },
  componentDidMount: function() {
      this.props.data.msgListener.set('updateRight', this.updateHandler);
      //
  },
  updateHandler: function(data) {
    console.log("got data for users");
      this.setState({
          data: data
      });
      //var node = this.getDOMNode();
      //node.scrollTop = node.scrollHeight;
  },
    render: function() {
      var users = "";
      var state_data = this.props.data;
      if(this.props.data.current_room != null) {
        users = this.props.data.data[this.props.data.current_room].users.map(function(user) {
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
      console.log("got data for users");
        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
    },
    render: function() {
        var topic = (<span></span>);
        var room = (<span></span>);
        if(this.props.data.data[this.props.data.current_room]) {
            topic = (<span>{this.props.data.data[this.props.data.current_room].topic}</span>);
            room = (<span>{this.props.data.data[this.props.data.current_room].room}</span>);
        }
        return (<div className="topic">{room}{topic}</div>)
    }
});
var App = React.createClass({
    render: function() {
        var drag_area = {
            'WebkitAppRegion': 'drag'
        }
        return ( <div>
            <div className="top-btns" style={drag_area}>
            <Topic data={this.props.data}/>
            <CloseBtn/>
            <KioskBtn/>
            <MinimizeBtn/>
            </div>
            <Left_side data={this.props.data}/>
            <MainArea data={this.props.data}/>
            <Right_side data={this.props.data}/>
            </div>
        )
    }
})
ReactDom.render( < App data={data}
        />, document.getElementById('react-root'));
data.msgListener.listener();
