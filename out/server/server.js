"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const symbolTablePath = path.resolve(__dirname, '../../symbol_table.json'); // Важно: добавили '../..'
const symbolTable = JSON.parse(fs.readFileSync(symbolTablePath, 'utf8'));
for (const key in symbolTable) {
    const entry = symbolTable[key];
    symbolTable[key] = {
        parent: entry.parent || null,
        methods: entry.methods || []
    };
}
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '{', '(', '[', '"']
            }
        }
    };
});
documents.onDidChangeContent(change => {
    parseDocument(change.document);
    validateTextDocument(change.document);
    const text = change.document.getText();
    const classRegex = /\bclass\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    while ((match = classRegex.exec(text)) !== null) {
        const [, className, parentClass] = match;
        if (!symbolTable[className]) {
            symbolTable[className] = {
                parent: parentClass || null,
                methods: []
            };
        }
    }
    const methodRegex = /\b(?:static\s+)?(void|int|float|string|bool)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    for (const className in symbolTable) {
        const classBodyRegex = new RegExp(`class\\s+${className}\\s*\\{([\\s\\S]*?)\\}`, 'g');
        let bodyMatch;
        while ((bodyMatch = classBodyRegex.exec(text)) !== null) {
            let methodMatch;
            while ((methodMatch = methodRegex.exec(bodyMatch[1])) !== null) {
                const [, returnType, methodName, params] = methodMatch;
                const methodSignature = `${returnType} ${methodName}(${params})`;
                if (!symbolTable[className].methods.includes(methodSignature)) {
                    symbolTable[className].methods.push(methodSignature);
                }
            }
        }
    }
    const variableRegex = /\b(\w+)\s+(\w+)\s*;/g;
    while ((match = variableRegex.exec(text)) !== null) {
        const [, type, name] = match;
        if (symbolTable[type] && !symbolTable[name]) {
            symbolTable[name] = symbolTable[type];
        }
    }
});
function getMethodsFromInheritanceChain(className) {
    const methodsSet = new Set();
    const seenMethods = new Set();
    while (className && symbolTable[className]) {
        const currentClass = symbolTable[className];
        if (currentClass.methods && Array.isArray(currentClass.methods)) {
            currentClass.methods.forEach(method => {
                const methodSignature = method.replace(/\s+/g, '');
                if (!seenMethods.has(methodSignature)) {
                    methodsSet.add(method);
                    seenMethods.add(methodSignature);
                }
            });
        }
        className = currentClass.parent || "";
    }
    return Array.from(methodsSet).map(method => ({
        label: method,
        kind: method.startsWith('static') ? node_1.CompletionItemKind.Method : node_1.CompletionItemKind.Function,
        detail: `Method from ${className}`,
        insertText: `${method}`
    }));
}
connection.onCompletion((position) => {
    const document = documents.get(position.textDocument.uri);
    if (!document)
        return [];
    const text = document.getText();
    const offset = document.offsetAt(position.position);
    const textBeforeCursor = text.slice(0, offset);
    if (textBeforeCursor.endsWith('{')) {
        return [{
                label: '{}',
                kind: node_1.CompletionItemKind.Snippet,
                insertText: '\n\t//NewCode\n}',
                detail: 'Insert block'
            }];
    }
    if (textBeforeCursor.endsWith('(')) {
        return [{
                label: '()',
                kind: node_1.CompletionItemKind.Snippet,
                insertText: ')',
                detail: 'Insert parenthesis'
            }];
    }
    if (textBeforeCursor.endsWith('[')) {
        return [{
                label: '[]',
                kind: node_1.CompletionItemKind.Snippet,
                insertText: ']',
                detail: 'Insert brackets'
            }];
    }
    if (textBeforeCursor.endsWith('"')) {
        return [{
                label: '""',
                kind: node_1.CompletionItemKind.Snippet,
                insertText: '"',
                detail: 'Insert quotes'
            }];
    }
    const match = textBeforeCursor.match(/(\w+)\.$/);
    if (match) {
        const objectName = match[1];
        if (symbolTable[objectName]) {
            const methods = getMethodsFromInheritanceChain(objectName);
            if (methods.length > 0) {
                return methods;
            }
        }
    }
    return [];
});
connection.onCompletionResolve((item) => {
    item.documentation = `Documentation for ${item.label}`;
    return item;
});
async function validateTextDocument(textDocument) {
    const text = textDocument.getText();
    const diagnostics = [];
    let openBraces = 0;
    const lines = text.split('\n');
    lines.forEach((line, i) => {
        for (const char of line) {
            if (char === '{')
                openBraces++;
            if (char === '}')
                openBraces--;
        }
    });
    if (openBraces !== 0) {
        lines.forEach((line, i) => {
            if (line.includes('{') && !line.includes('}')) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: i, character: line.indexOf('{') },
                        end: { line: i, character: line.length }
                    },
                    message: 'Missing closing bracket',
                    source: 'enscript-lsp'
                });
            }
        });
    }
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
documents.all().forEach(document => {
    parseDocument(document);
});
documents.onDidOpen(event => {
    parseDocument(event.document);
    validateTextDocument(event.document);
});
function parseDocument(document) {
    const text = document.getText();
    for (const key in symbolTable) {
        if (!symbolTable[key].parent && symbolTable[key].methods.length === 0) {
            delete symbolTable[key];
        }
    }
    const classRegex = /\bclass\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    while ((match = classRegex.exec(text)) !== null) {
        const [, className, parentClass] = match;
        if (!symbolTable[className]) {
            symbolTable[className] = {
                parent: parentClass || null,
                methods: []
            };
        }
    }
    const methodRegex = /\b(?:static\s+)?(void|int|float|string|bool)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    for (const className in symbolTable) {
        const classBodyRegex = new RegExp(`class\\s+${className}\\s*\\{([\\s\\S]*?)\\}`, 'g');
        let bodyMatch;
        while ((bodyMatch = classBodyRegex.exec(text)) !== null) {
            let methodMatch;
            while ((methodMatch = methodRegex.exec(bodyMatch[1])) !== null) {
                const [, returnType, methodName, params] = methodMatch;
                const methodSignature = `${returnType} ${methodName}(${params})`;
                if (!symbolTable[className].methods.includes(methodSignature)) {
                    symbolTable[className].methods.push(methodSignature);
                }
            }
        }
    }
    const variableRegex = /\b(\w+)\s+(\w+)\s*;/g;
    while ((match = variableRegex.exec(text)) !== null) {
        const [, type, name] = match;
        if (symbolTable[type] && !symbolTable[name]) {
            symbolTable[name] = symbolTable[type];
        }
    }
}
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map