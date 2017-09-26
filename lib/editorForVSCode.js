/**
 * @desc VSCode的editor对象的二次封装(为了兼容Atom的接口)
 * @author 耀轩之
 */

var vscode = require('vscode');

const editorForVSCode = (function () {
    return {

        /**
        * @desc 获得编辑器的文本内容
        * @return {string} - 返回编辑器的文本内容
        */
        getText: function () {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            return editor.document.getText();
        },

        /**
         * @desc 在当前光标处插入文本
         * @param {string} newText - 待插入的文本
         * @return {undefined} - 无返回值 
         */
        insertText: function (newText) {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            //将所得文本插入到当前光标处
            editor.edit(function (editoBuilder) {
                editoBuilder.delete(editor.selection);
            }).then(function () {
                editor.edit(function (editoBuilder) {
                    editoBuilder.insert(editor.selection.start, newText);
                });
            });
        },

        /**
         * @desc 获取当前活动文件的文件类型
         * @return {number} - 返回检测到的文件类型Id
         */
        getGrammar: function () {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            return editor.document.languageId;
        },

        /**
         * @desc 获取当前活动文件的所在路径
         * @return {string} - 返回文件路径
         */
        getPath: function () {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            return editor.document.fileName;
        }
    }
})();

module.exports = editorForVSCode;