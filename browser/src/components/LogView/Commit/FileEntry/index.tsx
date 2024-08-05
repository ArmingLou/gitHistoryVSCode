import { CommittedFile, Status } from '../../../../definitions';
import * as React from 'react';
import { GoEye, GoGitCompare, GoHistory, GoFile } from 'react-icons/go';

interface FileEntryProps {
    current: boolean;
    lastRelativePath: string;
    committedFile: CommittedFile;
    theme: string;
    onAction: (CommittedFile, string) => void;
}

// let timer: any = null;
const TotalDiffBlocks = 5;
export class FileEntry extends React.Component<FileEntryProps> {
    state = {
        flg: false, // 控制 按钮的 hover 效果
    };
    constructor(props: FileEntryProps) {
        super(props);
        this.state = {
            flg: false, // 控制 按钮的 hover 效果
        };
        // const [isHover, setIsHover] = React.useState(false);
    }
    // 显示
    show = (e: any) => {
        this.setState({
            flg: true,
        });
        // this.setIsHover(true);
    };
    // 隐藏
    hide = () => {
        this.setState({
            flg: false,
        });
        // timer = setTimeout(() => {
        //     this.setState({
        //         flg: false,
        //     });
        //     timer = null;
        // }, 200);
    };
    // 按钮鼠标移入
    mouseenter = (e: any) => {
        e.stopPropagation();
        // if (timer) {
        //     clearTimeout(timer);
        //     timer = null;
        // } else {
        //     this.show(e);
        // }
        this.show(e);
    };
    // 按钮鼠标移出
    mouseleave = (e: any) => {
        e.stopPropagation();
        // const { flg } = this.state;
        // if (flg) {
        //     this.hide();
        // }
        this.hide();
    };
    renderStatus() {
        let icon = '';
        const theme = this.props.theme.indexOf('dark') >= 0 ? 'dark' : 'light';
        switch (this.props.committedFile.status) {
            case Status.Added:
                icon = 'status-added.svg';
                break;
            case Status.Copied:
                icon = 'status-copied.svg';
                break;
            case Status.Deleted:
                icon = 'status-deleted.svg';
                break;
            case Status.Modified:
                icon = 'status-modified.svg';
                break;
            case Status.Renamed:
                icon = 'status-renamed.svg';
                break;
            default:
                return null;
        }
        const style = {
            marginLeft: '0.3em',
            backgroundImage: `url(${window['extensionPath']}/resources/icons/${theme}/${icon})`,
            display: 'inline-block',
            height: '0.9em',
            width: '0.9em',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            backgroundPositionY: 'bottom',
        };

        return <span style={style} />;
    }
    render() {
        const { flg } = this.state;
        let { additions, deletions } = this.props.committedFile;
        additions = typeof additions === 'number' ? additions : 0;
        deletions = typeof deletions === 'number' ? deletions : 0;
        const summary = `added ${additions} & deleted ${deletions}`;
        const totalDiffs = additions + deletions;

        if (totalDiffs > 5) {
            additions = Math.ceil((TotalDiffBlocks * additions) / totalDiffs);
            deletions = TotalDiffBlocks - additions;
        }

        additions = typeof additions === 'number' ? additions : 0;
        deletions = typeof deletions === 'number' ? deletions : 0;

        const blocks = new Array(TotalDiffBlocks).fill(0).map((v, index) => {
            const className = 'diff-block ' + (index < additions ? 'added' : 'deleted');
            return <span key={index} className={className}></span>;
        });

        const oldFile = ''; //this.props.committedFile.oldRelativePath || '';
        const constFileMovementSymbol = ''; //this.props.committedFile.oldRelativePath ? ' => ' : '';
        let relativePath = this.props.committedFile.relativePath;
        // if (fileName.lastIndexOf('/') != -1) {
        //     fileName = fileName.substr(fileName.lastIndexOf('/') + 1);
        // }
        let fileNameClass = 'file-name';

        if (this.props.current) {
            fileNameClass = 'file-name-active';
        }

        let cuurentDir = '';
        let lastDir = '';
        if (relativePath.lastIndexOf('/') != -1 && this.props.lastRelativePath.lastIndexOf('/') != -1) {
            cuurentDir = relativePath.substr(0, relativePath.lastIndexOf('/'));
            lastDir = this.props.lastRelativePath.substr(0, this.props.lastRelativePath.lastIndexOf('/'));
            if (cuurentDir === lastDir) {
                relativePath = ' ╚ ' + relativePath.substr(relativePath.lastIndexOf('/') + 1);
            } else {
                relativePath = relativePath.replace(/\//g, '/ ');
            }
        } else {
            relativePath = relativePath.replace(/\//g, '/ ');
        }

        return (
            <div className="diff-col" onMouseEnter={this.mouseenter} onMouseLeave={this.mouseleave}>
                <div className="diff-row">
                    <div>
                        <span className="diff-stats hint--right hint--rounded hint--bounce" aria-label={summary}>
                            {blocks}
                        </span>
                    </div>
                    <div>{this.renderStatus()}</div>
                    <div
                        className="file-name-cnt"
                        role="button"
                        onClick={() => this.props.onAction(this.props.committedFile, 'compare_previous')}
                    >
                        <span className={fileNameClass}>
                            {oldFile}
                            {constFileMovementSymbol}
                            {relativePath}
                        </span>
                    </div>
                    {flg && (
                        <div className="mini-size">
                            <a
                                role="button"
                                className="mini-size-margin hint--left hint--rounded hint--bounce"
                                aria-label="Open file"
                                onClick={() => this.props.onAction(this.props.committedFile, 'open')}
                            >
                                <GoFile></GoFile> Open
                            </a>
                            <a
                                role="button"
                                className="mini-size-margin hint--left hint--rounded hint--bounce"
                                aria-label="View this revision"
                                onClick={() => this.props.onAction(this.props.committedFile, 'view')}
                            >
                                <GoEye></GoEye> View
                            </a>
                            <a
                                role="button"
                                className="mini-size-margin hint--left hint--rounded hint--bounce"
                                aria-label="Compare file with current workspace"
                                onClick={() => this.props.onAction(this.props.committedFile, 'compare_workspace')}
                            >
                                <GoGitCompare></GoGitCompare> Workspace
                            </a>
                            <a
                                role="button"
                                className="mini-size-margin hint--left hint--rounded hint--bounce"
                                aria-label="View file history"
                                onClick={() => this.props.onAction(this.props.committedFile, 'history')}
                            >
                                <GoHistory></GoHistory> History
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
