import { stripHtmlTags } from '../markdown/parser.js';

// Build a docx.Table from a parsed { rows: string[][] } table structure
export function createTableParagraph(table) {
    const rows = table.rows.map((row, rowIndex) => {
        const isHeaderRow = rowIndex === 0;
        return new docx.TableRow({
            tableHeader: isHeaderRow,
            children: row.map(cell => {
                const cleanCell = stripHtmlTags(cell || '');
                return new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: cleanCell || '',
                            bold: isHeaderRow,
                            color: isHeaderRow ? 'FFFFFF' : '1F2937'
                        })],
                        spacing: { line: 240 }
                    })],
                    borders: {
                        top: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        bottom: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        left: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
                        right: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 }
                    },
                    shading: isHeaderRow ? {
                        type: docx.ShadingType.CLEAR,
                        color: 'FFFFFF',
                        fill: '2563EB'
                    } : undefined
                });
            })
        });
    });

    return new docx.Table({
        rows: rows,
        width: {
            size: 100,
            type: 'pct'
        },
        borders: {
            top: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            bottom: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            left: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            right: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            insideHorizontal: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 },
            insideVertical: { color: '000000', space: 0, style: docx.BorderStyle.SINGLE, size: 8 }
        }
    });
}
