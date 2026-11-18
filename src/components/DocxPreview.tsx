
import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import "./DocxPreview.css";

interface DocxPreviewProps {
    url: string;
    fileName: string;
}

export function DocxPreview({ url, fileName }: DocxPreviewProps) {
    const documentRef = useRef<HTMLDivElement>(null);
    const stylesRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        const controller = new AbortController();

        const loadDocument = async () => {
            setLoading(true);
            setError("");

            documentRef.current?.replaceChildren();
            stylesRef.current?.replaceChildren();

            try {
                const fileUrl = new URL(url, window.location.href);

                if (fileUrl.origin !== window.location.origin) {
                    throw new Error(
                        "The document URL must belong to the current Mendix application."
                    );
                }

                const response = await fetch(fileUrl.toString(), {
                    method: "GET",
                    credentials: "same-origin",
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `Document request failed with HTTP ${response.status}.`
                    );
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) {
                    return;
                }

                if (buffer.byteLength === 0) {
                    throw new Error("The DOCX file is empty.");
                }

                const bytes = new Uint8Array(buffer);

                if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
                    throw new Error(
                        "The file does not have a valid DOCX archive signature."
                    );
                }

                if (!documentRef.current || !stylesRef.current) {
                    throw new Error(
                        "Document preview container is unavailable."
                    );
                }

                await renderAsync(
                    buffer,
                    documentRef.current,
                    stylesRef.current,
                    {
                        className: "ufv-docx-document",
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false,
                        ignoreFonts: false,
                        breakPages: true,
                        renderHeaders: true,
                        renderFooters: true,
                        renderFootnotes: true,
                        renderEndnotes: true,
                        renderComments: false,
                        useBase64URL: true,
                        experimental: false
                    }
                );

                if (cancelled || !documentRef.current) {
                    return;
                }

                const container = documentRef.current;

                const fitPagesToWidth = () => {
                    const availableWidth = container.clientWidth - 32;

                    if (availableWidth <= 0) {
                        return;
                    }

                    const pages = container.querySelectorAll<HTMLElement>(
                        ".docx-wrapper > section.docx"
                    );

                    pages.forEach(page => {
                        if (!page.dataset.ufvNaturalWidth) {
                            const naturalWidth = page.getBoundingClientRect().width;
                            page.dataset.ufvNaturalWidth = String(naturalWidth);
                        }

                        const naturalWidth = Number(
                            page.dataset.ufvNaturalWidth
                        );

                        if (!naturalWidth) {
                            return;
                        }

                        const scale = Math.min(
                            1,
                            availableWidth / naturalWidth
                        );

                        page.style.zoom = String(scale);
                    });
                };

                // Fit pages immediately after rendering.
                fitPagesToWidth();

                // Refit when the popup or preview width changes.
                resizeObserver = new ResizeObserver(() => {
                    fitPagesToWidth();
                });

                resizeObserver.observe(container);

                if (!cancelled) {
                    setLoading(false);
                }
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("DOCX preview failed:", reason);

                    const message =
                        reason instanceof Error
                            ? reason.message
                            : "Unknown error";

                    setError(`Unable to preview DOCX: ${message}`);
                    setLoading(false);
                }
            }
        };

        void loadDocument();

        return () => {
            cancelled = true;
            controller.abort();
            resizeObserver?.disconnect();

            documentRef.current?.replaceChildren();
            stylesRef.current?.replaceChildren();
        };
    }, [url]);

    return (
        <div className="ufv-docx-viewer">
            {loading && (
                <div className="ufv-docx-loading">
                    <span className="ufv-docx-spinner" />
                    <span>Loading {fileName}...</span>
                </div>
            )}

            {error && (
                <div className="ufv-docx-error">
                    <h3>Document Preview Error</h3>
                    <p>{error}</p>
                </div>
            )}

            <div
                className="ufv-docx-styles"
                ref={stylesRef}
            />

            <div
                className="ufv-docx-content"
                ref={documentRef}
                style={{ display: error ? "none" : "block" }}
            />
        </div>
    );
}
