'use strict';
// main.js

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

//require('crash-reporter').start();
var irc_api = require('./irc_api');


let mainWindow;
const dialog = require('electron').dialog;


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 600, fullscreenable: true, frame: false, kiosk: false});
//irc_api.start('irc.freenode.net', 'ircclient_', 'ircclient_', ['#blubot_test'], mainWindow);
//irc_api.start('irc.freenode.net', 'test_client', 'test_client', ['#blubot_test'], mainWindow);
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.webContents.on('devtools-opened', function() {
      //this.closeDevTools();
  })
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  //dialog.showMessageBox({buttons:["cancel", "ok"],type:"info", message:"some message"})
mainWindow.setMovable(true);

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


var actions = {
    win: {
        close: function() {
            mainWindow.close();
        },
        minimize: function() {
            mainWindow.minimize();
        },
        setKiosk: function() {
            mainWindow.setKiosk(!mainWindow.isKiosk())
        }
    },
    irc: {

        connect: function(data) {
            //irc_api.start('irc.freenode.net', 'test_client', 'test_client', ['#blubot_test'], mainWindow);
            //irc_api.start(data.server, data.userName, data.userName, data.channels, mainWindow);
            data.webContents = mainWindow;
            irc_api.connect(data);
        },
        send: function(data) {
            console.log("#################\n Called send!");
            irc_api.say(data.msg);

        },
        quit: function(data) {
            irc_api.quit(data);
        },
        set: function(data) {
            irc_api.set(data.type, data.value);
        },
        changeChannel: function(data) {

            irc_api.changeChannel(data.server, data.channel);
        }
    }
};
const ipcMain = require('electron').ipcMain;
ipcMain.on('client-server', function(event, arg) {

  (arg.action.split(".").reduce(function(o, x) { return o[x] }, actions))(arg.data);
  //event.sender.send('client-server', 'pong');
});
