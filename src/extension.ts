



import * as path from "path"
import * as fs from "fs"
import * as vscode from 'vscode';

class TokenCanceller extends vscode.CancellationTokenSource {
	constructor(token: vscode.CancellationToken) {
		super()
		this.token = token
	}
}
class MyDecorationProvider implements vscode.FileDecorationProvider {


	constructor(
		private readonly filename?: string,
		private fileDecorationCache?: fileDecorationCacheItem[],
		private readonly event?: vscode.TextDocument
	) { }

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


type fileDecorationCacheItem = {
	fsPath: string,
	version: number,
	decoration: vscode.Disposable
}
type fileDecorationCache = fileDecorationCacheItem[]
export async function activate(context: vscode.ExtensionContext) {

	let fileDecorationCache: fileDecorationCache = []
	let totalFileDecorationCache: Partial<fileDecorationCache> = []
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
	files.forEach(file => {
		const decorationProvider = new MyDecorationProvider(file.fsPath);
		totalFileDecorationCache.push({
			fsPath: file.fsPath,
			version: 0,
			decoration: vscode.window.registerFileDecorationProvider(decorationProvider)
		})
	})



	const saveHandler = vscode.workspace.onDidSaveTextDocument(event => {

		const decorationProvider = new MyDecorationProvider(event.uri.fsPath, fileDecorationCache, event);

		const decorationProviderIndex = fileDecorationCache.findIndex(dp => dp.fsPath == event.uri.fsPath)
		const totalFileDecorationCacheIndex = totalFileDecorationCache.findIndex(dp => dp?.fsPath == event.uri.fsPath)
		if(totalFileDecorationCacheIndex != -1){
			totalFileDecorationCache[totalFileDecorationCacheIndex]?.decoration.dispose()
			totalFileDecorationCache.splice(totalFileDecorationCacheIndex, 1)
		}
		if (decorationProviderIndex != -1 && fileDecorationCache[decorationProviderIndex].version < event.version) {
			fileDecorationCache[decorationProviderIndex].decoration.dispose()
			fileDecorationCache.splice(decorationProviderIndex, 1)
			return;
		}

		if (decorationProviderIndex == -1) {
			fileDecorationCache.push({
				fsPath: event.uri.fsPath,
				version: event.version,
				decoration: vscode.window.registerFileDecorationProvider(decorationProvider)
			})
		}
		vscode.window.showInformationMessage("hello mdf")
	})
	let commandHandler = vscode.commands.registerCommand('mycomponent--next-js-server-or-client-component-detector.helloWorld', () => {
		vscode.window.showErrorMessage('Hello World from MYComponent: Next.js server or client component detector!');
	});

	context.subscriptions.push(saveHandler, commandHandler)

}

export function deactivate() { }