/// <reference types="vscode" />
import * as vscode from 'vscode';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {

    const serverModule = context.asAbsolutePath(
        path.join('out', 'server', 'server.js')
    );

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'enscript' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.c')
        }
    };

    client = new LanguageClient(
        'enscriptLanguageServer',
        'Enforce Script Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'enscript' }],
    synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.c')
    },
    initializationOptions: {
        provideFormatter: true
    }
};