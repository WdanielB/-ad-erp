'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Loader2, Check, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/utils/supabase/client'

interface CSVProduct {
    name: string
    type: 'standard' | 'flower' | 'composite'
    price: number
    cost: number
    stock: number
    sku: string
    description: string
    image_url: string
    flower_color_name: string
    flower_color_hex: string
    care_days_water: number
    care_days_cut: number
    labor_cost: number
    main_flower: string // name of main flower (will resolve to ID)
    recipe: string // Format: "Rosa Roja:5,Gypsophila:3" (product_name:quantity)
    units_per_package: number
}

interface ImportResult {
    success: number
    errors: string[]
}

interface CSVImportDialogProps {
    onImportComplete: () => void
}

export function CSVImportDialog({ onImportComplete }: CSVImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [csvData, setCsvData] = useState<CSVProduct[]>([])
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [rawHeaders, setRawHeaders] = useState<string[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, keyof CSVProduct | ''>>({})
    const [rawRows, setRawRows] = useState<string[][]>([])
    const [encoding, setEncoding] = useState<'auto' | 'utf-8' | 'windows-1252'>('auto')
    const [pasteFirstRowHeader, setPasteFirstRowHeader] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function downloadTemplate() {
        const headers = [
            'name', 'type', 'price', 'cost', 'stock', 'sku', 'description', 'image_url',
            'flower_color_name', 'flower_color_hex', 'care_days_water', 'care_days_cut',
            'labor_cost', 'main_flower', 'recipe', 'units_per_package'
        ]
        const exampleRows = [
            ['Rosa Roja Importada', 'flower', '5', '2.5', '100', 'ROSA-ROJA', 'Rosa premium importada',
                'https://ejemplo.com/rosa.jpg', 'Rojo', '#FF0000', '2', '3', '', '', '', '25'],
            ['Gypsophila', 'flower', '3', '1.5', '50', 'GYPS-01', 'Flor de relleno',
                'https://ejemplo.com/gypsophila.jpg', 'Blanco', '#FFFFFF', '3', '4', '', '', '', '10'],
            ['Ramo Clásico 12 Rosas', 'composite', '120', '60', '', 'RAMO-12R', 'Ramo de 12 rosas rojas',
                'https://ejemplo.com/ramo12.jpg', '', '', '', '', '15', 'Rosa Roja Importada', 'Rosa Roja Importada:12,Gypsophila:5', ''],
        ]

        const csvContent = [headers.join(','), ...exampleRows.map(r => r.join(','))].join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'plantilla_productos.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    function parseCSV(text: string) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length < 2) return { headers: [] as string[], rows: [] as string[][] }

        const headerLine = lines[0].replace(/^\uFEFF/, '')
        const commaCount = (headerLine.match(/,/g) || []).length
        const semiCount = (headerLine.match(/;/g) || []).length
        const delimiter = semiCount > commaCount ? ';' : ','

        const headers = headerLine.split(delimiter).map(h => h.trim())
        const rows: string[][] = []

        for (let i = 1; i < lines.length; i++) {
            const values: string[] = []
            let current = ''
            let inQuotes = false
            for (const char of lines[i]) {
                if (char === '"') { inQuotes = !inQuotes }
                else if (char === delimiter && !inQuotes) { values.push(current.trim()); current = '' }
                else { current += char }
            }
            values.push(current.trim())
            rows.push(values)
        }

        return { headers, rows }
    }

    function buildProducts(headers: string[], rows: string[][], mapping: Record<string, keyof CSVProduct | ''>) {
        const products: CSVProduct[] = []
        for (const row of rows) {
            const raw: any = {}
            headers.forEach((header, idx) => {
                raw[header] = row[idx] || ''
            })

            const mapped: any = {}
            Object.entries(mapping).forEach(([header, field]) => {
                if (!field) return
                mapped[field] = raw[header] ?? ''
            })

            products.push({
                name: mapped.name || '',
                type: (['standard', 'flower', 'composite'].includes(mapped.type) ? mapped.type : 'standard') as any,
                price: parseFloat(mapped.price) || 0,
                cost: parseFloat(mapped.cost) || 0,
                stock: parseInt(mapped.stock) || 0,
                sku: mapped.sku || '',
                description: mapped.description || '',
                image_url: mapped.image_url || '',
                flower_color_name: mapped.flower_color_name || '',
                flower_color_hex: mapped.flower_color_hex || '',
                care_days_water: parseInt(mapped.care_days_water) || 2,
                care_days_cut: parseInt(mapped.care_days_cut) || 3,
                labor_cost: parseFloat(mapped.labor_cost) || 0,
                main_flower: mapped.main_flower || '',
                recipe: mapped.recipe || '',
                units_per_package: parseInt(mapped.units_per_package) || 0,
            })
        }
        return products.filter(p => p.name)
    }

    const csvColumns: Array<keyof CSVProduct> = [
        'name', 'type', 'price', 'cost', 'stock', 'sku', 'description', 'image_url',
        'flower_color_name', 'flower_color_hex', 'care_days_water', 'care_days_cut',
        'labor_cost', 'main_flower', 'recipe', 'units_per_package'
    ]

    function buildMapping(headers: string[]) {
        const initialMapping: Record<string, keyof CSVProduct | ''> = {}
        headers.forEach(h => {
            const normalized = h.trim().toLowerCase()
            const match = csvColumns.find(c => c.toLowerCase() === normalized)
            initialMapping[h] = match || ''
        })
        return initialMapping
    }

    function updateCsvCell(index: number, field: keyof CSVProduct, value: string) {
        const numberFields: Array<keyof CSVProduct> = [
            'price', 'cost', 'stock', 'care_days_water', 'care_days_cut', 'labor_cost', 'units_per_package'
        ]

        setCsvData(prev => prev.map((row, i) => {
            if (i !== index) return row
            if (numberFields.includes(field)) {
                const parsed = field === 'stock' || field === 'care_days_water' || field === 'care_days_cut' || field === 'units_per_package'
                    ? parseInt(value) || 0
                    : parseFloat(value) || 0
                return { ...row, [field]: parsed } as CSVProduct
            }
            return { ...row, [field]: value } as CSVProduct
        }))
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer
            const decodeWith = (enc: 'utf-8' | 'windows-1252') => new TextDecoder(enc).decode(buffer)

            let text = ''
            if (encoding === 'utf-8') {
                text = decodeWith('utf-8')
            } else if (encoding === 'windows-1252') {
                text = decodeWith('windows-1252')
            } else {
                const utf8 = decodeWith('utf-8')
                text = utf8.includes('�') ? decodeWith('windows-1252') : utf8
            }

            const parsed = parseCSV(text)
            setRawHeaders(parsed.headers)
            setRawRows(parsed.rows)
            const initialMapping = buildMapping(parsed.headers)
            setColumnMapping(initialMapping)

            setCsvData(buildProducts(parsed.headers, parsed.rows, initialMapping))
            setResult(null)
        }
        reader.readAsArrayBuffer(file)
    }

    function parsePastedTable(text: string) {
        const lines = text.split(/\r?\n/).filter(l => l.length > 0)
        const rows = lines.map(line => line.split('\t'))
        if (rows.length === 0) return { headers: [] as string[], rows: [] as string[][] }

        if (pasteFirstRowHeader) {
            const headers = rows[0].map(h => h.trim())
            return { headers, rows: rows.slice(1) }
        }

        const maxCols = Math.max(...rows.map(r => r.length))
        const headers = Array.from({ length: maxCols }, (_, i) => `col_${i + 1}`)
        return { headers, rows }
    }

    function handlePasteTable(e: React.ClipboardEvent<HTMLTextAreaElement>) {
        e.preventDefault()
        const text = e.clipboardData.getData('text')
        if (!text) return

        const parsed = parsePastedTable(text)
        setRawHeaders(parsed.headers)
        setRawRows(parsed.rows)

        const initialMapping = buildMapping(parsed.headers)
        setColumnMapping(initialMapping)

        setCsvData(buildProducts(parsed.headers, parsed.rows, initialMapping))
        setResult(null)
    }

    function handleMappingChange(header: string, field: keyof CSVProduct | '') {
        const next = { ...columnMapping, [header]: field }
        setColumnMapping(next)
        if (rawHeaders.length > 0) {
            setCsvData(buildProducts(rawHeaders, rawRows, next))
        }
    }

    async function handleImport() {
        if (csvData.length === 0) return
        setImporting(true)
        const errors: string[] = []
        let success = 0

        try {
            // First, get existing products for reference (main_flower and recipe resolution)
            const { data: existingRaw } = await supabase
                .from('products')
                .select('id, name')

            const existingProducts = (existingRaw ?? []) as { id: string; name: string }[]
            const productNameToId: Record<string, string> = {}
            existingProducts.forEach(p => {
                productNameToId[p.name.toLowerCase()] = p.id
            })

            // Import products in order: flowers first, then standard, then composite
            const sorted = [...csvData].sort((a, b) => {
                const order = { flower: 0, standard: 1, composite: 2 }
                return (order[a.type] || 1) - (order[b.type] || 1)
            })

            for (let i = 0; i < sorted.length; i++) {
                const row = sorted[i]
                try {
                    const insertData: any = {
                        name: row.name,
                        type: row.type,
                        price: row.price,
                        cost: row.cost || null,
                        stock: row.type !== 'composite' ? row.stock : null,
                        sku: row.sku || null,
                        description: row.description || null,
                        image_url: row.image_url || null,
                        units_per_package: row.units_per_package || null,
                        is_active: true,
                    }

                    if (row.type === 'flower') {
                        insertData.flower_color_name = row.flower_color_name || null
                        insertData.flower_color_hex = row.flower_color_hex || null
                        insertData.care_days_water = row.care_days_water || null
                        insertData.care_days_cut = row.care_days_cut || null
                    }

                    if (row.type === 'composite') {
                        insertData.labor_cost = row.labor_cost || null
                        // Resolve main_flower name to ID
                        if (row.main_flower) {
                            const mainFlowerId = productNameToId[row.main_flower.toLowerCase()]
                            if (mainFlowerId) insertData.main_flower_id = mainFlowerId
                        }
                    }

                    const { data: newProduct, error } = await (supabase.from('products') as any)
                        .insert(insertData).select().single()

                    if (error) {
                        errors.push(`Fila ${i + 2}: ${row.name} - ${error.message}`)
                        continue
                    }

                    // Register in lookup for future recipe references
                    productNameToId[row.name.toLowerCase()] = newProduct.id

                    // Save recipe for composite products
                    if (row.type === 'composite' && row.recipe) {
                        const recipeParts = row.recipe.split(',').map(r => r.trim())
                        const recipeItems = recipeParts.map(part => {
                            const [name, qty] = part.split(':').map(s => s.trim())
                            const childId = productNameToId[name.toLowerCase()]
                            return { parent_product_id: newProduct.id, child_product_id: childId, quantity: parseInt(qty) || 1 }
                        }).filter(r => r.child_product_id)

                        if (recipeItems.length > 0) {
                            await (supabase.from('product_recipes') as any).insert(recipeItems)
                        }
                    }

                    success++
                } catch (err: any) {
                    errors.push(`Fila ${i + 2}: ${row.name} - ${err.message || 'Error desconocido'}`)
                }
            }
        } catch (err: any) {
            errors.push(`Error general: ${err.message}`)
        }

        setResult({ success, errors })
        setImporting(false)

        if (success > 0) {
            onImportComplete()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setCsvData([]); setResult(null) } }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Importar Productos desde CSV
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Download template */}
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                            <p className="text-sm font-medium">Plantilla CSV</p>
                            <p className="text-xs text-muted-foreground">
                                Descarga la plantilla con los campos correctos y ejemplos
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Plantilla
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>Archivo CSV</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                            />
                            <Select value={encoding} onValueChange={(v) => setEncoding(v as any)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Codificación" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto (recomendado)</SelectItem>
                                    <SelectItem value="utf-8">UTF-8</SelectItem>
                                    <SelectItem value="windows-1252">Windows-1252</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Campos: name, type (standard/flower/composite), price, cost, stock, sku, description, image_url,
                            flower_color_name, flower_color_hex, care_days_water, care_days_cut,
                            labor_cost, main_flower, recipe (nombre:cantidad,...), units_per_package
                        </p>
                    </div>

                    {/* Paste from Excel */}
                    <div className="space-y-2">
                        <Label>Pegar desde Excel</Label>
                        <Textarea
                            placeholder="Pega aquí (Ctrl+V) el rango de Excel..."
                            onPaste={handlePasteTable}
                            className="min-h-24"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Input
                                id="paste-first-row"
                                type="checkbox"
                                checked={pasteFirstRowHeader}
                                onChange={(e) => setPasteFirstRowHeader(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="paste-first-row" className="text-xs">
                                La primera fila es encabezado
                            </Label>
                        </div>
                    </div>

                    {/* Column Mapping */}
                    {rawHeaders.length > 0 && !result && (
                        <div className="space-y-2">
                            <Label>Reubicar columnas</Label>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                                    {rawHeaders.map((header) => (
                                        <div key={header} className="flex items-center gap-2">
                                            <div className="text-xs text-muted-foreground w-40 truncate" title={header}>
                                                {header}
                                            </div>
                                            <Select
                                                value={columnMapping[header] || '__none__'}
                                                onValueChange={(value) => handleMappingChange(header, value === '__none__' ? '' : (value as keyof CSVProduct))}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Sin asignar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">Sin asignar</SelectItem>
                                                    {csvColumns.map((col) => (
                                                        <SelectItem key={col} value={col}>
                                                            {col}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Asigna cada columna del CSV al campo correcto.</p>
                        </div>
                    )}

                    {/* Preview */}
                    {csvData.length > 0 && !result && (
                        <div className="space-y-2">
                            <Label>Vista previa editable ({csvData.length} productos)</Label>
                            <div className="rounded-md border overflow-hidden">
                                <ScrollArea className="h-64">
                                    <div className="min-w-[1400px]">
                                        <div className="grid" style={{ gridTemplateColumns: `repeat(${csvColumns.length}, minmax(140px, 1fr))` }}>
                                            {csvColumns.map((col) => (
                                                <div key={col} className="px-2 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/40">
                                                    {col}
                                                </div>
                                            ))}
                                            {csvData.map((row, idx) => (
                                                <>
                                                    {csvColumns.map((col) => (
                                                        <div key={`${idx}-${col}`} className="px-2 py-1 border-b">
                                                            <Input
                                                                value={(row[col] ?? '') as any}
                                                                onChange={(e) => updateCsvCell(idx, col, e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    ))}
                                                </>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                            <p className="text-xs text-muted-foreground">Edita cualquier celda antes de importar.</p>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <Check className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-700">
                                    {result.success} productos importados correctamente
                                </span>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-1">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                        <span className="font-medium text-red-700">{result.errors.length} errores</span>
                                    </div>
                                    <ScrollArea className="h-24">
                                        {result.errors.map((err, idx) => (
                                            <p key={idx} className="text-xs text-red-600">{err}</p>
                                        ))}
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {result ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!result && (
                        <Button onClick={handleImport} disabled={csvData.length === 0 || importing}>
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {importing ? 'Importando...' : `Importar ${csvData.length} productos`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
