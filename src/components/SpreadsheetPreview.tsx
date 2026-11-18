
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./SpreadsheetPreview.css";

interface SpreadsheetPreviewProps {
    url: string;
    fileName: string;
}

interface SpreadsheetData {
    sheetNames: string[];
    sheets: Record<string, string[][]>;
}

const MAX_PREVIEW_ROWS = 500;
const MAX_PREVIEW_COLUMNS = 30;

function getColumnLabel(columnIndex: number): string {
    let label = "";
    let index = columnIndex + 1;

    while (index > 0) {
        const remainder = (index - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        index = Math.floor((index - 1) / 26);
    }

    return label;
}

export function SpreadsheetPreview({
    url,
    fileName
}: SpreadsheetPreviewProps) {
    const [spreadsheet, setSpreadsheet] =
        useState<SpreadsheetData | null>(null);

    const [activeSheet, setActiveSheet] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [truncated, setTruncated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        const loadSpreadsheet = async () => {
            setLoading(true);
            setError("");
            setSpreadsheet(null);
            setActiveSheet("");
            setTruncated(false);

            try {
                const fileUrl = new URL(url, window.location.href);

                if (fileUrl.origin !== window.location.origin) {
                    throw new Error(
                        "The spreadsheet URL must belong to the current Mendix application."
                    );
                }

                const response = await fetch(fileUrl.toString(), {
                    method: "GET",
                    credentials: "same-origin",
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `Spreadsheet request failed with HTTP ${response.status}.`
                    );
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) {
                    return;
                }

                if (buffer.byteLength === 0) {
                    throw new Error("The spreadsheet file is empty.");
                }

                const workbook = XLSX.read(new Uint8Array(buffer), {
                    type: "array",
                    cellDates: true
                });

                if (workbook.SheetNames.length === 0) {
                    throw new Error("No worksheets were found in this file.");
                }

                const sheets: Record<string, string[][]> = {};
                let hasTruncatedSheet = false;

                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];

                    if (!worksheet || !worksheet["!ref"]) {
                        sheets[sheetName] = [];
                        continue;
                    }

                    const usedRange = XLSX.utils.decode_range(
                        worksheet["!ref"]
                    );

                    const lastRow = Math.min(
                        usedRange.e.r,
                        MAX_PREVIEW_ROWS - 1
                    );

                    const lastColumn = Math.min(
                        usedRange.e.c,
                        MAX_PREVIEW_COLUMNS - 1
                    );

                    if (
                        usedRange.e.r >= MAX_PREVIEW_ROWS ||
                        usedRange.e.c >= MAX_PREVIEW_COLUMNS
                    ) {
                        hasTruncatedSheet = true;
                    }

                    const previewRange = XLSX.utils.encode_range({
                        s: { r: 0, c: 0 },
                        e: {
                            r: lastRow,
                            c: lastColumn
                        }
                    });

                    const rows = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        raw: false,
                        defval: "",
                        blankrows: true,
                        range: previewRange
                    }) as unknown[][];

                    sheets[sheetName] = rows.map(row =>
                        row.map(cell =>
                            cell === null || cell === undefined
                                ? ""
                                : String(cell)
                        )
                    );
                }

                if (cancelled) {
                    return;
                }

                setSpreadsheet({
                    sheetNames: workbook.SheetNames,
                    sheets
                });

                setActiveSheet(workbook.SheetNames[0]);
                setTruncated(hasTruncatedSheet);
                setLoading(false);
            } catch (reason: unknown) {
                if (!cancelled) {
                    console.error("Spreadsheet loading failed:", reason);

                    const message =
                        reason instanceof Error
                            ? reason.message
                            : "Unknown error";

                    setError(`Unable to preview spreadsheet: ${message}`);
                    setLoading(false);
                }
            }
        };

        void loadSpreadsheet();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [url]);

    const rows = spreadsheet?.sheets[activeSheet] ?? [];

    const columnCount = Math.max(
        0,
        ...rows.map(row => row.length)
    );

    if (loading) {
        return (
            <div className="ufv-spreadsheet-viewer">
                <div className="ufv-spreadsheet-status">
                    <span className="ufv-spreadsheet-spinner" />
                    Loading {fileName}...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ufv-spreadsheet-viewer">
                <div className="ufv-spreadsheet-error">
                    <h3>Spreadsheet Preview Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!spreadsheet) {
        return (
            <div className="ufv-spreadsheet-status">
                No spreadsheet data is available.
            </div>
        );
    }

    return (
        <div className="ufv-spreadsheet-viewer">
            <div className="ufv-spreadsheet-tabs">
                {spreadsheet.sheetNames.map(sheetName => (
                    <button
                        key={sheetName}
                        type="button"
                        className={
                            activeSheet === sheetName
                                ? "ufv-spreadsheet-tab active"
                                : "ufv-spreadsheet-tab"
                        }
                        onClick={() => setActiveSheet(sheetName)}
                    >
                        {sheetName}
                    </button>
                ))}
            </div>

            {truncated && (
                <div className="ufv-spreadsheet-notice">
                    Preview is limited to the first {MAX_PREVIEW_ROWS} rows
                    and {MAX_PREVIEW_COLUMNS} columns of each worksheet.
                    Download the file to view all data.
                </div>
            )}

            <div className="ufv-spreadsheet-grid-container">
                {rows.length === 0 || columnCount === 0 ? (
                    <div className="ufv-spreadsheet-empty">
                        This worksheet is empty.
                    </div>
                ) : (
                    <table className="ufv-spreadsheet-grid">
                        <thead>
                            <tr>
                                <th className="ufv-spreadsheet-row-header">
                                    #
                                </th>

                                {Array.from(
                                    { length: columnCount },
                                    (_, index) => (
                                        <th key={index}>
                                            {getColumnLabel(index)}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <th className="ufv-spreadsheet-row-header">
                                        {rowIndex + 1}
                                    </th>

                                    {Array.from(
                                        { length: columnCount },
                                        (_, columnIndex) => (
                                            <td
                                                key={columnIndex}
                                                title={row[columnIndex] ?? ""}
                                            >
                                                {row[columnIndex] ?? ""}
                                            </td>
                                        )
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="ufv-spreadsheet-footer">
                <span>{activeSheet}</span>
                <span>
                    {rows.length} preview rows · {columnCount} columns
                </span>
            </div>
        </div>
    );
}
