import { IGitFileHistoryCommandHandler } from '../../commandHandlers/types';
import { FileCommitDetails } from '../../common/types';
import { Status } from '../../types';
import { BaseFileCommitCommand } from '../baseFileCommitCommand';

export class OpenFileCommand extends BaseFileCommitCommand {
    constructor(fileCommit: FileCommitDetails, private handler: IGitFileHistoryCommandHandler) {
        super(fileCommit);
        this.setTitle('$(eye) Open file');
        this.setCommand('git.commit.FileEntry.OpenFile');
        this.setCommandArguments([fileCommit]);
    }
    public async preExecute(): Promise<boolean> {
        return this.data.committedFile.status !== Status.Deleted;
    }
    public execute() {
        this.handler.openFile(this.data);
    }
}
