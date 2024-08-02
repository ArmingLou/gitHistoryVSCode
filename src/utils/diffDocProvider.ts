import * as vscode from 'vscode';
import { FsUri, Hash, IGitServiceFactory } from '../types';
import { IServiceContainer } from '../ioc/types';
import path = require('path');

declare const Buffer;
/**
 * Manages providing a specific revision of a repository file for use in the Visual Studio Code Diff View.
 */
export class DiffDocProvider implements vscode.TextDocumentContentProvider {
    public static scheme = 'git-history';
    private readonly onDidChangeEventEmitter = new vscode.EventEmitter<vscode.Uri>();
    private serviceContainer: IServiceContainer;

    /**
     * Creates the Git Graph Diff Document Provider.
     * @param dataSource The Git Graph DataSource instance.
     */
    constructor(serviceContainer: IServiceContainer) {
        this.serviceContainer = serviceContainer;
    }

    /**
     * An event to signal a resource has changed.
     */
    get onDidChange() {
        return this.onDidChangeEventEmitter.event;
    }

    /**
     * Provides the content of a text document at a specific Git revision.
     * @param uri The `git-history://file.ext?encoded-data` URI.
     * @returns The content of the text document.
     */
    public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        const request = decodeDiffDocUri(uri);
        return this.serviceContainer
            .get<IGitServiceFactory>(IGitServiceFactory)
            .createGitService(request.workspaceFolder)
            .then(gitService =>
                gitService
                    .getCommitFile(request.hash.full, request.file)
                    .then(tempFile =>
                        vscode.workspace.fs.readFile(tempFile).then(data => Buffer.from(data).toString('utf8')),
                    ),
            );
    }
}

/* Encoding and decoding URI's */

/**
 * Represents the data passed through `git-history://file.ext?encoded-data` URI's by the DiffDocProvider.
 */
export type DiffDocUriData = {
    hash: Hash;
    file: FsUri;
    workspaceFolder: string;
};

/**
 * Produce the URI of a file to be used in the Visual Studio Diff View.
 * @param repo The repository the file is within.
 * @param filePath The path of the file.
 * @param commit The commit hash specifying the revision of the file.
 * @param type The Git file status of the change.
 * @param diffSide The side of the Diff View that this URI will be displayed on.
 * @returns A URI of the form `git-history://file.ext?encoded-data` or `file://path/file.ext`
 */
export function encodeDiffDocUri(nodeOrFileCommit: DiffDocUriData): vscode.Uri {
    // let extension = '';
    // const extIndex = nodeOrFileCommit.file.fsPath.indexOf('.', nodeOrFileCommit.file.fsPath.lastIndexOf('/') + 1);
    // extension = extIndex > -1 ? nodeOrFileCommit.file.fsPath.substring(extIndex) : '';

    const leftFileName = path.basename(nodeOrFileCommit.file.fsPath);

    return vscode.Uri.file('(' + nodeOrFileCommit.hash.short + ')' + leftFileName).with({
        scheme: DiffDocProvider.scheme,
        query: Buffer.from(JSON.stringify(nodeOrFileCommit)).toString('base64'),
    });
}

/**
 * Decode the data from a `git-history://file.ext?encoded-data` URI.
 * @param uri The URI to decode data from.
 * @returns The decoded DiffDocUriData.
 */
export function decodeDiffDocUri(uri: vscode.Uri): DiffDocUriData {
    return JSON.parse(Buffer.from(uri.query, 'base64').toString());
}
