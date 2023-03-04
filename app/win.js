const path = require('path')
//module.paths.push(path.join(__dirname, "mods"));
const { app, BrowserWindow, ipcMain, Menu, shell, nativeImage } = require('electron')
const { init_win } = require('./app.js')
const { format } = require('url')
const { join } = require('path')
const fs = require('fs')
const { existsSync } = require('fs')
// let json_fp = path.join(__dirname,'../','./localStorage_baidu.json');
// const log_fp = path.join(__dirname,'../','./log.log');
//require('@electron/remote/main').initialize()

function isPromiseLike (obj) {
  return (obj instanceof Promise) || (
    obj !== undefined && obj !== null && typeof obj.then === 'function' && typeof obj.catch === 'function'
  )
}


class WindowManager {
  constructor () {
    if (WindowManager._instance) {
      throw new Error('Can not create multiple WindowManager instances.')
    }
    this.windows = new Map()
  }

  createWindow (name, browerWindowOptions, url, entry) {
    if (this.windows.has(name)) {
      throw new Error(`The window named "${name}" exists.`)
    }

    if (!('icon' in browerWindowOptions)) {
      if (process.platform === 'linux') {
        const linuxIcon = join(__dirname, '../../icon/app.png')
        if (existsSync(linuxIcon)) {
          browerWindowOptions.icon = nativeImage.createFromPath(linuxIcon)
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          const iconPath = join(__dirname, `../../icon/app.${process.platform === 'win32' ? 'ico' : 'icns'}`)
          if (existsSync(iconPath)) {
            browerWindowOptions.icon = nativeImage.createFromPath(iconPath)
          }
        }
      }
    }

    let win = new BrowserWindow(browerWindowOptions)
    //
    // win.webContents.session.webRequest.onHeadersReceived({
    //     "urls": [
    //         "https://pan.baidu.com/*"
    //     ]
    // }, (details, callback)=> {
    //     let responseHeaders = details.responseHeaders;
    //     console.log(responseHeaders)
    //     let setcookie = responseHeaders["Set-Cookie"]||[];
    //     for(let i=0;i<setcookie.length;i++){
    //         setcookie[i] = (setcookie[i]+"; SameSite=None; Secure").replace(";;", ";");
    //     }
    //     callback({
    //         "cancel": false,
    //         "responseHeaders": responseHeaders
    //     });
    // });
    // win.webContents.setUserAgent("Mozilla/5.0 (iPad; CPU OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/108.0.1462.77 Version/16.0 Mobile/15E148 Safari/604.1");
    let _session = win.webContents.session;
    _session.clearCache().then(()=>{
        _session.clearStorageData().then(()=>{
            _session.flushStorageData();
            init_win(win);
        });
    });
    win.on("close", async function () {
        await _session.clearCache();
        await _session.clearStorageData();
        _session.flushStorageData();
    })
    win.on("closed", function () {
        setTimeout(()=>app.quit(), 10000);
    })
    //
    // ipcMain.on("get_localStorage",()=>{
    //   fs.readFile(json_fp,'utf-8',(err,data)=>{
    //     win.webContents.send('get_localStorage', JSON.parse(data));
    //   });
    // })
    // ipcMain.on("set_localStorage",(event,arg)=>{
    //   fs.writeFile(json_fp,arg,'utf-8',(err,data)=>{
    //     win.webContents.send('set_localStorage', 'ok');
    //   });
    // })
    /*win.webContents.executeJavaScript(`!function () {
      require('./renderer.node');
      require('${entry}');
    }()`)*/

    win.on('ready-to-show', function () {
      if (!win) return
      win.show()
      win.focus()
      win.webContents.openDevTools()
    })
    //require("@electron/remote/main").enable(win.webContents)
    //win.webContents.openDevTools()

    win.on('closed', () => {
      win = null
      this.windows.delete(name)
    })

    // click_e("baidu");

    this.windows.set(name, win)

    //win.removeMenu ? win.removeMenu() : win.setMenu(null)

    /*const res = win.loadURL(url)

    if (isPromiseLike(res)) {
      res.catch((err) => {
        console.log(err)
      })
    }*/
  }

  getWindow (name) {
    if (this.windows.has(name)) {
      return this.windows.get(name)
    }
    throw new Error(`The window named "${name} doesn't exists."`)
  }

  removeWindow (name) {
    if (!this.windows.has(name)) {
      throw new Error(`The window named "${name} doesn't exists."`)
    }
    this.windows.get(name).close()
  }

  hasWindow (name) {
    return this.windows.has(name)
  }
}

WindowManager.getInstance = function () {
  if (!WindowManager._instance) {
    WindowManager._instance = new WindowManager()
  }
  return WindowManager._instance
}

WindowManager.ID_MAIN_WINDOW = 'main-window'

WindowManager.__SECRET_KEY__ = []

WindowManager.createMainWindow = function () {
  const windowManager = WindowManager.getInstance()
  if (!windowManager.hasWindow(WindowManager.ID_MAIN_WINDOW)) {
    let debug = !true;
    const browerWindowOptions = {
      width: debug?1600:1000,
      height: 1050,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: false,
        contextIsolation: false,
        devTools: debug
      }
    }

    windowManager.createWindow(
      WindowManager.ID_MAIN_WINDOW,
      browerWindowOptions,
      format({
        pathname: join(__dirname, './index.html'),
        protocol: 'file:',
        slashes: true
      }),
      './asar.js'
    )
  }
}

module.exports = WindowManager
