
import { Component, ReactNode } from "react";
import { FileVistaPreviewProps } from "../typings/FileVistaProps";

export class preview extends Component<FileVistaPreviewProps> {
    render(): ReactNode {
        return (
            <div className="ufv-container">
                <div className="ufv-toolbar">
                    <div className="ufv-file-information">
                        <div className="ufv-file-badge ufv-pdf">
                            PDF
                        </div>

                        <div className="ufv-file-details">
                            <span className="ufv-file-name">
                                SampleDocument.pdf
                            </span>

                            <span className="ufv-file-extension">
                                PDF Document
                            </span>
                        </div>
                    </div>

                    <div className="ufv-toolbar-actions">
                        <button className="ufv-toolbar-button" disabled>
                            Download
                        </button>

                        <button className="ufv-toolbar-button" disabled>
                            Fullscreen
                        </button>
                    </div>
                </div>

                <div className="ufv-preview-area">
                    <div className="ufv-preview-placeholder">
                        <div className="ufv-file-icon ufv-pdf">
                            PDF
                        </div>

                        <h3>FileVista</h3>
                        <p>
                            Your document preview will appear here.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
