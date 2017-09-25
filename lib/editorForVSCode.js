/**
 * @desc VSCode的editor对象的二次封装(为了兼容Atom的接口)
 * @author 耀轩之
 */
class editorForVSCode {
     /**
     * @desc 初始化类实例
     * @param {Object} vscode - VSCode对象 
     * @return {undefined} - 无返回值 
     */
     constructor(_vscode) {
        this.vscode = _vscode;
        this.editor = this.vscode.window.activeTextEditor;
    }

     /**
     * @desc 获得编辑器的文本内容
     * @return {string} - 返回编辑器的文本内容
     */
    getText(){
        if(!this.editor){
            return;
        }
        return this.editor.document.getText();
    }

    /**
     * @desc 在当前光标处插入文本
     * @param {string} newText - 待插入的文本
     */
    insertText(newText){
         if (!this.editor) {
            return;
        }
        //将所得文本插入到当前光标处
        this.editor.edit(function (editoBuilder) {
            editoBuilder.delete(this.editor.selection);
        }).then(function () {
            this.editor.edit(function (editoBuilder) {
                editoBuilder.insert(this.editor.selection.start, newText);
            });
        });
    }

    getGrammar(){
        if (!this.editor){
            return;
        }
        // var grammar = editor.document.languageId;
        // if (!grammar) {
        //     vscode.window.showInformationMessage('只有当你打开library文件夹下的文档时，才能手动更新导航文件！');
        //     return;
        // }

        // if (grammar !== 'markdown') {
        //     vscode.window.showInformationMessage('只有当你打开library文件夹下的文档时，才能手动更新导航文件！');
        //     return false;
        // }
        // return editor.getGrammar();
        return this.editor.document.languageId;
    }

    getPath(){
       return this.vscode.workspace.rootPath;
    }
}

module.exports = editorForVSCode;