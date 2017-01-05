/**
 * @desc amWiki 工作端·创建$navigation导航文件模块
 * @author 耀轩之
 * @copyright 在Tevin的原基础上修改所得
 */

var fs = require("fs");
var directories = require('./directories');
var vscode = require('vscode');

module.exports = {
    //手动更新导航
    update: function (state, callback) {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        var grammar = editor.document.languageId;
        if (!grammar) {
            vscode.window.showInformationMessage('只有当你打开library文件夹下的文档时，才能手动更新导航文件！');
            return;
        }
        if (grammar !== 'markdown') {
            alert('只有当你打开library文件夹下的文档时，才能手动更新导航文件！');
            return;
        }
        var editorPath = editor.document.fileName;
        if (editorPath.indexOf('library') < 0 && editorPath.substr(-3) !== '.md') {
            vscode.window.showInformationMessage('只有当你打开library文件夹下的文档时，才能手动更新导航文件！');
            return;
        }
        this.refresh(editorPath, function (libPath) {
            //如果当前文库没有记录，添加记录
            var hs, i;
            i = 0;
            hs = false;
            while (i < state.libraryList.length) {
                if (state.libraryList[i] === libPath) {
                    hs = true;
                    break;
                }
                i++;
            }
            if (!hs) {
                state.libraryList.push(libPath);
                callback && callback(libPath);
            }
        });
    },
    //刷新导航（创建wiki时）
    refresh: function (editorPath, callback) {
        var that = this;
        var path = editorPath.replace(/\\/g, '/').split('library')[0] + 'library/';
        callback && callback(path);
        directories.readLibraryDir(path, function (err, tree) {
            if (err) {
                console.warn(err);
            } else {
                that.make(path, tree);
            }
        });
    },
    //创建md导航文件
    make: function (path, data) {
        if (this.hasDuplicateId(data)) {
            return;
        }
        var hsErrId = false;

        var checkId = function (name, path) {
            if (/^\d+(\.\d+)?[-_](.*?)$/.test(name)) {
                return true
            } else {
                var text = 'Error File ID!\n排序id仅允许由整数或浮点数构成，并使用连接符或下划线与具体名称相连\n' +
                    '    at path "library/' + path + '"\n' +
                    '    at file "' + name + '"';
                hsErrId = true;
                console.log(text);
                return false;
            }
        };
        var checkFileName = function (name, path) {
            if (/^\d+(\.\d+)?[-_](.*?)\.md$/.test(name)) {
                return true
            } else {
                var errText = 'Error File Name\n文件名须由 “排序id-名称.md” 格式构成\n' +
                    '    at path "library/' + path + '/"\n' +
                    '    at file "' + name + '"';
                console.log(errText);
                return false;
            }
        };
        //这里仅仅将三级内的目录的信息进行拼合，因此生成的侧边栏的数据并不包含无限级目录功能

        var markdown = '';
        markdown += '\n#### [首页](?file=首页 "返回首页")\n';

        var nDepth = 0;
        var curDir = '';

        //以递归的方式来分析文库目录结构，生成对应的目录信息
        mutilMergeForNav(function (navStr, nDepth) {
            for (var n = 0; n < nDepth; n++) {
                navStr = '   ' + navStr;
            }
            markdown += navStr;
        }, nDepth, curDir, data, checkId, checkFileName);

        if (!hsErrId) {
            console.log(markdown);
            fs.writeFileSync(path + '$navigation.md', markdown, 'utf-8');
        }
    },

    //检查重复id
    hasDuplicateId: function (data) {
        //单层检查
        var check = function (obj, path) {
            var hash = {};
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    if (!hash[name.split('-')[0]]) {
                        hash[name.split('-')[0]] = name;
                    } else {
                        var errText = 'Duplicate File ID!\n同级目录下存在重复ID：' + name.split('-')[0] + '。\n' +
                            '    at path "library/' + path + '"\n' +
                            '    at file "' + hash[name.split('-')[0]] + '"\n' +
                            '    at file "' + name + '"';
                        console.log(errText);
                        return false;
                    }
                }
            }
            return true;
        };

        var isDuplicate = false;
        //是否存在重复id
        var waryFlag = 1;
        switch (waryFlag) {
            case 1:
                {
                    // var duplicate = 'none';
                    // //第一层，library直接子级
                    // if (check(data, '')) {
                    //     for (var p1 in data) {
                    //         if (data.hasOwnProperty(p1) && data[p1]) {

                    //             //第二层，可能是文件夹也可能是文件
                    //             if (check(data[p1], p1 + '/')) {
                    //                 for (var p2 in data[p1]) {
                    //                     if (data[p1].hasOwnProperty(p2) && data[p1][p2]) {

                    //                         //第三层，只有文件
                    //                         if (!check(data[p1][p2], p1 + '/' + p2 + '/')) {
                    //                             duplicate = 'yes';
                    //                             break;
                    //                         }
                    //                     }
                    //                 }
                    //             } else {
                    //                 duplicate = 'yes';
                    //                 break;
                    //             }
                    //         }
                    //     }
                    // } else {
                    //     duplicate = 'yes';
                    // }
                    // return duplicate == 'yes';
                    // isDuplicate = duplicate == 'yes';
                }; break;
            case 2:
                {
                    //递归检测某个目录的同级文件（夹）的ID是否存在重复
                    var recuCheckID = function (nDepth, curDir, curTree) {
                        for (var dir in curTree) {
                            if (curTree.hasOwnProperty(dir) && curTree[dir]) {
                                if (!check(dir, curDir)) {
                                    return true;
                                } else {
                                    var tempDepth = nDepth + 1;
                                    var tempDir = curDir + dir + '/';
                                    return recuCheckID(tempDir, curTree[dir]);
                                }
                            }
                        }
                        return false;
                    };

                    var nDepth = 0;
                    var curDir = '';
                    isDuplicate = recuCheckID(nDepth, curDir, data);
                }; break;
        }

        if(isDuplicate)
        {
            console.log('出现了重复ID哦');
        }else{
            console.log('没有出现重复ID哦');
        }

        return isDuplicate;
    }
};

/**
 * @desc 分析目录结构树
 * @param[out] callback 专门处理回调的字符串数据
 * @param[in] nDepth 当前层级所在深度
 * @param[in] curDir 当前层级的相对Library的路径信息
 * @param[in] curTree 当前目录文件结构的树状结构
 * @param[in] checkId 此函数检测Id是否重复
 * @param[in] checkFileName 此函数检测当前文件名是否是在某个路径之下
 */
function mutilMergeForNav(callback, nDepth, curDir, curTree, checkId, checkFileName) {
    for (var dir in curTree) {
        if (curTree[dir]) {
            if (nDepth == 0) {
                if (curTree.hasOwnProperty(dir) && checkId(dir, '')) {
                    var temp = '\n##### ' + dir.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '\n';
                    callback(temp, nDepth);
                }
            } else {
                if (curTree.hasOwnProperty(dir) && checkId(dir, curDir)) {
                    var temp = '- **' + dir.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '**\n';
                    callback(temp, nDepth);
                }
            }
            var tempDepth = nDepth + 1;
            var tempDir = curDir + dir + '/';
            mutilMergeForNav(callback, tempDepth, tempDir, curTree[dir], checkId, checkFileName);
        } else {
            if (checkFileName(dir, curDir + '/')) {
                var name = dir.match(/^\d+(\.\d+)?[-_](.*?)\.md$/)[2];
                var temp = '- [' + name + '](?file=' +
                    curDir + dir.split('.md')[0] + ' "' + name + '")\n';
                callback(temp, nDepth);
            }
        }
    }
}