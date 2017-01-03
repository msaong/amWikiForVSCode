/**
 * @desc amWiki 工作端·文件夹管理模块
 * @author Tevin
 */

var fs = require('fs');

module.exports = {
    //读取文库文件夹
    readLibraryDir: function (path, callback) {
        if (!/library(\\|\/)$/.test(path)) {
            callback('The path is not a library.');
            return;
        }

        //设置文件夹分析方式
        var browserWay = 1;

        var tree = {};
        var folders = [];
        var files = [];
        switch (browserWay) {
            case 1:
                {
                    /////////////////////原本代码/////////////////////
                    try {
                        var files1 = fs.readdirSync(path),
                            files2, files3,
                            path2, path3, path4;
                        folders.push(path);
                        //第一层，files1，library直接子级，仅允许为文件夹
                        for (var i = 0; i < files1.length; i++) {
                            path2 = path + files1[i];
                            console.log("第一层：" + path2);
                            if (/^\./.test(files1[i])) {
                                continue;
                            }
                            if (fs.statSync(path2).isDirectory(path2)) {
                                try {
                                    files2 = fs.readdirSync(path2);
                                    folders.push(path2);
                                    tree[files1[i]] = {};
                                    //第二层，files2，允许为文件夹和文件
                                    for (var j = 0; j < files2.length; j++) {
                                        path3 = path2 + '/' + files2[j];
                                        console.log("第二层：" + path3);
                                        if (/^\./.test(files2[j])) {
                                            continue;
                                        }
                                        if (fs.statSync(path3).isDirectory(path3)) {
                                            try {
                                                files3 = fs.readdirSync(path3);
                                                folders.push(path3);
                                                tree[files1[i]][files2[j]] = {};
                                                //第三层，files3，仅允许为文件夹，不再深入
                                                for (var k = 0; k < files3.length; k++) {
                                                    path4 = path3 + '/' + files3[k];
                                                    console.log("第三层：" + path4);
                                                    if (/^\./.test(files3[k])) {
                                                        continue;
                                                    }
                                                    if (!fs.statSync(path4).isDirectory(path4)) {
                                                        tree[files1[i]][files2[j]][files3[k]] = false;
                                                        files.push(path4);
                                                    }
                                                }
                                            } catch (err) {
                                                callback(err);
                                                return;
                                            }
                                        } else {
                                            tree[files1[i]][files2[j]] = false;
                                            files.push(path3);
                                        }
                                    }
                                } catch (err) {
                                    callback(err);
                                    return;
                                }
                            }
                        }
                    } catch (err) {
                        callback(err);
                        return;
                    }
                    /////////////////////原本代码/////////////////////  
                }; break;
            case 2:
                {
                    //使用递归的方式来分析文件夹
                    var dirdepth = 0;
                    browserSubFolder(dirdepth, tree, path, files, folders);
                    //注意，在这里，把“首页.md”也加了进来导致出错
                }; break;
        }
        callback(null, tree, files, folders);
    },
    //循环检查每个库
    eachLibrary: function (list, stepCallback) {
        var list2 = [];
        var path = '';
        var atomProjects = atom.project.getPaths();
        for (var i = 0; i < list.length; i++) {
            //路径缺乏library字段弃用
            if (list[i].indexOf('library') < 0) {
                continue;
            }
            path = list[i].replace(/\\/g, '/').split('library')[0] + 'library/';
            //路径不存在弃用
            if (!fs.existsSync(path)) {
                continue;
            }
            //路径重复弃用
            var pathRepeat = false;
            for (var j = 0; j < list2.length; j++) {
                if (list2[j] == list[i]) {
                    pathRepeat = true;
                    break;
                }
            }
            if (pathRepeat) {
                continue;
            }
            //如果atom已经移除此项目，弃用
            /*var pathUseful = false;
            for (var k = 0; k < atomProjects.length; k++) {
                if (atomProjects[k].replace(/\\/g, '/') + '/library/' == path) {
                    pathUseful = true;
                    break;
                }
            }
            if (!pathUseful) {
                continue;
            }*/
            //有用路径
            list2.push(path);
            stepCallback && stepCallback(list[i]);
        }
        return list2;
    },
    //判断一个文件夹是否为amWiki文库项目
    isAmWiki: function (path) {
        path = path.indexOf('library') < 0 ? path : path.split('library')[0];
        path = path.indexOf('config.json') < 0 ? path : path.split('config.json')[0];
        path = path.indexOf('index.html') < 0 ? path : path.split('index.html')[0];
        var states = [
            fs.existsSync(path + '/library/'),
            fs.existsSync(path + '/amWiki/'),
            fs.existsSync(path + '/config.json'),
            fs.existsSync(path + '/index.html')
        ];
        return states[0] && states[1] && states[2] && states[3] ? path : false;
    },
    //清空文件夹
    cleanDir: function (path) {
        var list = fs.readdirSync(path);
        var path2;
        for (var i = 0, item; item = list[i]; i++) {
            path2 = path + '/' + item;
            if (fs.statSync(path2).isDirectory(path2)) {
                if (item.indexOf('.') != 0) {  //跳过特殊文件夹
                    this.cleanDir(path2);
                    fs.rmdirSync(path2);
                }
            } else {
                fs.unlinkSync(path2);
            }
        }
    }
};

function browserSubFolder(dirdepth, tree, filepath, files, folders) {
    var subfiles = fs.readdirSync(filepath);
    folders.push(filepath);
    for (var i = 0; i < subfiles.length; i++) {
        var path2 = '';
        if (dirdepth > 0) {
            path2 = filepath + '/' + subfiles[i];
        } else {
            path2 = filepath + subfiles[i];
        }
        console.log('第 ' + (dirdepth + 1) + ' 层：' + path2);
        if (/^\./.test(subfiles[i])) {
            continue;
        }
        if (fs.statSync(path2).isDirectory(path2)) {
            try {
                tree[subfiles[i]] = {};
                var tempDepth = dirdepth + 1;
                browserSubFolder(tempDepth, tree[subfiles[i]], path2, files, folders);
            } catch (err) {
                callback(err);
                return;
            }
        } else {
            if (dirdepth > 0) {
                tree[subfiles[i]] = false;
                files.push(path2);
            }
        }
    }
}