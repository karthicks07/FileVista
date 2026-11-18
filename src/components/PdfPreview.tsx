
import { useEffect, useRef, useState } from "react";
import {
    getDocument,
    GlobalWorkerOptions,
    PDFDocumentLoadingTask,
    PDFDocumentProxy,
    RenderTask
} from "pdfjs-dist";
import "./PdfPreview.css";

// Load the worker from the packaged Mendix widget assets.
GlobalWorkerOptions.workerSrc = new URL(
    "./assets/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface PdfPreviewProps {
    url: string;
}

export function PdfPreview({ url }: PdfPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch the Mendix file and load it into PDF.js.
    useEffect(() => {
        let cancelled = false;
        let loadingTask: PDFDocumentLoadingTask | null = null;

        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const loadPdf = async () => {
            setLoading(true);
            setError("");
            setPdf(null);
            setPageNumber(1);
            setPageCount(0);

            try {
                const fileUrl = new URL(url, window.location.href);

                if (fileUrl.origin !== window.location.origin) {
                    throw new Error(
                        "The file URL must belong to the current Mendix application."
                    );
                }

                timeoutId = setTimeout(() => {
                    controller.abort();
                }, 30000);

                const response = await fetch(fileUrl.toString(), {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/pdf"
                    },
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `File request failed with HTTP ${response.status}.`
                    );
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) {
                    return;
                }

                if (buffer.byteLength === 0) {
                    throw new Error("The downloaded PDF file is empty.");
                }

                const data = new Uint8Array(buffer);

                const signature = new TextDecoder().decode(
                    data.subarray(0, 5)
                );

                if (signature !== "%PDF-") {
                    throw new Error(
                        "The downloaded file does not have a valid PDF signature."
                    );
                }

                loadingTask = getDocument({ data });

                const document = await loadingTask.promise;

                if (cancelled) {
                    return;
                }

                setPdf(document);
                setPageCount(document.numPages);
                setLoading(false);
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("PDF loading failed:", reason);

                    if (controller.signal.aborted) {
                        setError(
                            "PDF loading timed out after 30 seconds."
                        );
                    } else {
                        const message =
                            reason instanceof Error
                                ? reason.message
                                : "Unknown error";

                        setError(`Unable to load PDF: ${message}`);
                    }

                    setLoading(false);
                }
            } finally {
                if (timeoutId !== undefined) {
                    clearTimeout(timeoutId);
                }
            }
        };

        void loadPdf();

        return () => {
            cancelled = true;
            controller.abort();

            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }

            if (loadingTask) {
                void loadingTask.destroy();
            }
        };
    }, [url]);

    // Render the selected PDF page.
    useEffect(() => {
        if (!pdf || !canvasRef.current) {
            return;
        }

        let cancelled = false;
        let renderTask: RenderTask | null = null;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(pageNumber);

                if (cancelled || !canvasRef.current) {
                    return;
                }

                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Unable to create canvas context.");
                }

                const viewport = page.getViewport({ scale: 1.4 });
                const outputScale = window.devicePixelRatio || 1;

                canvas.width = Math.floor(
                    viewport.width * outputScale
                );

                canvas.height = Math.floor(
                    viewport.height * outputScale
                );

                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                renderTask = page.render({
                    canvas,
                    viewport,
                    transform:
                        outputScale !== 1
                            ? [
                                outputScale,
                                0,
                                0,
                                outputScale,
                                0,
                                0
                            ]
                            : undefined
                });

                await renderTask.promise;
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("PDF rendering failed:", reason);

                    setError(
                        "The PDF was downloaded, but its page could not be rendered."
                    );
                }
            }
        };

        void renderPage();

        return () => {
            cancelled = true;
            renderTask?.cancel();
        };
    }, [pdf, pageNumber]);

    if (loading) {
        return (
            <div className="ufv-pdf-status">
                Loading PDF document...
            </div>
        );
    }

    if (error) {
        return (
            <div className="ufv-pdf-error">
                <h3>PDF Preview Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!pdf) {
        return (
            <div className="ufv-pdf-status">
                No PDF document is available.
            </div>
        );
    }

    return (
        <div className="ufv-pdf-viewer">
            <div className="ufv-pdf-navigation">
                <button
                    type="button"
                    onClick={() =>
                        setPageNumber(current => Math.max(1, current - 1))
                    }
                    disabled={pageNumber <= 1}
                >
                    Previous
                </button>

                <span>
                    Page {pageNumber} of {pageCount}
                </span>

                <button
                    type="button"
                    onClick={() =>
                        setPageNumber(current =>
                            Math.min(pageCount, current + 1)
                        )
                    }
                    disabled={pageNumber >= pageCount}
                >
                    Next
                </button>
            </div>

            <div className="ufv-pdf-page">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
