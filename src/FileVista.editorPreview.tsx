
import { Component, ReactNode } from "react";
import { FileVistaPreviewProps } from "../typings/FileVistaProps";

export class preview extends Component<FileVistaPreviewProps> {
    render(): ReactNode {
        return (
            <div className="ufv-container">
                <div className="ufv-toolbar">
                    <div className="ufv-toolbar-group ufv-toolbar-left">
                        <button className="ufv-icon-button" disabled aria-label="Zoom in">
                            <span>⌕+</span>
                        </button>
                        <button className="ufv-icon-button" disabled aria-label="Zoom out">
                            <span>⌕−</span>
                        </button>
                    </div>

                    <div className="ufv-header-title">
                        {this.props.headert || "Circular View"}
                    </div>

                    <div className="ufv-toolbar-group ufv-toolbar-right">
                        <button className="ufv-icon-button" disabled aria-label="Refresh">
                            ↻
                        </button>
                        <button className="ufv-icon-button" disabled aria-label="Fullscreen">
                            ⛶
                        </button>
                    </div>
                </div>

                <div className="ufv-preview-area">
                    <div className="ufv-preview-placeholder">
                        <div className="ufv-file-icon ufv-pdf">PDF</div>
                        <h3>FileVista</h3>
                        <p>Your document preview will appear here.</p>
                    </div>
                </div>
            </div>
        );
    }
}
