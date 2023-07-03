



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
	onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> | undefined;

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
					return MyDecorationProvider.badge
				} else {
					MyDecorationProvider.badge.badge = "SR"
					MyDecorationProvider.badge.tooltip = "Server Component"
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



	let fileDecorationCache: vscode.Disposable 
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
	
	let i = 0
	const saveHandler = vscode.workspace.onDidSaveTextDocument(event => {	
		console.log(i);
		
		if(fileDecorationCache)
			fileDecorationCache.dispose()
		vscode.window.showInformationMessage("hello mdf")
		fileDecorationCache = vscode.window.registerFileDecorationProvider(decorationProvider)	
		i++
	})
	let commandHandler = vscode.commands.registerCommand('mycomponent--next-js-server-or-client-component-detector.helloWorld', () => {
		vscode.window.showErrorMessage('Hello World from MYComponent: Next.js server or client component detector!');
	});	

	context.subscriptions.push(saveHandler, commandHandler)

}

export function deactivate() { }