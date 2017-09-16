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
        this.editor = this.vscode.editor
    }

     /**
     * @desc 获得编辑器的文本内容
     * @return {string} - 返回编辑器的文本内容
     */
    getText(){
        if(!editor){
            return;
        }
        return editor.document.getText();
    }

    /**
     * @desc 在当前光标处插入文本
     * @param {string} newText - 待插入的文本
     */
    insertText(newText){
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
    }
}

module.exports = editorForVSCode;