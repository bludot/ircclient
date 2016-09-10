/**

  channel
  user
  server


**/


var userTypes = {
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
    };

class Message {
  constructor(args) {
    this.message = args.message || "";
    this.user = args.user || "";
    this.timestamp = (function(){
      return new Date();
    })();
    this.from = args.from || "";
    this.to = args.to || "";
  }
}

class User {
  constructor(args) {
    this.nick = args.nick || "";
    this.realName = args.realName || "";
    this.host = "";
    this.modes = ""
    this.code = args.code || "";
    this.type = args.type || "";
    this.color = args.color || "";
    this.code_color = args.code_color || "";
    this.order = args.order || "";
  }
  val(name) {
    return this[name];
  }

};

class Channel {
  constructor(args) {
    this.name = args.name || "";
    this.users = [];
    this.topic = args.topic || "";
    this.modes = args.modes || "";
    this.messages = [];
  }

  setModes(modes) {
    this.modes = modes;
  }

  addUser(user) {
  	if(!this.findUser(user.nick)) {
    this.users.push(user);
    }
  }

  removeUser(user) {
    this.users.splice(this.users.findIndex((e) => {
      return e.nick == user
    }), 1)
  }

  findUser(nick) {
    return this.users.find((e) => {
      return e.nick == nick
    }) || null;
  }

  setTopic(topic) {
	  this.topic = topic;
    }

  addMsg(message) {
  	this.messages.push(message);
  }

	userSort() {

            var users = this.users.sort(function(a, b) {
                var textA = a.nick.toUpperCase();
                var textB = b.nick.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
            this.users = users.sort(function(a, b) {
                if (userTypes[a.code].order > userTypes[b.code].order) {
                    return 1;
                }
                if (userTypes[a.code].order < userTypes[b.code].order) {
                    return -1;
                }
                return 0;
            });
        }

  val(name) {
    return this[name];
  }
}


class Server {
  constructor(args) {
    this.name = args.name || "";
    this.channels = [];
    this.url = "";
  }

  addChannel(channel) {
    this.channels.push(channel);
    //console.log(this.channels);
  }

  getChannel(channel) {
    return this.channels.find(function(e) {
      return e.name === channel;
    }) || null;
    //return this.channels;
    }
    removeChannel(channel) {
        var self = this;
        this.channels.splice(self.channels.findIndex((e)=> {e.nick == channel}), 1);
    }
}


module.exports = {
    Message: Message,
    Server: Server,
    Channel: Channel,
    User: User
};
