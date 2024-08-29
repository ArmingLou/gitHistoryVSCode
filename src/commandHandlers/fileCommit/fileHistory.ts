import { inject, injectable } from 'inversify';
import * as path from 'path';
import { Uri, ViewColumn } from 'vscode';
import { IApplicationShell } from '../../application/types';
import { ICommandManager } from '../../application/types/commandManager';
import { CompareFileCommitDetails, FileCommitDetails } from '../../common/types';
import { IServiceContainer } from '../../ioc/types';
import { FileNode } from '../../nodes/types';
import { Hash, IGitServiceFactory, Status } from '../../types';
import { command } from '../registration';
import { IGitFileHistoryCommandHandler } from '../types';
import { encodeDiffDocUri } from '../../utils/diffDocProvider';
import { IFileSystem } from '../../platform/types';

@injectable()
export class GitFileHistoryCommandHandler implements IGitFileHistoryCommandHandler {
    constructor(
        @inject(IServiceContainer) private serviceContainer: IServiceContainer,
        @inject(ICommandManager) private commandManager: ICommandManager,
        @inject(IApplicationShell) private applicationShell: IApplicationShell,
        @inject(IFileSystem) private fileSystem: IFileSystem,
    ) {}

    @command('git.commit.FileEntry.OpenFile', IGitFileHistoryCommandHandler)
    public async openFile(nodeOrFileCommit: FileNode | FileCommitDetails): Promise<void> {
        const fileCommit = nodeOrFileCommit instanceof FileCommitDetails ? nodeOrFileCommit : nodeOrFileCommit.data!;

        let tmpFile = Uri.file(fileCommit.committedFile.uri.fsPath);
        if (!fileCommit.committedFile.uri.fsPath) {
            tmpFile = Uri.file(fileCommit.workspaceFolder);
        }
        // await this.commandManager.executeCommand('git.openFileInViewer', tmpFile);
        await this.commandManager.executeCommand(
            'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
            tmpFile,
            { preview: true, viewColumn: ViewColumn.One },
        );
    }

    @command('git.commit.FileEntry.ViewFileContents', IGitFileHistoryCommandHandler)
    public async viewFile(nodeOrFileCommit: FileNode | FileCommitDetails): Promise<void> {
        const fileCommit = nodeOrFileCommit instanceof FileCommitDetails ? nodeOrFileCommit : nodeOrFileCommit.data!;
        // const gitService = await this.serviceContainer
        //     .get<IGitServiceFactory>(IGitServiceFactory)
        //     .createGitService(fileCommit.workspaceFolder);
        const current = encodeDiffDocUri({
            hash: fileCommit.logEntry.hash,
            file: fileCommit.committedFile.uri,
            workspaceFolder: fileCommit.workspaceFolder,
            status: fileCommit.committedFile.status,
        });
        // if (fileCommit.committedFile.status === Status.Deleted) {
        //     return this.applicationShell.showErrorMessage('File cannot be viewed as it was deleted').then(() => void 0);
        //     current = Uri.file(fileCommit.workspaceFolder);
        // }

        // const tmpFile = await gitService.getCommitFile(fileCommit.logEntry.hash.full, fileCommit.committedFile.uri);
        // await this.commandManager.executeCommand('git.openFileInViewer', tmpFile);
        // await this.commandManager.executeCommand(
        //     'previewHtml',
        //     '',
        //     ViewColumn.One,
        //     '',
        //     '/' + 'git.openFileInViewer', //特殊处理，在原来的 layout 执行 vscode.diff
        //     tmpFile,
        // );
        // await this.commandManager.executeCommand(
        //     'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
        //     tmpFile,
        //     { preview: true, viewColumn: ViewColumn.One },
        // );
        await this.commandManager.executeCommand(
            'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
            current,
            { preview: true, viewColumn: ViewColumn.One },
        );
    }

    @command('git.commit.FileEntry.CompareAgainstWorkspace', IGitFileHistoryCommandHandler)
    public async compareFileWithWorkspace(nodeOrFileCommit: FileNode | FileCommitDetails): Promise<void> {
        const fileCommit = nodeOrFileCommit instanceof FileCommitDetails ? nodeOrFileCommit : nodeOrFileCommit.data!;
        // const gitService = await this.serviceContainer
        //     .get<IGitServiceFactory>(IGitServiceFactory)
        //     .createGitService(fileCommit.workspaceFolder);
        const currentUri = encodeDiffDocUri({
            hash: fileCommit.logEntry.hash,
            file: fileCommit.committedFile.uri,
            workspaceFolder: fileCommit.workspaceFolder,
            status: fileCommit.committedFile.status,
            specialPath: fileCommit.committedFile.uri.fsPath,
        });
        let wspUri = Uri.file(fileCommit.committedFile.uri.fsPath);

        // if (fileCommit.committedFile.status === Status.Deleted) {
        //     return this.applicationShell
        //         .showErrorMessage('File cannot be compared with, as it was deleted')
        //         .then(() => void 0);
        //     currentUri = Uri.file(fileCommit.workspaceFolder);
        // }
        if (!(await this.fileSystem.fileExistsAsync(fileCommit.committedFile.uri.fsPath))) {
            // return this.applicationShell
            //     .showErrorMessage('Corresponding workspace file does not exist')
            //     .then(() => void 0);
            wspUri = encodeDiffDocUri({
                hash: { full: '', short: '' },
                file: fileCommit.committedFile.uri,
                workspaceFolder: fileCommit.workspaceFolder,
                status: Status.Deleted, // 令其返回空文档
                specialPath: fileCommit.committedFile.uri.fsPath,
            });
        }

        // const tmpFile = await gitService.getCommitFile(fileCommit.logEntry.hash.full, fileCommit.committedFile.uri);
        const fileName = path.basename(fileCommit.committedFile.uri.path);
        const title = `${fileName} (${fileCommit.logEntry.hash.short} ↔ Working File)`;
        // await this.commandManager.executeCommand(
        //     'vscode.diff',
        //     Uri.file(tmpFile.fsPath),
        //     Uri.file(fileCommit.committedFile.uri.path),
        //     title,
        //     { preview: true },
        // );
        // await this.commandManager.executeCommand(
        //     'previewHtml',
        //     '',
        //     ViewColumn.One,
        //     '',
        //     '/' + 'vscode.diff', //特殊处理，在原来的 layout 执行 vscode.diff
        //     Uri.file(tmpFile.fsPath),
        //     Uri.file(fileCommit.committedFile.uri.path),
        //     title,
        //     { preview: true },
        // );
        // await this.commandManager.executeCommand(
        //     'vscode.diff',
        //     Uri.file(tmpFile.fsPath),
        //     Uri.file(fileCommit.committedFile.uri.path),
        //     title,
        //     {
        //         preview: true,
        //         viewColumn: ViewColumn.One,
        //     },
        // );
        await this.commandManager.executeCommand('vscode.diff', currentUri, wspUri, title, {
            preview: true,
            viewColumn: ViewColumn.One,
        });
    }

    @command('git.commit.FileEntry.CompareAgainstPrevious', IGitFileHistoryCommandHandler)
    public async compareFileWithPrevious(nodeOrFileCommit: FileNode | FileCommitDetails): Promise<void> {
        const fileCommit = nodeOrFileCommit instanceof FileCommitDetails ? nodeOrFileCommit : nodeOrFileCommit.data!;

        const currentUri = encodeDiffDocUri({
            hash: fileCommit.logEntry.hash,
            file: fileCommit.committedFile.uri,
            workspaceFolder: fileCommit.workspaceFolder,
            status: fileCommit.committedFile.status,
            specialPath: fileCommit.committedFile.uri.fsPath,
        });
        let previewUri = Uri.file(fileCommit.committedFile.uri.fsPath);
        let title = '';

        // if (fileCommit.committedFile.status === Status.Renamed) {
        //     // 仅移动或改文件名了
        //     fileCommit.committedFile.uri.scheme = 'error'; // 令其返回打开文档显示错误信息
        //     fileCommit.committedFile.uri.fragment = 'This revision was only moved or renamed';
        //     currentUri = encodeDiffDocUri({
        //         hash: fileCommit.logEntry.hash,
        //         file: fileCommit.committedFile.uri,
        //         workspaceFolder: fileCommit.workspaceFolder,
        //         status: fileCommit.committedFile.status,
        //     });
        //     await this.commandManager.executeCommand(
        //         'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
        //         currentUri,
        //         { preview: true, viewColumn: ViewColumn.One },
        //     );
        //     return;
        // }

        // if (fileCommit.committedFile.status === Status.Deleted) {
        //     return this.applicationShell
        //         .showErrorMessage('File cannot be compared with, as it was deleted')
        //         .then(() => void 0);
        //     currentUri = Uri.file(fileCommit.workspaceFolder);
        // }
        if (fileCommit.committedFile.status === Status.Added) {
            previewUri = encodeDiffDocUri({
                hash: { full: '', short: '' },
                file: fileCommit.committedFile.uri,
                workspaceFolder: fileCommit.workspaceFolder,
                status: Status.Deleted, // 令其返回空文档
                specialPath: fileCommit.committedFile.uri.fsPath,
            });

            const leftFileName = path.basename(fileCommit.committedFile.uri.fsPath);
            title = `${leftFileName} (Added in ${fileCommit.logEntry.hash.short})`;

            // await this.commandManager.executeCommand(
            //     'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
            //     currentUri,
            //     { preview: true, viewColumn: ViewColumn.One },
            // );
            // return this.applicationShell
            //     .showErrorMessage('File cannot be compared with previous, as this is a new file')
            //     .then(() => void 0);
        } else if (fileCommit.committedFile.status === Status.Renamed) {
            const leftFileName = path.basename(fileCommit.committedFile.uri.fsPath);
            previewUri = encodeDiffDocUri({
                hash: fileCommit.logEntry.hash,
                file: fileCommit.committedFile.uri,
                workspaceFolder: fileCommit.workspaceFolder,
                status: Status.Modified,
                specialPath: fileCommit.committedFile.uri.fsPath,
            });

            title = `${leftFileName} (Renamed in ${fileCommit.logEntry.hash.short})`;
        } else {
            // const tmpFile = await gitService.getCommitFile(fileCommit.logEntry.hash.full, fileCommit.committedFile.uri);
            const gitService = await this.serviceContainer
                .get<IGitServiceFactory>(IGitServiceFactory)
                .createGitService(fileCommit.workspaceFolder);
            const previousCommitHash = await gitService.getPreviousCommitHashForFile(
                fileCommit.logEntry.hash.full,
                fileCommit.committedFile.uri,
            );

            const previousFile = fileCommit.committedFile.oldUri
                ? fileCommit.committedFile.oldUri
                : fileCommit.committedFile.uri;
            // const previousTmpFile = await gitService.getCommitFile(previousCommitHash.full, previousFile);

            previewUri = encodeDiffDocUri({
                hash: previousCommitHash,
                file: previousFile,
                workspaceFolder: fileCommit.workspaceFolder,
                status: Status.Modified,
                specialPath: fileCommit.committedFile.uri.fsPath,
            });

            title = this.getComparisonTitle(
                { file: Uri.file(previousFile.fsPath), hash: previousCommitHash },
                { file: Uri.file(fileCommit.committedFile.uri.fsPath), hash: fileCommit.logEntry.hash },
            );
        }

        // await this.commandManager.executeCommand('vscode.diff', previousTmpFile, tmpFile, title, { preview: true });
        // await this.commandManager.executeCommand(
        //     'previewHtml',
        //     '',
        //     ViewColumn.One,
        //     '',
        //     '/' + 'vscode.diff', //特殊处理，在原来的 layout 执行 vscode.diff
        //     previousTmpFile,
        //     tmpFile,
        //     title,
        //     { preview: true },
        // );
        await this.commandManager.executeCommand('vscode.diff', previewUri, currentUri, title, {
            preview: true,
            viewColumn: ViewColumn.One,
        });
        // await this.commandManager.executeCommand('vscode.diff', previousTmpFile, tmpFile, title, {
        //     preview: true,
        //     viewColumn: ViewColumn.One,
        // });
    }
    @command('git.commit.FileEntry.ViewPreviousFileContents', IGitFileHistoryCommandHandler)
    public async viewPreviousFile(nodeOrFileCommit: FileNode | FileCommitDetails): Promise<void> {
        const fileCommit = nodeOrFileCommit instanceof FileCommitDetails ? nodeOrFileCommit : nodeOrFileCommit.data!;
        const gitService = await this.serviceContainer
            .get<IGitServiceFactory>(IGitServiceFactory)
            .createGitService(fileCommit.workspaceFolder);

        if (fileCommit.committedFile.status === Status.Added) {
            return this.applicationShell
                .showErrorMessage('Previous version of the file cannot be opened, as this is a new file')
                .then(() => void 0);
        }

        const previousCommitHash = await gitService.getPreviousCommitHashForFile(
            fileCommit.logEntry.hash.full,
            fileCommit.committedFile.uri,
        );

        const previousFile = fileCommit.committedFile.oldUri
            ? fileCommit.committedFile.oldUri
            : fileCommit.committedFile.uri;
        // const previousTmpFile = await gitService.getCommitFile(previousCommitHash.full, previousFile);

        // await this.commandManager.executeCommand('git.openFileInViewer', Uri.file(previousTmpFile.fsPath));
        await this.commandManager.executeCommand(
            'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
            encodeDiffDocUri({
                hash: previousCommitHash,
                file: previousFile,
                workspaceFolder: fileCommit.workspaceFolder,
                status: Status.Modified,
            }),
            { preview: true, viewColumn: ViewColumn.One },
        );
        // await this.commandManager.executeCommand(
        //     'vscode.open', //特殊处理，在原来的 layout 执行 vscode.open
        //     Uri.file(previousTmpFile.fsPath),
        //     { preview: true, viewColumn: ViewColumn.One },
        // );
    }
    @command('git.commit.compare.file.compare', IGitFileHistoryCommandHandler)
    public async compareFileAcrossCommits(fileCommit: CompareFileCommitDetails): Promise<void> {
        const gitService = await this.serviceContainer
            .get<IGitServiceFactory>(IGitServiceFactory)
            .createGitService(fileCommit.workspaceFolder);

        if (fileCommit.committedFile.status === Status.Deleted) {
            return this.applicationShell
                .showErrorMessage('File cannot be compared with, as it was deleted')
                .then(() => void 0);
        }
        if (fileCommit.committedFile.status === Status.Added) {
            return this.applicationShell
                .showErrorMessage('File cannot be compared, as this is a new file')
                .then(() => void 0);
        }

        const leftFilePromise = gitService.getCommitFile(fileCommit.logEntry.hash.full, fileCommit.committedFile.uri);
        const rightFilePromise = gitService.getCommitFile(
            fileCommit.rightCommit.logEntry.hash.full,
            fileCommit.committedFile.uri,
        );

        const [leftFile, rightFile] = await Promise.all([leftFilePromise, rightFilePromise]);

        const title = this.getComparisonTitle(
            { file: Uri.file(fileCommit.committedFile.uri.path), hash: fileCommit.logEntry.hash },
            { file: Uri.file(fileCommit.committedFile.uri.path), hash: fileCommit.rightCommit.logEntry.hash },
        );

        await this.commandManager.executeCommand('vscode.diff', leftFile, rightFile, title, {
            preview: true,
            viewColumn: ViewColumn.One,
        });
    }
    private getComparisonTitle(left: { file: Uri; hash: Hash }, right: { file: Uri; hash: Hash }) {
        const leftFileName = path.basename(left.file.fsPath);
        const rightFileName = path.basename(right.file.fsPath);
        if (leftFileName === rightFileName) {
            return `${leftFileName} (${left.hash.short} ↔ ${right.hash.short})`;
        } else {
            return `${leftFileName} (${left.hash.short} ↔ ${rightFileName} ${right.hash.short})`;
        }
    }
}
