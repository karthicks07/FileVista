
import { Component, CSSProperties, ReactNode, createRef } from "react";
import { FileValue } from "mendix";
import { FileVistaContainerProps } from "../typings/FileVistaProps";
import { PdfPreview } from "./components/PdfPreview";
import { ImagePreview } from "./components/ImagePreview";
import { MediaPreview } from "./components/MediaPreview";
import { DocxPreview } from "./components/DocxPreview";
import { SpreadsheetPreview } from "./components/SpreadsheetPreview";
import { PresentationPreview } from "./components/PresentationPreview";
import { TextCodePreview } from "./components/TextCodePreview";
import "./ui/FileVista.css";

type FileCategory =
    | "pdf"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "spreadsheet"
    | "presentation"
    | "text"
    | "code"
    | "archive"
    | "unknown";

interface FileVistaState {
    isFullscreen: boolean;
    zoom: number;
    refreshKey: number;
}

export class FileVista extends Component<
    FileVistaContainerProps,
    FileVistaState
> {
    private viewerRef = createRef<HTMLDivElement>();

    constructor(props: FileVistaContainerProps) {
        super(props);

        this.state = {
            isFullscreen: false,
            zoom: 100,
            refreshKey: 0
        };
    }

    componentDidMount(): void {
        document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    }

    componentWillUnmount(): void {
        document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    }

    private handleFullscreenChange = (): void => {
        this.setState({ isFullscreen: Boolean(document.fullscreenElement) });
    };

    private handleZoomIn = (): void => {
        this.setState(current => ({
            zoom: Math.min(200, current.zoom + 10)
        }));
    };

    private handleZoomOut = (): void => {
        this.setState(current => ({
            zoom: Math.max(50, current.zoom - 10)
        }));
    };

    private handleRefresh = (): void => {
        this.setState(current => ({
            refreshKey: current.refreshKey + 1,
            zoom: 100
        }));
    };

    private getFile(): FileValue | undefined {
        return this.props.file?.value;
    }

    private getFileName(): string {
        return this.getFile()?.name ?? "Unknown file";
    }

    private getFileExtension(): string {
        const fileName = this.getFileName();
        const lastDot = fileName.lastIndexOf(".");

        if (lastDot === -1) {
            return "";
        }

        return fileName.substring(lastDot + 1).toLowerCase();
    }

    private getFileCategory(): FileCategory {
        const extension = this.getFileExtension();

        const categories: Record<string, FileCategory> = {
            pdf: "pdf",

            png: "image",
            jpg: "image",
            jpeg: "image",
            gif: "image",
            bmp: "image",
            webp: "image",
            svg: "image",
            ico: "image",

            mp4: "video",
            webm: "video",
            ogv: "video",
            mov: "video",

            mp3: "audio",
            wav: "audio",
            ogg: "audio",
            m4a: "audio",
            aac: "audio",

            doc: "document",
            docx: "document",
            odt: "document",
            rtf: "document",

            xls: "spreadsheet",
            xlsx: "spreadsheet",
            csv: "spreadsheet",
            ods: "spreadsheet",

            ppt: "presentation",
            pptx: "presentation",
            odp: "presentation",

            txt: "text",
            md: "text",
            log: "text",
            xml: "text",
            json: "text",

            js: "code",
            jsx: "code",
            ts: "code",
            tsx: "code",
            css: "code",
            html: "code",
            java: "code",
            py: "code",
            sql: "code",
            c: "code",
            cpp: "code",

            zip: "archive"
        };

        return categories[extension] || "unknown";
    }

    private getFileTypeLabel(): string {
        const labels: Record<FileCategory, string> = {
            pdf: "PDF Document",
            image: "Image",
            video: "Video",
            audio: "Audio",
            document: "Document",
            spreadsheet: "Spreadsheet",
            presentation: "Presentation",
            text: "Text File",
            code: "Code File",
            archive: "ZIP Archive",
            unknown: "Unknown File Type"
        };

        return labels[this.getFileCategory()];
    }

    private handleFullscreen = async (): Promise<void> => {
        const viewer = this.viewerRef.current;

        if (!viewer) {
            return;
        }

        try {
            if (!document.fullscreenElement) {
                await viewer.requestFullscreen();
                this.setState({ isFullscreen: true });
            } else {
                await document.exitFullscreen();
                this.setState({ isFullscreen: false });
            }
        } catch (error) {
            console.error("Fullscreen operation failed:", error);
        }
    };

    private renderPreview(): ReactNode {
        const file = this.getFile();
        const fileUrl = file?.uri ?? "";
        const fileName = file?.name ?? "Unknown file";
        const extension = this.getFileExtension();

        if (!file || !fileUrl) {
            return (
                <div className="ufv-preview-placeholder">
                    <h3>No file selected</h3>
                    <p>
                        Configure a System.File or FileDocument object
                        in the widget properties.
                    </p>
                </div>
            );
        }

        switch (this.getFileCategory()) {
            case "pdf":
                return <PdfPreview url={fileUrl} />;

            case "image":
                return (
                    <ImagePreview
                        url={fileUrl}
                        fileName={fileName}
                    />
                );

            case "video":
                return (
                    <MediaPreview
                        url={fileUrl}
                        fileName={fileName}
                        mediaType="video"
                    />
                );

            case "audio":
                return (
                    <MediaPreview
                        url={fileUrl}
                        fileName={fileName}
                        mediaType="audio"
                    />
                );

            case "document":
                if (extension === "docx") {
                    return (
                        <DocxPreview
                            url={fileUrl}
                            fileName={fileName}
                        />
                    );
                }

                return (
                    <div className="ufv-preview-placeholder">
                        <h3>Format not supported yet</h3>
                        <p>
                            Preview for .{extension} files is not available yet.
                        </p>
                    </div>
                );

            case "spreadsheet":
                if (
                    extension === "xlsx" ||
                    extension === "xls" ||
                    extension === "csv" ||
                    extension === "ods"
                ) {
                    return (
                        <SpreadsheetPreview
                            url={fileUrl}
                            fileName={fileName}
                        />
                    );
                }

                return (
                    <div className="ufv-preview-placeholder">
                        <h3>Format not supported yet</h3>
                        <p>
                            Preview for .{extension} files is not available yet.
                        </p>
                    </div>
                );

            case "presentation":
                if (extension === "pptx") {
                    return (
                        <PresentationPreview
                            url={fileUrl}
                            fileName={fileName}
                        />
                    );
                }

                return (
                    <div className="ufv-preview-placeholder">
                        <h3>Format not supported yet</h3>
                        <p>
                            Preview for .{extension} files is not available yet.
                        </p>
                    </div>
                );

            case "text":
            case "code":
                return (
                    <TextCodePreview
                        url={fileUrl}
                        fileName={fileName}
                    />
                );

            default:
                return (
                    <div className="ufv-preview-placeholder">
                        <div className="ufv-file-icon">
                            {extension.toUpperCase() || "FILE"}
                        </div>

                        <h3>Preview not implemented yet</h3>

                        <p>
                            {this.getFileTypeLabel()} preview will be
                            implemented in a future update.
                        </p>
                    </div>
                );
        }
    }

    render(): ReactNode {
        const file = this.getFile();
        const hasFile = Boolean(file?.uri);
        const headerText = this.props.headert?.value ?? "";

        return (
            <div className="ufv-container" ref={this.viewerRef}>
                <div className="ufv-toolbar">
                    <div className="ufv-toolbar-group ufv-toolbar-left">
                        <button
                            type="button"
                            className="ufv-icon-button"
                            onClick={this.handleZoomIn}
                            disabled={!hasFile || this.state.zoom >= 200}
                            aria-label="Zoom in"
                            title="Zoom in"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="10.8" cy="10.8" r="6.8" />
                                <path d="M16 16l5 5M10.8 7.5v6.6M7.5 10.8h6.6" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            className="ufv-icon-button"
                            onClick={this.handleZoomOut}
                            disabled={!hasFile || this.state.zoom <= 50}
                            aria-label="Zoom out"
                            title="Zoom out"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="10.8" cy="10.8" r="6.8" />
                                <path d="M16 16l5 5M7.5 10.8h6.6" />
                            </svg>
                        </button>
                    </div>

                    <div className="ufv-header-title" title={headerText}>
                        {headerText}
                    </div>

                    <div className="ufv-toolbar-group ufv-toolbar-right">
                        <button
                            type="button"
                            className="ufv-icon-button"
                            onClick={this.handleRefresh}
                            disabled={!hasFile}
                            aria-label="Refresh preview"
                            title="Refresh"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 7v5h-5M4 17v-5h5" />
                                <path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            className="ufv-icon-button"
                            onClick={this.handleFullscreen}
                            disabled={!hasFile}
                            aria-label={this.state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            title={this.state.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {this.state.isFullscreen ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="ufv-preview-area">
                    <div
                        className="ufv-preview-content"
                        key={this.state.refreshKey}
                        style={{
                            "--ufv-document-zoom": this.state.zoom / 100
                        } as CSSProperties}
                    >
                        {this.renderPreview()}
                    </div>
                </div>
            </div>
        );
    }
}
