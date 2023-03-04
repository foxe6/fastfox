const { dialog, app, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require('os');
let cur_tab = "baidu";
const cookie_fp = path.join(__dirname,'../','./cookie.json');
let json_fp = path.join(__dirname,'../','./localStorage_baidu.json');
const log_fp = path.join(__dirname,'../','./log.log');
const pixiv_captcha_response_fp = (process.platform==='win32'?os.tmpdir().replace(/\\/g, '/'):"/tmp")+"/pixiv_captcha_response.txt";
let tti;
const pixiv_load_captcha = function(win){
    win.webContents.executeJavaScript(`!function(){
    let {ipcRenderer} = require('electron');
    ipcRenderer.on('set_cookie', function(event, arg) {});
    ipcRenderer.on('get_cookie', function(event, arg) {
        let d={};
        let d2="";
        arg.map((e)=>{
            d[e.name]=e.value;
            if(d2){
                d2 += "; ";
            }
            d2+=e.name+"="+e.value;
        });
        if("device_token" in d){
            clearInterval(tti);
            console.log(arg)
            ipcRenderer.send('set_cookie', JSON.stringify(arg));
        }
    });
    let tti=setInterval(function(){
        ipcRenderer.send('get_cookie', {"url": "https://www.pixiv.net"});
    }, 1000);
}()`);
    return;
    win.webContents.executeJavaScript(`!function(){
    if(document.querySelector("div#captcha")){
        return;
    }
    let {ipcRenderer} = require('electron');
    ipcRenderer.on('get_cookie', function(event, arg) {
        let d={};
        let d2="";
        arg.map((e)=>{
            d[e.name]=e.value;
            if(d2){
                d2 += "; ";
            }
            d2+=e.name+"="+e.value;
        });
        if("device_token" in d){
            clearInterval(tti);
            let header=document.createElement('div');
            header.innerText='your pixiv cookie';
            header.style='margin: 0.5em;color:#d9d9d9';
            let div=document.createElement('div');
            div.id='showcookie';
            div.style='font-size: 2em;flex-direction:column;position: fixed; width: 100vw ; height: 100vh ; z-index: 9999999; background-color: #333; top: 0; left: 0; display: flex; justify-content: center; align-items: center;';
            let ta=document.createElement('textarea');
            ta.style='margin: 0.5em;width: 50%; height: 50%; font-family: monospace;';
            ta.innerText=d2;
            let cl=document.createElement('div');
            cl.addEventListener("click", function(){
                div.remove();
            });
            cl.innerText='[CLOSE]';
            cl.style='margin: 0.5em;background:#d9d9d9;color:#333;';
            div.appendChild(header);
            div.appendChild(ta);
            div.appendChild(cl);
            document.body.appendChild(div);
        }
    });
    let tti=setInterval(function(){
        ipcRenderer.send('get_cookie', {"url": "https://www.pixiv.net"});
    }, 1000);
    function setCaptchaLang(recaptchaContainer, lang) {
        lang = lang || "en";
        const iframeGoogleCaptcha = recaptchaContainer.querySelector('iframe');
        const currentLang = iframeGoogleCaptcha.getAttribute("src").match(/hl=(.*?)&/).pop();
        if (currentLang !== lang) {
            iframeGoogleCaptcha.setAttribute(
                "src",
                iframeGoogleCaptcha.getAttribute("src").replace(
                    /hl=(.*?)&/,
                    'hl=' + lang + '&'
                )
            );
        }
    }
    let fs = require('fs');
    let s=document.createElement('script');
    s.src='https://www.recaptcha.net/recaptcha/enterprise.js?render=explicit&hl=en';
    document.head.appendChild(s);
    s=document.createElement('style');
    s.innerText="div#captcha{z-index:999999;background:#333;border:1px solid #d9d9d9;position: fixed;bottom: 0;left: 50%;transform: translateX(-50%);display: flex;justify-content: center;align-items: center;width: 50vw;height: calc(20vh - 4em ); padding-top: 4em ;}div#captcha:before {content: 'solve captcha for batch upload';white-space: nowrap;position: absolute;top: 0;left: 50%;color: #d9d9d9;transform: translateX(-50%);font-size: 1.5em;margin-top: 1.5em;}";
    document.head.appendChild(s);
    console.log('${pixiv_captcha_response_fp}')
    let start=function(){
        s=document.createElement('div');
        s.id="captcha";
        document.body.appendChild(s);
        let ti = setInterval(function(){
            if(!window.grecaptcha){
                return;
            }
            if(!window.grecaptcha.enterprise){
                return;
            }
            if(!window.grecaptcha.enterprise.render){
                return;
            }
            clearInterval(ti);
            window.wtfbro=function(r){
                console.log(r)
                fs.writeFileSync('${pixiv_captcha_response_fp}', r);
                document.querySelector("div#captcha").remove();
                start();
            }
            grecaptcha.enterprise.render(document.querySelector("div#captcha"), {
                "sitekey":"6LejidcZAAAAAE0-BHUjuY_1yIR478OolN4akKyy",
                'theme' : 'dark',
                "callback": "wtfbro"
            });
            s=document.createElement('div');
            s.innerText='show my cookie';
            s.style='color: #d9d9d9; position: absolute; top: 0; right: 0; padding: 0.5em ; text-decoration: underline;cursor:pointer';
            s.addEventListener("click", function(){
                ipcRenderer.send('get_cookie', {"url": "https://www.pixiv.net"});
            });
            document.querySelector("div#captcha").appendChild(s);
            s=document.createElement('div');
            s.innerText='[X]';
            s.style='color: #d9d9d9; position: absolute; top: 0; left: 0; padding: 0.5em ; cursor: pointer;';
            s.addEventListener("click", function(){
                document.querySelector("div#captcha").style.display='none';
            });
            document.querySelector("div#captcha").appendChild(s);
            setCaptchaLang(document.querySelector("div#captcha"), "en");
        }, 100);
    }
    start();
}()`);
}
const click_e = function(win){
    return function (name) {
        // app.configureHostResolver({
        //     enableBuiltInResolver: process.platform==='darwin',
        //     secureDnsMode: "automatic",
        //     secureDnsServers: []
        // })
        clearInterval(tti);
        cur_tab = name;
        json_fp = path.join(__dirname,'../','./localStorage_'+name+'.json');
        let asar_fp = __dirname.replace(/\\/g,"/");
        let renderernode = asar_fp+"/renderer.node";
        let asarjs = asar_fp+"/asar.js";
        if(name==="fmy"){
            win.loadURL("https://www.feimaoyun.cf/");
        }
        else if(name==="zod"){
            win.loadURL("https://zodgame.cf/");
        }
        else if(name==="pixiv"){
            win.loadURL("https://accounts.pixiv.net/login");
            pixiv_load_captcha(win);
        }
        else{
            win.loadFile('index_'+name+'.html')
        }
        win.webContents.executeJavaScript(`!function () {
  require('${renderernode}');
  require('${asarjs}');
}()`)
        // tti = setInterval(function(){
        //     if(name==="pixiv"){
        //         try {
        //             pixiv_load_captcha(win);
        //         }
        //         catch(e){
        //             clearInterval(tti);
        //         }
        //     }
        // }, 1000);
    }
}
const menu = function(win){
    let sep = {
        label:'|',
        enabled:false
    };
    let f5 = {
        label:'　刷新　',
        click:()=>{
            click_e(win)(cur_tab);
        },
        accelerator:"F5"
    };
    let tools = [
        {
            'label':'　在线解析　',
            'submenu':[
                {
                    label:'　baidu 百度网盘　',
                    click:()=>{
                        click_e(win)("baidu");
                    }
                },
                {
                    label:'　feimaoyun 飞猫云　',
                    click:()=>{
                        click_e(win)("fmy");
                    }
                },
                {
                    label:'　terabox　',
                    click:()=>{
                        // click_e(win)("dubox");
                    }
                },
                // {
                //     label:'　pixiv 自动上传人机验证　',
                //     click:()=>{
                //         click_e(win)("pixiv");
                //     }
                // },
            ]
        },
        {
            'label':'　网站镜像　',
            'submenu':[
                {
                    label:'　zodgame　',
                    click:()=>{
                        // click_e(win)("zod");
                    }
                },
            ]
        },
    ];
    let author = {
        label:'　made by foxe6　',
        submenu:[
            {
                label:"website",
                click:()=>{
                    shell.openExternal("https://foxe6.cf")
                }
            },
            {
                label:"donate",
                click:()=>{
                    shell.openExternal("https://afdian.net/a/foxe6")
                }
            },
            {
                label:"youtube",
                click:()=>{
                    shell.openExternal("https://www.youtube.com/channel/UCIw9lp9opd0IIH_TeaRfpRw")
                }
            },
            {
                label:"bilibili",
                click:()=>{
                    shell.openExternal("https://space.bilibili.com/1746227925")
                }
            },
        ]
    };
    let sep2 = { type: 'separator' };
    let macEdit = {
      label: '　编辑　',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        sep2,
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    };
    // process.platform === 'darwin'?[tools.splice(4, 0, sep2),tools.splice(0, 0, sep2)]:null;
    tools.splice(0, 0, sep2);
    let built = [];
    if(process.platform === 'darwin'){
        built = built.concat([
            {role:"TODO", submenu:[{role:"TODO"}]},
            sep,
            macEdit,
            sep,
        ]);
    }
    built = built.concat([
        {label:"　打开工具箱　", submenu:[f5].concat(tools)},
        sep,
        author
    ]);
    return built;
}
const init_win = function(win){
    // if(new Date().getTime()/1000>=1675123200) {
    //     dialog.showMessageBox({
    //         title: "软 件 过 期",
    //         message: "软件将自动关闭"
    //     }).then(()=>app.quit());
    //     setTimeout(()=>app.quit(), 5000);
    //     return;
    // }
    app.configureHostResolver({
        enableBuiltInResolver: false,
        secureDnsMode: "secure",
        secureDnsServers: ["https://cloudflare-dns.com/dns-query"]
    })
    let m = Menu.buildFromTemplate(menu(win));
    Menu.setApplicationMenu(m)
    // fs.readFile(cookie_fp,'utf-8',(err,data)=>{
    //   JSON.parse(data).map((e)=>win.webContents.session.cookies.set(e));
    // });
    // ipcMain.on("get_cookie",(event,arg)=>{
    //   win.webContents.session.cookies.get(arg).then((data)=>{
    //     win.webContents.send('get_cookie', data);
    //   });
    // })
    // ipcMain.on("set_cookie",(event,arg)=>{
    //   fs.writeFile(cookie_fp,arg,'utf-8',(err,data)=>{
    //     win.webContents.send('set_cookie', 'ok');
    //   });
    // })
    ipcMain.on("get_localStorage",()=>{
      fs.readFile(json_fp,'utf-8',(err,data)=>{
        win.webContents.send('get_localStorage', JSON.parse(data));
      });
    })
    ipcMain.on("set_localStorage",(event,arg)=>{
      fs.writeFile(json_fp,arg,'utf-8',(err,data)=>{
        win.webContents.send('set_localStorage', 'ok');
      });
    })
    win.webContents.session.webRequest.onHeadersReceived({
        "urls": [
            "https://pan.baidu.com/*"
        ]
    }, (details, callback)=> {
        let responseHeaders = details.responseHeaders;
        // console.log(responseHeaders)
        let setcookie = responseHeaders["Set-Cookie"]||[];
        for(let i=0;i<setcookie.length;i++){
            setcookie[i] = (setcookie[i]+"; SameSite=None; Secure").replace(";;", ";");
        }
        callback({
            "cancel": false,
            "responseHeaders": responseHeaders
        });
    });
    win.webContents.setUserAgent("Mozilla/5.0 (iPad; CPU OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/108.0.1462.77 Version/16.0 Mobile/15E148 Safari/604.1");
    click_e(win)("baidu");
}


module.exports = {
    "init_win": init_win,
    // "menu": menu,
    // "json_fp": json_fp,
    // "log_fp": log_fp,
    // "click_e": click_e
}
