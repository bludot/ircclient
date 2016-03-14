// entry.js
var React = require('react');
var ReactDom = require('react-dom');
import { Scrollbars } from 'react-custom-scrollbars';

var data = {
    change: function() {
        if(this.msgListener.callback) {
            this.msgListener.callback(this);
            this.msgListener.updateRight(this);
    }
        return this;
    },

    current_room: null,
    data: [],
    callback: null,
    updateRight: null,
    updateLeft: null,
    msgListener: {
        colors: {
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
        parseUsers: function(users) {
            var colors = data.msgListener.colors;
            var un_users = users.map(function(user) {
                var type = 'member';
                var color = 'transparent';
                var nick = user;
                var code = ' ';
                if(colors[user.substr(0,1)]) {
                    type = colors[user.substr(0,1)].type;
                    color = colors[user.substr(0,1)].color;
                    nick = user.substr(1);
                    code = user.substr(0,1);
                };
                return {
                    type: type,
                    color: color,
                    nick: nick,
                    code: code
                }
            });
            return un_users.sort(function(a, b) {
                if(colors[a.code].order > colors[b.code].order) {
                return 1;
                }
                if(colors[a.code].order < colors[b.code].order) {
                return -1;
                }
                return 0;
            });
        },
        userSort: function(users) {
            var colors = data.msgListener.colors;
            return users.sort(function(a, b) {
                if(colors[a.code].order > colors[b.code].order) {
                return 1;
                }
                if(colors[a.code].order < colors[b.code].order) {
                return -1;
                }
                return 0;
            });
        },
        listener: function() {

            ipcRenderer.on('client-server', function(event, arg) {
                console.log(arg); // prints "pong"
                var callback = data.msgListener.callback;
                var updateRight = data.msgListener.updateRight;
                var updateLeft = data.msgListener.updateLeft;
                var parseUsers = data.msgListener.parseUsers;
                var userSort = data.msgListener.userSort;
                var updateTopic = data.msgListener.updateTopic;
                if(arg.connect) {
                    data.tmp_name = arg.connect;
                } else if(arg.rpl_topic) {
                    data.data[data.current_room].topic = arg.rpl_topic;
                    updateTopic(data);
                } else if(arg.msg) {
                  if(!data.data[arg.room]) {
                    data.data[arg.room] = {
                        room: arg.room,
                        server: false,
                        topic: "",
                        server_name: arg.server,
                        nick: data.tmp_name,
                        users: [],
                        msgs: []
                    };
                    updateLeft(data);
                  }
                    data.data[arg.room].msgs.push({
                        msg: arg.msg,
                        from: arg.from
                    });
                    callback(data);

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
                    data.data[arg.join].users.push(arg.nick);
                    updateRight(data);
                }
            } else if(arg.quit) {
                data.data[data.current_room].msgs.push({
                    msg: arg.quit[1],
                    from: arg.quit[0]
                });
                //data.data[data.current_room].users.splice(data.data[data.current_room].users.indexOf(arg.quit[0]), 1);
                callback(data);
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
                data.data[arg.server].msgs.push({
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

            });
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
        this.props.data.msgListener.set('callback', this.updateHandler);
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
        var messageNodes = function(msgs) {
            return msgs.map(function(msg) {
                var time = new Date().getTime();
                return (<li key={msg.key}><time>{time}</time><span><span>{msg.from}</span><span>{msg.msg}</span></span></li>);
            });
        };
        var state_data = this.state.data.data;
        var roomsNodes = function() {
            console.log(state_data);

            var nodes = [];
            for(var i in state_data) {
                console.log(state_data[i]);
                var messages = messageNodes(state_data[i].msgs);
                var active = (state_data[i].active? "active": "");
                nodes.push(<ul data-room={i} className={active}>{messages}</ul>);
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
            value: ""
        };
    },
    handleInput: function(event) {
        this.setState({
            value: event.target.value
        });
        console.log(event.keyCode);
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
        var node = this.getDOMNode();
        node.value = "";
        }
        return true;
    },
    render: function() {
        return ( <input type="text" value={this.state.value} onInput={this.handleInput} onKeyUp={this.handleKeyUp}/>
        );
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
        this.props.data.data[this.props.data.current_room].active = false;
        this.props.data.current_room = room;
        this.props.data.data[room].active = true;
        ipcRenderer.send('client-server', {
            action: 'irc.changeChannel',
            data: {
                room: room
            }
        });
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
              var server = state_data.data[i].server;
              var active = state_data.data[i].active;
              var classname = "room_list"+ (server ? " server":"") + (active ? " active":"");
          rooms.push(<li className={classname} data-room={i} onClick={this.changeRoom.bind(this, i)}>{state_data.data[i].room}</li>);
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
            var style = {'background': ''+user.color+''};
        return (<li className="user_list"><span className="user_dot" style={style}></span>{user.nick}</li>);
      });
      }
        return(<div className="right_side"><Scrollbars ref="scrollbars"><ul>{users}</ul></Scrollbars></div>);
    }
});
var MainArea = React.createClass({
    render: function() {
        return(<div className="MainArea">
        <Input />
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
