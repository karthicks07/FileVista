
import { useEffect, useRef, useState } from "react";
import { PPTXViewer } from "pptxviewjs";
import "./PresentationPreview.css";

interface PresentationPreviewProps {
    url: string;
    fileName: string;
}

export function PresentationPreview({
    url,
    fileName
}: PresentationPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<PPTXViewer | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [slideCount, setSlideCount] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [zoom, setZoom] = useState(100);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        const loadPresentation = async () => {
            setLoading(true);
            setError("");
            setSlideCount(0);
            setCurrentSlide(0);
            setZoom(100);

            try {
                const fileUrl = new URL(url, window.location.href);

                if (fileUrl.origin !== window.location.origin) {
                    throw new Error(
                        "The presentation URL must belong to the current Mendix application."
                    );
                }

                const response = await fetch(fileUrl.toString(), {
                    method: "GET",
                    credentials: "same-origin",
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `Presentation request failed with HTTP ${response.status}.`
                    );
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) {
                    return;
                }

                if (buffer.byteLength === 0) {
                    throw new Error("The presentation file is empty.");
                }

                const bytes = new Uint8Array(buffer);

                if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
                    throw new Error(
                        "The file does not have a valid PPTX archive signature."
                    );
                }

                const canvas = canvasRef.current;

                if (!canvas) {
                    throw new Error("Presentation canvas is unavailable.");
                }

                // Keep the internal drawing resolution fixed.
                // Do not set canvas.style.width or canvas.style.height
                // using percentage values. PPTXViewer reads these values.
                canvas.width = 1280;
                canvas.height = 720;

                const viewer = new PPTXViewer({
                    canvas,
                    slideSizeMode: "fit",
                    backgroundColor: "#ffffff"
                });

                viewerRef.current = viewer;

                await viewer.loadFile(buffer);

                if (cancelled) {
                    viewer.destroy();
                    return;
                }

                const totalSlides = viewer.getSlideCount();

                if (totalSlides < 1) {
                    throw new Error(
                        "No slides were found in this presentation."
                    );
                }

                await viewer.render(canvas, {
                    scale: 1,
                    quality: "high"
                });

                if (cancelled) {
                    viewer.destroy();
                    return;
                }

                setSlideCount(totalSlides);
                setCurrentSlide(viewer.getCurrentSlideIndex());
                setLoading(false);
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("PPTX preview failed:", reason);

                    const message =
                        reason instanceof Error
                            ? reason.message
                            : "Unknown error";

                    setError(`Unable to preview presentation: ${message}`);
                    setLoading(false);
                }
            }
        };

        void loadPresentation();

        return () => {
            cancelled = true;
            controller.abort();

            viewerRef.current?.destroy();
            viewerRef.current = null;
        };
    }, [url]);

    const goToPreviousSlide = async () => {
        const viewer = viewerRef.current;
        const canvas = canvasRef.current;

        if (!viewer || !canvas || currentSlide <= 0) {
            return;
        }

        try {
            await viewer.previousSlide(canvas);
            setCurrentSlide(viewer.getCurrentSlideIndex());
        } catch (reason) {
            console.error("Previous slide navigation failed:", reason);
        }
    };

    const goToNextSlide = async () => {
        const viewer = viewerRef.current;
        const canvas = canvasRef.current;

        if (!viewer || !canvas || currentSlide >= slideCount - 1) {
            return;
        }

        try {
            await viewer.nextSlide(canvas);
            setCurrentSlide(viewer.getCurrentSlideIndex());
        } catch (reason) {
            console.error("Next slide navigation failed:", reason);
        }
    };

    const zoomIn = () => {
        setZoom(current => Math.min(200, current + 10));
    };

    const zoomOut = () => {
        setZoom(current => Math.max(50, current - 10));
    };

    const resetZoom = () => {
        setZoom(100);
    };

    return (
        <div className="ufv-presentation-viewer">
            {loading && (
                <div className="ufv-presentation-status">
                    <span className="ufv-presentation-spinner" />
                    Loading {fileName}...
                </div>
            )}

            {error && (
                <div className="ufv-presentation-error">
                    <h3>Presentation Preview Error</h3>
                    <p>{error}</p>
                </div>
            )}

            <div
                className="ufv-presentation-stage"
                style={{
                    display: loading || error ? "none" : "flex"
                }}
            >
                <div className="ufv-presentation-canvas-wrapper">
                    <canvas
                        ref={canvasRef}
                        width={1280}
                        height={720}
                        className="ufv-presentation-canvas"
                        style={{
                            transform: `scale(${zoom / 100})`
                        }}
                    />
                </div>
            </div>

            {!loading && !error && slideCount > 0 && (
                <div className="ufv-presentation-controls">
                    <div className="ufv-presentation-navigation">
                        <button
                            type="button"
                            onClick={goToPreviousSlide}
                            disabled={currentSlide <= 0}
                        >
                            Previous
                        </button>

                        <span className="ufv-presentation-slide-count">
                            Slide {currentSlide + 1} of {slideCount}
                        </span>

                        <button
                            type="button"
                            onClick={goToNextSlide}
                            disabled={currentSlide >= slideCount - 1}
                        >
                            Next
                        </button>
                    </div>

                    <div className="ufv-presentation-zoom">
                        <button
                            type="button"
                            onClick={zoomOut}
                            disabled={zoom <= 50}
                            aria-label="Zoom out"
                        >
                            −
                        </button>

                        <button
                            type="button"
                            className="ufv-presentation-zoom-value"
                            onClick={resetZoom}
                            title="Reset zoom"
                        >
                            {zoom}%
                        </button>

                        <button
                            type="button"
                            onClick={zoomIn}
                            disabled={zoom >= 200}
                            aria-label="Zoom in"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
