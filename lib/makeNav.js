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
                // vscode.window.showInformationMessage(text);
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
                // vscode.window.showInformationMessage(errText);
                console.log(errText);
                return false;
            }
        };
        //这里仅仅将三级内的目录的信息进行拼合，因此生成的侧边栏的数据并不包含无限级目录功能
        var wayFlag = 1;
        switch (wayFlag) {
            case 1:
                {
                    ////////////////////////////原本代码////////////////////////////
                    var markdown = '';
                    markdown += '\n#### [首页](?file=首页 "返回首页")\n';
                    console.log('写入了文库首页信息');
                    //第一层级文件夹
                    for (var dir1 in data) {
                        if (data.hasOwnProperty(dir1) && checkId(dir1, '')) {
                            console.log("处理library目录下的文件夹或文件名，此时markdown内容为：\n" + markdown);
                            markdown += '\n##### ' + dir1.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '\n';

                            //第二层级文件夹
                            for (var dir2 in data[dir1]) {
                                if (data[dir1].hasOwnProperty(dir2) && checkId(dir2, dir1 + '/')) {
                                    //当为文件夹时
                                    if (data[dir1][dir2]) {
                                        console.log("处理二级文件夹下，此时markdown内容为：\n" + markdown);
                                        markdown += '- **' + dir2.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '**\n';

                                        //第三层级文件夹
                                        for (var dir3 in data[dir1][dir2]) {
                                            if (data[dir1][dir2].hasOwnProperty(dir3) && checkId(dir3, dir1 + '/' + dir2 + '/')) {
                                                //因为在这里已经默认将第三级目录视为纯文件目录，因此直接使用checkFileName来验证时，会出现这个问题
                                                if (checkFileName(dir3, dir1 + '/' + dir2 + '/')) {
                                                    var name2 = dir3.match(/^\d+(\.\d+)?[-_](.*?)\.md$/)[2];
                                                    console.log("处理三级文件，此时markdown内容为：\n" + markdown);
                                                    markdown += '    - [' + name2 + '](?file=' +
                                                        dir1 + '/' + dir2 + '/' + dir3.split('.md')[0] + ' "' + name2 + '")\n';
                                                }
                                            }
                                        }
                                    }
                                    //当为文件时
                                    else {
                                        if (checkFileName(dir2, dir1 + '/')) {
                                            var name = dir2.match(/^\d+(\.\d+)?[-_](.*?)\.md$/)[2];
                                            console.log("处理二级文件下，此时markdown内容为：\n" + markdown);
                                            markdown += '- [' + name + '](?file=' +
                                                dir1 + '/' + dir2.split('.md')[0] + ' "' + name + '")\n';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ////////////////////////////原本代码////////////////////////////
                }; break;
            case 2:
                {

                }; break;
        }

        /////////////////////////////////
        if (!hsErrId) {
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
                        vscode.window.showInformationMessage(errText);
                        return false;
                    }
                }
            }
            return true;
        };
        //是否存在重复id
        var duplicate = 'none';
        //第一层，library直接子级
        if (check(data, '')) {
            for (var p1 in data) {
                if (data.hasOwnProperty(p1) && data[p1]) {
                    //第二层，可能是文件夹也可能是文件
                    if (check(data[p1], p1 + '/')) {
                        for (var p2 in data[p1]) {
                            if (data[p1].hasOwnProperty(p2) && data[p1][p2]) {
                                //第三层，只有文件
                                if (!check(data[p1][p2], p1 + '/' + p2 + '/')) {
                                    duplicate = 'yes';
                                    break;
                                }
                            }
                        }
                    } else {
                        duplicate = 'yes';
                        break;
                    }
                }
            }
        } else {
            duplicate = 'yes';
        }
        return duplicate == 'yes';
    }
};

/**
 * @desc 分析目录结构树
 * @param[out] navStr 拼接在一起的nav内容
 * @param[in] ndepth 当前层级所在深度
 * @param[in] treeDir 当前目录文件结构的树状结构
 */
function mutilMergeForNav(navStr, ndepth, treeDir) {
    for (var subDir in treeDir) {
        if (subDir) {
            //如果是文件夹时
            if (ndepth == 0) {
                //假设是第一层级的话，那么直接让其定位在一起
                if (treeDir.hasOwnProperty(subDir) && checkId(subDir, '')) {
                    console.log("处理library目录下的文件夹或文件名，此时markdown内容为：\n" + navStr);
                    navStr += '\n##### ' + subDir.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '\n';
                }

            } else {
                console.log("处理二级文件夹下，此时markdown内容为：\n" + navStr);
                navStr += '- **' + subDir.match(/^\d+(\.\d+)?[-_](.*?)$/)[2] + '**\n';

            }
        } else {
            //如果是文件时
            if (checkFileName(dir2, dir1 + '/')) {
                var name = dir2.match(/^\d+(\.\d+)?[-_](.*?)\.md$/)[2];
                console.log("处理二级文件下，此时markdown内容为：\n" + navStr);
                navStr += '- [' + name + '](?file=' +
                    dir1 + '/' + dir2.split('.md')[0] + ' "' + name + '")\n';
            }
        }
        var tempdepth = ndepth + 1;
        mutilMergeForNav(navStr, tempdepth, treeDir[subDir]);
    }
}