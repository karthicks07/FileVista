
import { Component, ReactNode, createRef } from "react";
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
}

export class FileVista extends Component<
    FileVistaContainerProps,
    FileVistaState
> {
    private viewerRef = createRef<HTMLDivElement>();

    constructor(props: FileVistaContainerProps) {
        super(props);

        this.state = {
            isFullscreen: false
        };
    }

    private getFile(): FileValue | undefined {
        return this.props.file?.value;
    }

    private getFileUrl(): string {
        return this.getFile()?.uri ?? "";
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

    private handleDownload = (): void => {
        const fileUrl = this.getFileUrl();

        if (!fileUrl) {
            return;
        }

        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = this.getFileName();
        link.rel = "noopener noreferrer";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

        return (
            <div className="ufv-container" ref={this.viewerRef}>
                <div className="ufv-toolbar">
                    <div className="ufv-file-information">
                        <div
                            className={`ufv-file-badge ufv-${this.getFileCategory()}`}
                        >
                            {this.getFileExtension().toUpperCase() || "FILE"}
                        </div>

                        <div className="ufv-file-details">
                            <span className="ufv-file-name">
                                {this.getFileName()}
                            </span>

                            <span className="ufv-file-extension">
                                {this.getFileTypeLabel()}
                            </span>
                        </div>
                    </div>

                    <div className="ufv-toolbar-actions">
                        <button
                            type="button"
                            className="ufv-toolbar-button"
                            onClick={this.handleDownload}
                            disabled={!hasFile}
                        >
                            Download
                        </button>

                        <button
                            type="button"
                            className="ufv-toolbar-button"
                            onClick={this.handleFullscreen}
                            disabled={!hasFile}
                        >
                            {this.state.isFullscreen
                                ? "Exit Fullscreen"
                                : "Fullscreen"}
                        </button>
                    </div>
                </div>

                <div className="ufv-preview-area">
                    {this.renderPreview()}
                </div>
            </div>
        );
    }
}
