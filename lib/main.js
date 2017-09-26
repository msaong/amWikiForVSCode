/**
 * @desc amWiki 工作端·主模块
 * @author 耀轩之
 * @copyright 在Tevin的原基础上修改所得
 * @see {@link https://github.com/YaoXuanZhi/amWiki}
 * @license MIT - Released under the MIT license.
 */

var vscode = require('vscode');
var fs = require("fs");

/*****************************全局函数以及变量*****************************/
/**
 * @desc 定义一个所有模块都能够共用的函数
 */
confirm2 = (msg) => {
    return new Promise((resolve, reject) => {
        resolve(
            vscode.window.showWarningMessage(msg, '确定').then(function (msg) {
                return '确定' === msg;
            })
        );
    });
};

/**
 * @desc 定义一个警告函数
 */
alert = (msg) => {
    return new Promise((resolve, reject) => {
        resolve(vscode.window.showErrorMessage(msg))
    })
};

/*****************************全局函数以及变量*****************************/

//手动刷新工具
var makeNav = require('./makeNav');
// wiki创建器
var creator = require('./creator');
// wiki创建器2.0版
var creatorplus = require('./creatorplus');
//页内目录创建器
// var catalogue = require('./catalogue');
//业内目录创建器2.0版
var editorForVSCode = require('./editorForVSCode')
var pageCatalogue = require('./pageCatalogue');
//截图粘帖模块
var pasterImg = require('./pasterImg');  // 这个模块留在最后才重构
//本地服务器模块
var webServer = require('./webServer');
//项目导出模块
var exportGithub = require('./export.github');
var exportGithubPlus = require('./exportgithub');

var makeMut = require("./makeMounts")
//文件拖拽模块
// var fileDrop = require('./fileDrop');

var co = require('./co');

// 文库管理
const mngWiki = require('./manageWiki');
// 文件夹管理
const mngFolder = require('./manageFolder');

//本地服务器模块
const localServer = require('./localServer');

function activate(context) {
    var state = {};
    state.context = context;
    //文库列表记录
    state.libraryList = state.libraryList || [];
    //文库列表地址MD5，检查文库变化时创建
    state.libraryMD5 = state.libraryMD5 || {};
    //当前从资源管理器传入来的信息
    state.rescontext = {};

    state._config = null;
    state._wikis = null;
    state._getEditorPath = function () {

        const editor = editorForVSCode

        if (!editor) {
            return [false];
        }

        const grammer = editor.getGrammar();
        if (!grammer) {
            return [false, editor];
        }

        var amWikiPath = editor.getPath().replace(/\\/g, '/');
        if (amWikiPath.substr(-3) !== '.md') {
            return [false, editor, amWikiPath];
        }

        if (amWikiPath.indexOf('library') < 0) {
            return [false, editor, amWikiPath];
        }

        return [true, editor, amWikiPath];
    };

    mngWiki.linkWikis(state._wikis || {})
    //检查文库记录有效
    for (let wId in state._wikis) {
        if (state._wikis.hasOwnProperty(wId)) {
            mngWiki.checkWikiValid(wId);
        }
    }

    //转换旧版数据
    if (state.libraryList) {
        for (let i = 0, item, itemPath, itemRoot; itemPath = state.libraryList[i]; i++) {
            itemRoot = itemPath.split('library')[0];
            item = {
                id: mngWiki.createWikiId(itemRoot),
                root: itemRoot,
                path: itemPath
            };
            if (typeof state.libraryMD5[itemPath] !== 'undefined') {
                item.treeMd5 = state.libraryMD5[itemPath];
            }
            state._wikis[item.id] = item;
        }
    }

    //注册“基于当前config.json创建wiki”响应事件
    var amWikiCreateProc = vscode.commands.registerCommand('amWiki.create', function (rescontext) {
        state.rescontext = rescontext;
        // creator.create(state);

        var options = {};
        if (!state.rescontext || !state.rescontext.fsPath) {
            //假设被选中的文件已经打开
            const editor = vscode.editor || vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            options.editorPath = editor.document.fileName;
        } else {
            //假设被选中的文件没有打开
            options.editorPath = state.rescontext.fsPath;
        }

        if (options.editorPath.indexOf('config.json') < 0) {
            vscode.window.showWarningMessage('当前不是"config.json"文件！');
            return;
        }

        //获得当前extension所在目录
        var extensionPath = state.context.extensionPath;
        //找到默认文库的所在路径
        options.filesPath = extensionPath.replace(/\\/g, '/') + '/files/';

        creatorplus.create(options.editorPath, options.filesPath).then((root) => {
            if (!root) {
                return;
            }
            const wId = mngWiki.createWikiId(root);
            //添加文库
            if (typeof state._wikis[wId] === 'undefined') {
                mngWiki.addWiki(root, wId);
            }
            //文库已存在时，修改弃用标记为启用
            else {
                mngWiki.updateWikiConfig();
                state._wikis[wId].deprecated = false;
            }
            //更新导航
            makeNav.refresh(root + 'library/');
            //更新挂载数据
            makeMut.make(root, true);
        });
    });

    //注册“在当前文档上抓取h2、h3为页内目录”响应事件
    var amWikiCatalogueProc = vscode.commands.registerCommand('amWiki.catalogue', function () {
        // catalogue.make();

        const [isOnEdit, editor, editPath] = state._getEditorPath();
        if (isOnEdit) {
            mngWiki.checkAddWiki(editPath);
            pageCatalogue.make(editor);
        } else {
            alert('只有当你打开 library 文件夹下的 .md 文档时，才能提取页内目录！');
        }
    });

    // //注册“手动更新当前文库导航”响应事件
    // var amWikiMakeNavProc = vscode.commands.registerCommand('amWiki.makeNav', function () {
    //     const [isOnEdit, editor, editPath] = state._getEditorPath();
    //     if (typeof editPath !== 'undefined') {
    //         //当 isOnEdit 为 false 时，editPath 仍然不一定为根目录
    //         const root = mngFolder.isAmWiki(editPath);
    //         if (root) {
    //             mngWiki.checkAddWiki(root);
    //             makeNav.refresh(root + 'library/');
    //             return;
    //         }
    //     }
    //     alert('只有当你打开一个 amWiki 文库时，才能手动更新导航文件！');
    // });

    //注册“刷新页面挂载数据”响应事件
    var amWikiMakeMutProc = vscode.commands.registerCommand('amWiki.makeMut', function () {
        const [isOnEdit, editor, editPath] = state._getEditorPath();
        if (typeof editPath !== 'undefined') {
            //当 isOnEdit 为 false 时，editPath 仍然不一定为根目录
            const root = mngFolder.isAmWiki(editPath);
            if (root) {
                mngWiki.checkAddWiki(root);
                makeMut.make(root);
                return;
            }
        }
        alert('只有当你打开一个 amWiki 文库时，才能更新页面挂载数据！');
    });

    //注册“粘帖截图”响应事件
    var amWikiPasteImgProc = vscode.commands.registerCommand('amWiki.pasteImg', function () {
        var pasteImgObj = new pasterImg(vscode);
        pasteImgObj.PasteImgFromClipboard();
    });

    // //注册“启动node静态服务器”响应事件
    // var amWikiRunServerProc = vscode.commands.registerCommand('amWiki.runServer', function () {
    //     localServer.run(this._wikis);
    // });

    //注册“浏览打开当前页面”响应事件
    var amWikiBrowserProc = vscode.commands.registerCommand('amWiki.browser', function () {
        //保存当前更改
        vscode.workspace.saveAll(false);
        //启动本地服务器
        // webServer.run(state.libraryList);
        //更新文库导航
        // if (makeNav.update(state)) {
        //     //在浏览器中预览此文档
        //     webServer.browser(state.libraryList);
        // } else {
        //     vscode.window.showErrorMessage('更新导航失败，可能存在重复文件ID，请检查');
        // }

        const [isOnEdit, editor, editPath] = state._getEditorPath();
        if (isOnEdit) {
            const root = mngFolder.isAmWiki(editPath);
            if (root) {
                mngWiki.checkAddWiki(root);
                state._wikis = mngWiki.getWikis()
                localServer.browser(editPath, state._wikis);
            }
        } else {
            alert('您需要先打开一篇文档才能浏览！');
        }
    });

    //注册“导出项目为 github wiki”响应事件
    var amWikiExportTogitHubProc = vscode.commands.registerCommand('amWiki.exportTogitHub', function () {
        //保存当前更改
        vscode.workspace.saveAll(false);
        //将本文库以github wiki目录结构方式
        //导出到指定文件夹内
        // exportGithub.export();

        const [isOnEdit, editor, editPath] = state._getEditorPath();
        if (typeof editPath !== 'undefined') {
            const root = mngFolder.isAmWiki(editPath);
            if (root) {
                mngWiki.checkAddWiki(root);
                vscode.window.showInputBox({ placeHolder: '请输入存放github wiki的文件夹路径', ignoreFocusOut: true }).then(function (msg) {
                    console.log('当前输入的路径为：' + msg);
                    if (msg !== 'undefined') {
                        if (fs.existsSync(msg)) {
                            exportGithubPlus.export(root, msg);
                        } else {
                            alert('此文件夹路径并不存在！');
                        }
                    }
                });
                return;
            }
        }
    });

    context.subscriptions.push(amWikiCreateProc);
    context.subscriptions.push(amWikiCatalogueProc);
    context.subscriptions.push(amWikiMakeMutProc);
    // context.subscriptions.push(amWikiMakeNavProc);
    context.subscriptions.push(amWikiPasteImgProc);
    // context.subscriptions.push(amWikiRunServerProc);
    context.subscriptions.push(amWikiBrowserProc);
    context.subscriptions.push(amWikiExportTogitHubProc);
}

exports.activate = activate;
