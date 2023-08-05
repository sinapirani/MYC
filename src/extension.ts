
import * as path from "path"
import * as fs from "fs"
import * as vscode from 'vscode';
import { stateManager } from "./stateManager";


class MyDecorationProvider implements vscode.FileDecorationProvider {

	
	constructor(
		private readonly filename?: string,
	) {}

	private static badge: vscode.FileDecoration = {
		badge: 'CS',
		color: "#4CAF50",
		tooltip: ""
	};

	async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken,): Promise<vscode.FileDecoration | null | undefined> {

		if (!uri.path.match(/.*\.(js|ts|tsx|jsx)$/)) {
			return {}
		}
		if (this.filename && uri.fsPath !== this.filename) {
			return undefined
		}
		let notFound = true
		let i = 0
		try {
			const data = await vscode.workspace.fs.readFile(uri)
			const string = data.toString()
			const lines = string.split('\n')

			while (notFound) {

				if (lines[i]?.length == 0 && i < lines.length - 1) {
					i++
					continue
				} else if (lines[i]?.length == 0 && i >= lines.length - 1) {
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


export async function activate(context: vscode.ExtensionContext) {


	const state = stateManager(context)
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



	const files = await vscode.workspace.findFiles("")
	for(const file of files){
		const decorationProvider = new MyDecorationProvider(file.fsPath);	
		await state.write(file.fsPath, vscode.window.registerFileDecorationProvider(decorationProvider))
	}

	const saveHandler = vscode.workspace.onDidSaveTextDocument(event => {

		const fsPath = event.uri.fsPath
		const cachedDecorator: vscode.Disposable = state.read(fsPath) as vscode.Disposable
		if(cachedDecorator){
			cachedDecorator.dispose()
		}

		const decorationProvider = new MyDecorationProvider(event.uri.fsPath);
		state.write(fsPath, vscode.window.registerFileDecorationProvider(decorationProvider))
	})
	let commandHandler = vscode.commands.registerCommand('mycomponent--next-js-server-or-client-component-detector.Scan', () => {
		if(isNextProject)
			vscode.window.showInformationMessage('Scan Completed!');
		else{
			vscode.window.showErrorMessage("This is Not Next.js project!")
		}
	});

	context.subscriptions.push(saveHandler, commandHandler)

}

export function deactivate() { }