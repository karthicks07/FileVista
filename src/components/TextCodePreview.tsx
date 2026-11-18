
import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github.css";
import "./TextCodePreview.css";

interface TextCodePreviewProps {
    url: string;
    fileName: string;
}

const MAX_PREVIEW_SIZE = 5 * 1024 * 1024;

const LANGUAGE_MAP: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "xml",
    xml: "xml",
    json: "json",
    css: "css",
    java: "java",
    sql: "sql",
    c: "c",
    cpp: "cpp",
    md: "markdown",
    log: "plaintext",
    txt: "plaintext"
};

export function TextCodePreview({
    url,
    fileName
}: TextCodePreviewProps) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [wrapLines, setWrapLines] = useState(false);
    const [copyMessage, setCopyMessage] = useState("");

    const extension = fileName.includes(".")
        ? fileName.split(".").pop()?.toLowerCase() ?? ""
        : "";

    const language = LANGUAGE_MAP[extension] ?? "plaintext";
    const isCode = language !== "plaintext" && language !== "markdown";

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        const loadText = async () => {
            setLoading(true);
            setError("");
            setContent("");

            try {
                const fileUrl = new URL(url, window.location.href);

                if (fileUrl.origin !== window.location.origin) {
                    throw new Error(
                        "The file URL must belong to the current Mendix application."
                    );
                }

                const response = await fetch(fileUrl.toString(), {
                    method: "GET",
                    credentials: "same-origin",
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `File request failed with HTTP ${response.status}.`
                    );
                }

                const declaredLength = Number(
                    response.headers.get("content-length") ?? 0
                );

                if (declaredLength > MAX_PREVIEW_SIZE) {
                    throw new Error(
                        "The file is larger than the 5 MB preview limit. Download it to view the complete content."
                    );
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) {
                    return;
                }

                if (buffer.byteLength > MAX_PREVIEW_SIZE) {
                    throw new Error(
                        "The file is larger than the 5 MB preview limit. Download it to view the complete content."
                    );
                }

                const text = new TextDecoder("utf-8").decode(buffer);

                setContent(text);
                setLoading(false);
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("Text preview failed:", reason);

                    const message =
                        reason instanceof Error
                            ? reason.message
                            : "Unknown error";

                    setError(`Unable to preview file: ${message}`);
                    setLoading(false);
                }
            }
        };

        void loadText();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [url]);

    const highlightedLines = useMemo(() => {
        const sourceLines = content.split(/\r\n|\r|\n/);

        if (!isCode) {
            return sourceLines.map(line => ({
                html: escapeHtml(line),
                plain: true
            }));
        }

        try {
            const highlighted = hljs.highlight(content, {
                language
            }).value;

            return highlighted.split("\n").map(line => ({
                html: line || "&nbsp;",
                plain: false
            }));
        } catch (reason) {
            console.warn("Syntax highlighting failed:", reason);

            return sourceLines.map(line => ({
                html: escapeHtml(line),
                plain: true
            }));
        }
    }, [content, language, isCode]);

    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopyMessage("Copied");

            window.setTimeout(() => {
                setCopyMessage("");
            }, 2000);
        } catch (reason) {
            console.error("Unable to copy file content:", reason);
            setCopyMessage("Copy failed");

            window.setTimeout(() => {
                setCopyMessage("");
            }, 2000);
        }
    };

    if (loading) {
        return (
            <div className="ufv-text-viewer">
                <div className="ufv-text-status">
                    <span className="ufv-text-spinner" />
                    Loading {fileName}...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ufv-text-viewer">
                <div className="ufv-text-error">
                    <h3>File Preview Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ufv-text-viewer">
            <div className="ufv-text-toolbar">
                <div className="ufv-text-language">
                    <span className="ufv-text-language-badge">
                        {extension.toUpperCase() || "TEXT"}
                    </span>

                    <span className="ufv-text-language-name">
                        {language === "plaintext"
                            ? "Plain Text"
                            : language.charAt(0).toUpperCase() +
                              language.slice(1)}
                    </span>
                </div>

                <div className="ufv-text-actions">
                    <button
                        type="button"
                        onClick={() => setWrapLines(current => !current)}
                        className={
                            wrapLines
                                ? "ufv-text-action active"
                                : "ufv-text-action"
                        }
                    >
                        Word Wrap
                    </button>

                    <button
                        type="button"
                        onClick={copyContent}
                        className="ufv-text-action"
                    >
                        {copyMessage || "Copy"}
                    </button>
                </div>
            </div>

            <div
                className={
                    wrapLines
                        ? "ufv-text-code-area wrap-lines"
                        : "ufv-text-code-area"
                }
            >
                <table className="ufv-text-code-table">
                    <tbody>
                        {highlightedLines.map((line, index) => (
                            <tr key={index}>
                                <td className="ufv-text-line-number">
                                    {index + 1}
                                </td>

                                <td className="ufv-text-code-cell">
                                    <code
                                        className={
                                            line.plain
                                                ? "ufv-text-plain"
                                                : "hljs"
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: line.html
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="ufv-text-footer">
                <span>{highlightedLines.length} lines</span>
                <span>
                    {(new Blob([content]).size / 1024).toFixed(2)} KB
                </span>
            </div>
        </div>
    );
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
