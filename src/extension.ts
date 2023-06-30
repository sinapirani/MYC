



import * as path from "path"
import * as fs from "fs"
import * as vscode from 'vscode';

class TokenCanceller extends vscode.CancellationTokenSource {
	constructor(token: vscode.CancellationToken){
		super()
		this.token = token
	}
}
class MyDecorationProvider implements vscode.FileDecorationProvider {

	modified: vscode.FileDecoration | undefined
	constructor(){
		this.modified
	}
	private static badge: vscode.FileDecoration = {
		badge: 'CS',
		color: "#4CAF50",
		tooltip: ""
	};
	
	async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken,): Promise<vscode.FileDecoration | null | undefined> {


			
		if (!uri.path.match(/.*\.(js|ts|tsx|jsx)$/)) {
			return {}
		}


		let notFound = true
		let i = 0
		try {
			const data = await vscode.workspace.fs.readFile(uri)
			const string = data.toString()
			const lines = string.split('\n')

			while (notFound) {

				if (lines[i]?.length == 0 && i < lines.length-1) {
					i++
					continue
				} else if (lines[i]?.length == 0 && i >= lines.length-1) {
					return {}
				}
				
				notFound = false
				if (lines[i] == "'use client'" || lines[i] == '"use client"') {
					MyDecorationProvider.badge.badge = "CL"
					MyDecorationProvider.badge.tooltip = "Client Component"
					// const badgeIndex = this.modified.findIndex(badge => badge.badge == "CL")
					// const badgeIndex = this.modified.findIndex(file => file.path == uri.path)
					// if(badgeIndex != -1){

						// const tokenController = new TokenCanceller(this.modified[badgeIndex].token)
						// tokenController.cancel()
						// const perviousToken = new TokenCanceller(this.modified[badgeIndex].token)
						// perviousToken.cancel()
						// this.modified[badgeIndex]

						// this.modified[badgeIndex] = badge
					// }else{
					// 	this.modified.push(badge)
					// }
					return MyDecorationProvider.badge
				} else {
					MyDecorationProvider.badge.badge = "SR"
					MyDecorationProvider.badge.tooltip = "Server Component"
					// const badgeIndex = this.modified.findIndex(badge => badge.badge == "SR")
					// if(badgeIndex != -1){
						// const tokenController = new TokenCanceller(this.modified[badgeIndex].token)
						// tokenController.cancel()
						// const perviousToken = this.modified[badgeIndex].token as unknown as vscode.CancellationTokenSource
						// perviousToken.cancel()
						// this.modified[badgeIndex].token.isCancellationRequested = true
					// 	this.modified[badgeIndex] = badge
					// }else{
					// 	this.modified.push(badge)
					// }
					return MyDecorationProvider.badge
				}
				

			}
		} catch (e) {
			vscode.window.showErrorMessage("error in read file")
			console.log(e);

		}

	}
}

export function activate(context: vscode.ExtensionContext) {


	const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window?.activeTextEditor!?.document?.uri);
	let isNextProject: boolean = false
	
	if (workspaceFolder) {
	  const currentDir = workspaceFolder.uri.fsPath;
	  const nextConfigPath = path.join(currentDir, 'next.config.js');
	  const mjsPath = path.join(currentDir, '*.mjs');
	  const nextConfigExists = fs.existsSync(nextConfigPath);
	  const mjsExists = fs.existsSync(mjsPath);
	  if (nextConfigExists || mjsExists) {
		isNextProject = true
	  } else {
		isNextProject = false
	  }
	}

	const decorationProvider = new MyDecorationProvider();
	const disposable = vscode.window.registerFileDecorationProvider(decorationProvider)
	const dis2 = vscode.workspace.onDidChangeTextDocument(event => {	
		vscode.window.showInformationMessage("hello mdf")
		vscode.window.registerFileDecorationProvider(decorationProvider);
	})
	let ddd = vscode.commands.registerCommand('mycomponent--next-js-server-or-client-component-detector.helloWorld', () => {
		vscode.window.showErrorMessage('Hello World from MYComponent: Next.js server or client component detector!');
	});

	// context.subscriptions.push(disposable);
	context.subscriptions.push(dis2);
	context.subscriptions.push(ddd);
}

export function deactivate() { }
