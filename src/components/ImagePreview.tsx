
import { useState } from "react";
import "./ImagePreview.css";

interface ImagePreviewProps {
    url: string;
    fileName: string;
}

type ImageFitMode = "fit" | "actual";

export function ImagePreview({ url, fileName }: ImagePreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [fitMode, setFitMode] = useState<ImageFitMode>("fit");
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const zoomIn = () => {
        setFitMode("actual");
        setZoom(current => Math.min(5, current + 0.25));
    };

    const zoomOut = () => {
        setFitMode("actual");
        setZoom(current => Math.max(0.25, current - 0.25));
    };

    const rotateLeft = () => {
        setRotation(current => (current - 90 + 360) % 360);
    };

    const rotateRight = () => {
        setRotation(current => (current + 90) % 360);
    };

    const fitToScreen = () => {
        setFitMode("fit");
        setZoom(1);
    };

    const actualSize = () => {
        setFitMode("actual");
        setZoom(1);
    };

    const resetView = () => {
        setZoom(1);
        setRotation(0);
        setFitMode("fit");
    };

    if (error) {
        return (
            <div className="ufv-image-error">
                <div className="ufv-image-error-icon">!</div>
                <h3>Unable to display image</h3>
                <p>
                    The image could not be loaded. Check the file format,
                    file permissions, and Mendix file response.
                </p>
            </div>
        );
    }

    return (
        <div className="ufv-image-viewer">
            <div className="ufv-image-toolbar">
                <div className="ufv-image-toolbar-group">
                    <button
                        type="button"
                        onClick={zoomOut}
                        disabled={zoom <= 0.25}
                        title="Zoom out"
                        aria-label="Zoom out"
                    >
                        −
                    </button>

                    <span className="ufv-image-zoom-value">
                        {Math.round(zoom * 100)}%
                    </span>

                    <button
                        type="button"
                        onClick={zoomIn}
                        disabled={zoom >= 5}
                        title="Zoom in"
                        aria-label="Zoom in"
                    >
                        +
                    </button>
                </div>

                <div className="ufv-image-toolbar-group">
                    <button
                        type="button"
                        onClick={fitToScreen}
                        className={fitMode === "fit" ? "active" : ""}
                        title="Fit to screen"
                    >
                        Fit
                    </button>

                    <button
                        type="button"
                        onClick={actualSize}
                        className={fitMode === "actual" ? "active" : ""}
                        title="Actual size"
                    >
                        100%
                    </button>
                </div>

                <div className="ufv-image-toolbar-group">
                    <button
                        type="button"
                        onClick={rotateLeft}
                        title="Rotate left"
                        aria-label="Rotate left"
                    >
                        ↶
                    </button>

                    <button
                        type="button"
                        onClick={rotateRight}
                        title="Rotate right"
                        aria-label="Rotate right"
                    >
                        ↷
                    </button>

                    <button
                        type="button"
                        onClick={resetView}
                        title="Reset image"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="ufv-image-canvas">
                {!loaded && (
                    <div className="ufv-image-loading">
                        Loading image...
                    </div>
                )}

                <img
                    src={url}
                    alt={fileName}
                    className={`ufv-image-content ${
                        fitMode === "fit" ? "ufv-image-fit" : "ufv-image-actual"
                    }`}
                    style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                        setLoaded(false);
                        setError(true);
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
}
