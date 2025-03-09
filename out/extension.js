"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
/// <reference types="vscode" />
const vscode = require("vscode");
const path = require("path");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: { module: serverModule, transport: node_1.TransportKind.ipc }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'enscript' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.c')
        }
    };
    client = new node_1.LanguageClient('enscriptLanguageServer', 'Enforce Script Language Server', serverOptions, clientOptions);
    client.start();
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'enscript' }],
    synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.c')
    },
    initializationOptions: {
        provideFormatter: true
    }
};
//# sourceMappingURL=extension.js.map