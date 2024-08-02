import { inject, injectable } from 'inversify';
import { Uri, ViewColumn } from 'vscode';
import { ICommandManager } from '../../application/types';
import { command } from '../registration';
import { IFileCommandHandler } from '../types';
import { DiffDocProvider, decodeDiffDocUri } from '../../utils/diffDocProvider';

@injectable()
export class FileCommandHandler implements IFileCommandHandler {
    constructor(@inject(ICommandManager) private commandManager: ICommandManager) {}

    @command('git.openFileInViewer', IFileCommandHandler)
    public async openFile(uri: Uri): Promise<void> {
        if (uri.scheme === DiffDocProvider.scheme) {
            const fileCommit = decodeDiffDocUri(uri);
            await this.commandManager.executeCommand('vscode.open', Uri.file(fileCommit.file.fsPath), {
                preview: true,
                viewColumn: ViewColumn.One,
            });
        } else {
            await this.commandManager.executeCommand('vscode.open', uri);
        }
    }
}
