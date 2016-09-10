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
        channels: {
        'channel': {
                server: 	true, // true || false,
                topic: 		"topic", // channel topic
                active:     true, // true || false if the channel is currently selected
                users: 		[
                                {
                                    type: 		'ops', // type of user in plain text
                                    code_color: '#000', // color of the user status
                                    nick: 		"nick", // nick of the user
                                    color:      '#000', // nick color
                                    code: 		'@' // symbol for the user
                                }
                            ], // users in channel
                msgs: 		[
                                {
                                    time:   "00:00",//time stamp
                                    msg: 	'msg', // message
                                    from: 	'nick' // nick from which it came
                                }
                            ] // messages in this channel
            }
        }
    }
}*/
var Model = require('./model.js');


var data = {
    change: function() {
        if (this.msgListener.updateMessages) {
            this.msgListener.updateMessages(this);
            this.msgListener.updateUsers(this);
            this.msgListener.updateChannels(this);
            this.msgListener.updateTopic(this);
            this.msgListener.updateNick(this);
        }
        return this;
    },
    view: {
        layout: [
            'channels',
            'mainArea',
            'users'
        ]
    },
    current: {
        server: null,
        channel: null,
        nicks: {},
    },
    data: {},
    msgListener: {
    userTypes: {
            '~': {
                type: 'owner',
                color: '#E8BC12', //+
                order: 0
            },
            '&': {
                type: 'admin',
                color: '#9879D1', //&
                order: 1
            },
            '@': {
                type: 'ops',
                color: '#C1D189', //@
                order: 2
            },
            '%': {
                type: 'halfops',
                color: '#A7B085', //%
                order: 3
            },
            '+': {
                type: 'voiced',
                color: '#00D35C', //+
                order: 4
            },
            ' ': {
                type: 'member',
                color: 'transparent',
                order: 5
            }
        },
        hashColor: function(str) {
            for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
            for (var i = 0, colour = "#"; i < 3; colour += ("195" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
            return colour;
        },
        addUsers: function(server, channel, users, callbacks) {
            var self = this;
            var channel = channel.toLowerCase();
						var userTypes = data.msgListener.userTypes;
            var hashColor = data.msgListener.hashColor;
            		users.forEach((nick) => {
                	data.data[server].getChannel(channel).addUser(new Model.User({
                        nick: userTypes[nick.substr(0, 1)] ? nick.substr(1) : nick,
                        code: userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " ",
                        type: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].type,
                        color: hashColor(userTypes[nick.substr(0, 1)] ? nick.substr(1) : nick),
                        code_color: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].color,
                        order: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].order
                    }))
                    });
                    data.data[server].getChannel(channel).userSort();


            callbacks.forEach(e => self[e](data));
        },
        addMsg: function(server, to, msg, from, callbacks) {
            var self = this;
            var callbacks = callbacks;
            // if channel doesnt exist add it
            var to = to.toLowerCase();
            if(to == data.current.nicks[server].nick.toLowerCase()) {
                console.log("current nick match");
                to = from.toLowerCase();
            }
            if (!data.data[server].getChannel(to)) {
                console.log("channel doesnt exist");
                data.data[server].addChannel(new Model.Channel({
                    name: to
                }));
                // it was a new channel so update the list
                callbacks = ["updateChannels"].concat(callbacks);
                //self.join(to, data.current.nicks[server].nick, ["updateChannels"]);
            }

            // we have the channel at this point, add the message
            var time = new Date();
            var to = to;
            data.data[server].getChannel(to).addMsg(new Model.Message({
                message: msg,
                from: from,
                to: to,
                user: from
            }));

            callbacks.forEach(e => self[e](data));

        },
        changeChannel: function(server, channel, callbacks) {
        var self = this;
            var channel = channel.toLowerCase();
        		data.current.server = server;
            data.current.channel = channel;
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
                    type: "channel",
                    value: channel
                }
            });
            callbacks.forEach(e => self[e](data));
            return true;
            },
            part: function(nick, channel, server, callbacks) {
            console.log("quiting on client");
            console.log(nick);
            var self = this;
            var server = server;
            var channel = channel;
            console.log(server);

            if(nick == data.current.nicks[data.current.server].nick) {
                console.log("it matches");
                console.log(channel);

                var new_channel;
                for(var i in data.data[data.current.server].channels) {
                    var _channel = data.data[data.current.server].channels[i];
                    if(_channel.name != undefined && _channel.name.toLowerCase() != server.toLowerCase() && _channel.name.toLowerCase() != channel.toLowerCase()) {
                        new_channel = _channel.name;
                        data.current.channel = _channel.name;
                        console.log(_channel.name);
                        console.log(data.current.channel);
                        data.data[data.current.server].removeChannel(channel);
                        ipcRenderer.send('client-server', {
                            action: 'irc.changeChannel',
                            data: {
                                server: server,
                                channel: _channel.name
                            }
                        });
                        break;
                    }
                }

                //self.changeRoom.apply(self, [server, new_room, ['updateRooms', 'updateMessages', 'updateUsers', 'updateTopic']]);

            } else {
                console.log("RUNNING SINCE NICK DOESNT EXIST?");
                //for (var i in data.data[data.current.server].rooms) {
                    if(data.data[data.current.server].getChannel(channel).findUser(nick)) {
                        self.addMsg.apply(self, [data.current.server, channel, nick + " has left the channel: " + channel, "-", ["updateMessages"]]);
                    };
                    //data.data[data.current.server].rooms[i].users = data.data[data.current.server].rooms[i].users.filter(e => e.nick != nick);
                    data.data[data.current.server].getChannel(channel).removeUser(nick);
                //}
            }
            var callbacks = ["updateMessages", "updateUsers"];
            callbacks.forEach(e => self[e](data));
            return true;
        },
    connect: function(nick, server, callbacks) {
            var self = this;
            var server = server;
            console.log("###########\n"+server);
            if(data.data[server]) {
            	return;
            }
            data.current.server = server;
            data.current.channel = server;

            data.current.nicks[server] = {
                nick: nick
            };
            data.data[server] = new Model.Server({
              name: server,
              url: server
            });
            data.data[server].addChannel(new Model.Channel({
              	name: server
              }));
              //console.log
            /*new self.server({
                server_url: server,
                server: true
            }, self);*/

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
        setTopic: function(server, channel, topic, callbacks) {
            var self = this;
            var channel = channel.toLowerCase();
            data.data[server].getChannel(channel).setTopic(topic);
            callbacks.forEach(e => self[e](data));
        },
        notice: function(msg, server, callbacks) {
            var self = this;
						            console.log("###########\n"+server);
            // create the server space in data
            console.log(server);
            if(!data.data[server]) {
                data.data[server] = new Model.Server({
              		name: server,
              		url: server
            	});
              if(!data.data[server].getChannel(server)){
              data.data[server].addChannel(new Model.Channel({
              	name: server
              }));
              }
            }

            // set current server
            //data.current.channel = server;

            // callbacks
            callbacks.forEach(e => self[e](data));
        },
        join: function(server, channel, nick, callbacks) {
            var self = this;
            var channel = channel.toLowerCase();
                        console.log("###########\n"+server);
            if(!data.data[server].getChannel(channel)) {
                data.data[server].addChannel(new Model.Channel({
                    name: channel
                }));
                callbacks = ["updateChannels"].concat(callbacks);
        				callbacks.forEach(e => self[e](data));
				        self.changeChannel.apply(self, [server, channel, ["updateChannels"]]);
            }
            var userTypes = data.msgListener.userTypes;
            var hashColor = data.msgListener.hashColor;
            if(nick) {
                if(!data.data[server].getChannel(channel).findUser(nick)) {
                    data.data[server].getChannel(channel).addUser(new Model.User({
                        nick: userTypes[nick.substr(0, 1)] ? nick.substr(1) : nick,
                        code: userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " ",
                        type: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].type,
                        color: hashColor(userTypes[nick.substr(0, 1)] ? nick.substr(1) : nick),
                        code_color: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].color,
                        order: userTypes[userTypes[nick.substr(0, 1)] ? nick.substr(0, 1) : " "].order
                    }))
                    callbacks.forEach(e => self[e](data));
                }
            }
            data.current.server = server;
            data.current.channel = channel;
            /*
            join: obj.args[0],
            nick: obj.nick,
            server: obj.server
            */

            // callbacks

        },
    listener: function(arg) {
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
            var changeChannel = self.changeChannel;*/
            if (self[arg.action]) {
                console.log(arg.args);
                self[arg.action].apply(self, arg.args);
            }
            console.log(data);
        });
            return true;
        },
	    set: function(kind, value) {
            this[kind] = value;
        }
    }
};

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
        var channel = (<span></span>);
        if(this.state.data.current.server) {
            topic = (<span>{this.props.data.data[this.state.data.current.server].getChannel(this.state.data.current.channel).topic}</span>);
            channel = (<span>{this.state.data.current.channel}</span>);
        }
        return (<div className="topic">{channel}{topic}</div>)
    }
});

var Channels = React.createClass({
    getInitialState: function() {

        return {
            data: this.props.data.change()
        };
    },
    componentDidMount: function() {
        this.props.data.msgListener.set('updateChannels', this.updateHandler);
        //this.props.data.msgListener.set('changeChannel', this.changeChannel);
        //
    },
    updateHandler: function(data) {

        this.setState({
            data: data
        });
        //var node = this.getDOMNode();
        //node.scrollTop = node.scrollHeight;
    },

    changeChannel: function(server, channel) {
        console.log("changing channels");
        console.log(channel);
        ipcRenderer.send('client-server', {
            action: 'irc.changeChannel',
            data: {
                server: server,
                channel: channel
            }
        });
        /*this.setState({
            data: this.props.data.change()
        });
        console.log(this.state.data);*/

    },
    render: function() {

        var state_data = this.props.data;

        var channels = [];

        for(var i in state_data.data) {
            for(var j in state_data.data[i].channels) {
							var server = state_data.data[i].channels[j].name == state_data.data[i].name;
              var active = state_data.current.channel == state_data.data[i].channels[j].name;
              var classname = "channel_list"+ (server ? " server":"") + (active ? " active":"");

                  channels.push(<li className={classname} data-channel={state_data.data[i].channels[j].name} key={i+'_'+j} onClick={this.changeChannel.bind(this, i, state_data.data[i].channels[j].name)}>{state_data.data[i].channels[j].name}</li>);
            }
        }


                return(<div className="left_side"><Scrollbars ref="scrollbars"><ul>{channels}</ul></Scrollbars></div>);
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

var App = React.createClass({
    render: function() {
        var drag_area = {
            'WebkitAppRegion': 'drag'
        }
        /*
        <Channels data={this.props.data}/>
        <MainArea data={this.props.data}/>
        <Users data={this.props.data}/>
        */

        var mainAreaNodes = {
            channels: <Channels key="channels_component" data={this.props.data} key="layout_1" />,
            mainArea: <MainArea key="mainarea_component" className="mainarea" key="layout_2" data={this.props.data}/>,
            users: <Users key="users_component" data={this.props.data}/>
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
});
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

        //this.refs.scrollbars.scrollToBottom();
    },

    render: function() {
        var state_data = this.state.data.data;
        var state_data_ = this.state.data;
        var messageNodes = function(channel, msgs) {
            var channel = channel;
            return msgs.map(function(msg) {
                var _from = msg.from;

                var color = "#aaa";
                if(channel.users.length > 0) {
                    if(channel.findUser(_from)) {
                        color = channel.findUser(_from).color;
                    }
                }

                var style = {color: color};
                if(msg.message.substr(0, 12).indexOf("ACTION") != -1) {
                    msg.message = msg.message.substr(7);
                }
                var message = msg.message.split(' ').map(function(a) {
                    var tmp_nick;
                    var space = String.fromCharCode(32);
                    if(tmp_nick = channel.findUser(a)) {
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
                return (<li key={msg.key} style={from.style}><time>{msg.timestamp.toUTCString().match(/\d+?:\d.+?:\d.+?/)[0]}</time><span><span style={style}>{from.msg}</span><span>{message}</span></span></li>);
            });
        };

        var channelsNodes = function() {


            var nodes = [];
            for(var i in state_data) {
                for(var j in state_data[i].channels) {
                    var messages = messageNodes(state_data[i].channels[j], state_data[i].channels[j].messages);
                    var active = (state_data[i].channels[j].name == state_data_.current.channel ? "active": "");
                    nodes.push(<ul data-channel={state_data[i].channels[j].name} className={active}>{messages}</ul>);
                }
            }
            return nodes;
        };

        return (<div className="messages"><Scrollbars ref="scrollbars"><div>{channelsNodes()}</div></Scrollbars></div>);
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
          var users = this.state.data.data[this.state.data.current.server].channels[this.state.data.current.channel].users;
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
      if(state_data.current.channel != null && state_data.data[state_data.current.server]) {
          console.log(state_data.current.channel);
        users = state_data.data[state_data.current.server].getChannel(state_data.current.channel).users.map(function(user) {
            var parent_style = {color: user.color};
            var style = {'background': ''+user.code_color+''};
        return (<li className="user_list" key={state_data.current.server+"_"+state_data.current.channel+"_"+user.nick} style={parent_style}><span className="user_dot" style={style}></span>{user.nick}</li>);
      });
      }
//              return(<div className="right_side"><ul>{users}</ul></div>);
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

ReactDom.render(
<App data={data} />,
document.getElementById('react-root'));
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
