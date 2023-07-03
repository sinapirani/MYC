import * as path from "path"
import * as fs from "fs"
import * as vscode from 'vscode';

class TokenCanceller extends vscode.CancellationTokenSource {
	constructor(token: vscode.CancellationToken){
		super()
		this.token = token
	}
}

interface DecorationPromise {
	promise: Promise<vscode.FileDecoration | null | undefined>,
	resolve: (decoration: vscode.FileDecoration | null | undefined) => void
}

class MyDecorationProvider implements vscode.FileDecorationProvider {

	private static badge: vscode.FileDecoration = {
		badge: 'CS',
		color: "#4CAF50",
		tooltip: ""
	};
	
	 decorationQueue: Map<string, DecorationPromise> = new Map()
	
	async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken,): Promise<vscode.FileDecoration | null | undefined> {

		// Check file extension
		if (!uri.path.match(/.*\.(js|ts|tsx|jsx)$/)) {
			return null
		}

		// Check if decoration is already in queue
		let decorationPromise = this.decorationQueue.get(uri.fsPath)
		if (!decorationPromise) {
			// Create new decoration promise
			decorationPromise = this.createDecorationPromise(uri.fsPath, token)
			this.decorationQueue.set(uri.fsPath, decorationPromise)
		}

		try {
			// Wait for decoration promise to resolve
			const decoration = await decorationPromise.promise
			// Remove decoration promise from queue
			this.decorationQueue.delete(uri.fsPath)
			return decoration
		} catch (error) {
			// Remove decoration promise from queue
			this.decorationQueue.delete(uri.fsPath)
			return null
		}
	}

	private createDecorationPromise(filePath: string, token: vscode.CancellationToken): DecorationPromise {
		return {
			promise: new Promise<vscode.FileDecoration | null | undefined>((resolve, reject) => {
				if (token.isCancellationRequested) {
					reject()
					return
				}

				let notFound = true
				let i = 0
				try {
					fs.readFile(filePath, (err, data) => {
						if (err) {
							reject()
							return
						}
						const string = data.toString()
						const lines = string.split('\n')

						while (notFound) {

							if (lines[i]?.length == 0 && i < lines.length-1) {
								i++
								continue
							} else if (lines[i]?.length == 0 && i >= lines.length-1) {
								resolve(null)
								return
							}
							
							notFound = false
							if (lines[i] == "'use client'" || lines[i] == '"use client"') {
								MyDecorationProvider.badge.badge = "CL"
								MyDecorationProvider.badge.tooltip = "Client Component"
								resolve(MyDecorationProvider.badge)
							} else {
								MyDecorationProvider.badge.badge = "SR"
								MyDecorationProvider.badge.tooltip = "Server Component"
								resolve(MyDecorationProvider.badge)
							}
						}
					})
				} catch (error) {
					reject()
				}
			}),
			resolve: () => {}
		}
	}
}

export function activate(context: vscode.ExtensionContext) {

	// Check if this is a Next.js project
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

	// Create decoration provider and register it
	const decorationProvider = new MyDecorationProvider();
	const disposable = vscode.window.registerFileDecorationProvider(decorationProvider)
	context.subscriptions.push(disposable);

	// Register event listener for text document changes
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		// Remove decoration promises from queue for changed files
		for (const uri of event.document.uri.fsPath) {
			decorationProvider.decorationQueue.delete(uri)
		}
	}))
}