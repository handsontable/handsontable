import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';
const CDN_READ_EXCEL_FILE = 'https://cdn.jsdelivr.net/npm/read-excel-file@9.3.10/bundle/read-excel-file.min.js';
const scriptPromises = new Map();
function loadScript(src) {
    const cached = scriptPromises.get(src);
    if (cached) {
        return cached;
    }
    const p = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-cdn="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            if (existing.getAttribute('data-loaded') === '1') {
                resolve();
            }
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.dataset.cdn = src;
        s.onload = () => {
            s.setAttribute('data-loaded', '1');
            resolve();
        };
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
    scriptPromises.set(src, p);
    return p;
}
async function ensurePapa() {
    if (typeof window.Papa !== 'undefined') {
        return window.Papa;
    }
    await loadScript(CDN_PAPAPARSE);
    if (typeof window.Papa === 'undefined') {
        throw new Error('PapaParse did not register on window.');
    }
    return window.Papa;
}
async function ensureReadExcelFile() {
    if (typeof window.readXlsxFile !== 'undefined') {
        return window.readXlsxFile;
    }
    await loadScript(CDN_READ_EXCEL_FILE);
    if (typeof window.readXlsxFile === 'undefined') {
        throw new Error('read-excel-file did not register on window.');
    }
    return window.readXlsxFile;
}
function extensionOf(name) {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}
function showError(el, message) {
    if (!el) {
        return;
    }
    el.textContent = message;
    el.hidden = false;
}
function clearError(el) {
    if (!el) {
        return;
    }
    el.textContent = '';
    el.hidden = true;
}
function normalizeCellValue(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    const text = String(value).trim();
    return text === '' ? null : text;
}
function mapRowByHeaders(row, headers) {
    const out = {};
    for (const key of headers) {
        out[key] = normalizeCellValue(row[key]);
    }
    return out;
}
function processPapaResults(results) {
    if (results.errors.length > 0) {
        throw new Error(results.errors[0].message || 'CSV parse error.');
    }
    const fields = results.meta.fields?.filter((f) => f !== undefined && f !== '') ?? [];
    if (fields.length === 0) {
        throw new Error('No header row found in the CSV.');
    }
    const rows = results.data.map((row) => mapRowByHeaders(row, fields));
    if (rows.length === 0) {
        throw new Error('No data rows after the header.');
    }
    return { headers: fields, rows };
}
function parseCsvText(text, PapaRef) {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('The file is empty.');
    }
    const parsed = PapaRef.parse(trimmed, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
    });
    return processPapaResults(parsed);
}
async function parseCsvFile(file, PapaRef) {
    return new Promise((resolve, reject) => {
        PapaRef.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy',
            transformHeader: (h) => h.trim(),
            complete: (results) => {
                try {
                    resolve(processPapaResults(results));
                }
                catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e)));
                }
            },
            error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
        });
    });
}
async function parseXlsxFile(file, readXlsxFileRef) {
    let sheets;
    try {
        sheets = await readXlsxFileRef(file);
    }
    catch {
        throw new Error('Could not read the Excel workbook. The file may be corrupted.');
    }
    const firstSheet = sheets[0];
    if (!firstSheet) {
        throw new Error('The workbook has no sheets.');
    }
    const matrix = firstSheet.data;
    if (!matrix.length) {
        throw new Error('The sheet is empty.');
    }
    const rawHeader = matrix[0].map((cell) => String(cell ?? '').trim());
    if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
        throw new Error('No header row found in the Excel sheet.');
    }
    const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));
    const rows = [];
    for (let r = 1; r < matrix.length; r++) {
        const line = matrix[r];
        const allEmpty = !line || line.every((c) => normalizeCellValue(c) === null);
        if (allEmpty) {
            continue;
        }
        const obj = {};
        for (let c = 0; c < keys.length; c++) {
            const key = keys[c];
            const raw = line[c];
            obj[key] = normalizeCellValue(raw);
        }
        rows.push(obj);
    }
    if (rows.length === 0) {
        throw new Error('No data rows after the header.');
    }
    return { headers: keys, rows };
}
async function parseFile(file) {
    const ext = extensionOf(file.name);
    if (ext === 'csv') {
        const PapaRef = await ensurePapa();
        return parseCsvFile(file, PapaRef);
    }
    if (ext === 'xlsx') {
        const readXlsxFileRef = await ensureReadExcelFile();
        return parseXlsxFile(file, readXlsxFileRef);
    }
    throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}
const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;
function columnsFromHeaders(headers, rows) {
    return headers.map((data) => {
        const values = rows
            .map((row) => row[data])
            .filter((v) => v !== null);
        if (values.length > 0 && values.every((v) => typeof v === 'number')) {
            return { data, type: 'numeric' };
        }
        if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
            return { data, type: 'checkbox' };
        }
        return { data, type: 'text' };
    });
}
const gridContainer = document.querySelector('#example1');
const emptyEl = document.querySelector('#import-empty');
const errEl = document.querySelector('#import-error');
const fileInput = document.querySelector('#import-file');
const dropzone = document.querySelector('#import-dropzone');
const sampleBtn = document.querySelector('#import-load-sample');
let hot = null;
function loadIntoGrid({ headers, rows }) {
    const columns = columnsFromHeaders(headers, rows);
    if (!hot) {
        if (emptyEl) {
            emptyEl.hidden = true;
        }
        if (gridContainer) {
            gridContainer.hidden = false;
        }
        hot = new Handsontable(gridContainer, {
            data: rows,
            columns,
            colHeaders: headers,
            rowHeaders: true,
            height: 'auto',
            width: '100%',
            licenseKey: 'non-commercial-and-evaluation',
        });
    }
    else {
        hot.updateSettings({ colHeaders: headers, columns });
        hot.loadData(rows);
    }
}
async function handleFile(file) {
    clearError(errEl);
    if (!file) {
        return;
    }
    if (file.size === 0) {
        showError(errEl, 'The file is empty.');
        return;
    }
    try {
        const payload = await parseFile(file);
        loadIntoGrid(payload);
    }
    catch (e) {
        showError(errEl, e instanceof Error ? e.message : String(e));
    }
}
fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    handleFile(f);
    fileInput.value = '';
});
dropzone?.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    dropzone.classList.add('import-dropzone--active');
});
dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('import-dropzone--active');
});
dropzone?.addEventListener('drop', (ev) => {
    ev.preventDefault();
    dropzone.classList.remove('import-dropzone--active');
    const f = ev.dataTransfer?.files?.[0];
    handleFile(f);
});
sampleBtn?.addEventListener('click', async () => {
    clearError(errEl);
    try {
        const PapaRef = await ensurePapa();
        const payload = parseCsvText(SAMPLE_CSV, PapaRef);
        loadIntoGrid(payload);
    }
    catch (e) {
        showError(errEl, e instanceof Error ? e.message : String(e));
    }
});
