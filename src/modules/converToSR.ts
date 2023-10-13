import * as vscode from 'vscode';
import * as fs from 'fs';
import { _Patterns } from '../patterns';


export function convertToSR(context: vscode.ExtensionContext){
    let disposable = vscode.commands.registerCommand('mycomponent--next-js-server-or-client-component-detector.ConvertToSR', function (uri) {
        vscode.window.showInformationMessage('Changing the file...');
        
        const filePath = uri._fsPath;
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            vscode.window.showErrorMessage('Error reading the file.');
            return;
          }

          let isCL = false;
          let isSR = false;        
          let currentLine: string;
          const lines = data.split('\n');
          let find = false;
          let i=0;
          while(i < lines.length && find === false){
            currentLine = lines[i];
            if(currentLine){
                if(currentLine.match(_Patterns.CL)){           
                    isCL = true;
                }else if(currentLine.match(_Patterns.SR)){         
                    isSR = true;
                }
                find = true;
            }
            i++;        
          }
          
          if(isCL){
              const modifiedContent = `'use server';\n` + data.replace(_Patterns.CL, '');
              fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
                  if (err) {
                      vscode.window.showErrorMessage('Error writing to the file.');
                  } else {
                      vscode.window.showInformationMessage('File has been modified.');
                  }
              });
            }else if(isSR){
                vscode.window.showInformationMessage(`This file is already using 'use server' and doesn't require changes.`);
                return;            
            }else{
                const modifiedContent = `'use server';\n` + data.replace(_Patterns.CL, '');
                fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
                    if (err) {
                        vscode.window.showErrorMessage('Error writing to the file.');
                    } else {
                        vscode.window.showInformationMessage('File has been modified.');
                    }
                });
            }
        });
      });
    
      context.subscriptions.push(disposable);
}
