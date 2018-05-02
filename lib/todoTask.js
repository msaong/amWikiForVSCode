/**
 * @desc amWiki 工作端·ToDoTasks模块
 * @author 耀轩之
 * @description 参考sublime Text的PlainTasks实现，
 */

var vscode = require('vscode');

class todoBase {
    constructor() {
        // this.task_icons = ['☐', '❑', '✘', '✔']
        // this.task_icons = ['[+]', '[-]', '[x]', '[O]']
        var configuration = vscode.workspace.getConfiguration('amWiki')
        var openFlag = configuration.get("todo.open")
        var handleFlag = configuration.get("todo.handle")
        var cancelFlag = configuration.get("todo.cancel")
        var doneFlag = configuration.get("todo.done")
        this.task_icons = [openFlag, handleFlag, cancelFlag, doneFlag]
        this.task_actions = { 'open': 0, 'handle': 1, 'cancel': 2, 'done': 3 }
    }

    replaceTag(tag1st, tag2nd){
        var result = false
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return result;
        }
        editor.edit(function (editoBuilder) {
            var lineIdx = editor.selection.active.line
            var lineText = editor.document.lineAt(lineIdx).text
            var start = lineText.lastIndexOf(tag1st)
            if (start < 0)
                return result;
            var end = start + tag1st.length
            var oldSel = new vscode.Selection(lineIdx, start, lineIdx, end);
            editoBuilder.replace(oldSel, tag2nd)
            result = true
        });
        return result
    }

    insertTag(tag, after_tag_string){
        var curr_tag = this.task_icons[this.task_actions[tag]]

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return result;
        }
        editor.edit(function (editoBuilder) {
            var lineIdx = editor.selection.active.line
            var textLine = editor.document.lineAt(lineIdx)
            var lineText = textLine.text
            var start = lineText.indexOf(tag)
            if (start > 0)
                return
            editoBuilder.insert(textLine.range.start, curr_tag+after_tag_string)
        });
    }

    taskHandle(tag1st, tag2nd){
        var tempArrs = []
        for (var n=this.task_actions[tag1st]; n<this.task_actions[tag2nd]; n++){ 
            tempArrs.push([n, this.task_actions[tag2nd]])
        }
        tempArrs.push([this.task_actions[tag2nd], this.task_actions[tag1st]])

        for (var m=0; m<tempArrs.length; m++){ 
            var v = tempArrs[m]
            var oldTag = this.task_icons[v[0]]
            var newTag = this.task_icons[v[1]]
            if(this.replaceTag(oldTag, newTag))
                return
        }
    }

    openTask(){
        this.insertTag('open', ' ')
    }

    cancelTask(){
        var tag1st = 'open'
        var tag2nd = 'cancel'
        this.taskHandle(tag1st, tag2nd)
    }

    handTask(){
        var tag1st = 'open'
        var tag2nd = 'handle'
        this.taskHandle(tag1st, tag2nd)
    }

    doneTask(){
        var tag1st = 'open'
        var tag2nd = 'done'
        this.taskHandle(tag1st, tag2nd)
    }
}

module.exports = todoBase;
