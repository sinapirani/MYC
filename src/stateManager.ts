import * as vscode from "vscode"

export function stateManager (context: vscode.ExtensionContext) {
    return {
      read,
      write
    }
  
    function read (key: string) {
      return context.globalState.get(key)
    }
  
    async function write (key: string, value: any) {
      await context.globalState.update(key, value)
    }
}