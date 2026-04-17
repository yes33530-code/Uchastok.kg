'use client'
import { useRef, useState, useEffect } from 'react'
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { deletePlotFile, getPlotFileUrl } from '@/actions/files'
import type { PlotFile } from '@/types/plot'

interface Props {
  plotId: string
  initialFiles: PlotFile[]
  dark?: boolean
}

function fileBg(mimeType: string | null) {
  if (!mimeType) return '#334155'
  if (mimeType.startsWith('image/')) return '#312e81'
  if (mimeType === 'application/pdf') return '#7f1d1d'
  if (mimeType.includes('word') || mimeType.includes('document')) return '#1e3a5f'
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '#14532d'
  return '#1e293b'
}

function FileThumb({ file, previewUrl, onClick }: { file: PlotFile; previewUrl?: string; onClick: () => void }) {
  const isImage = file.mime_type?.startsWith('image/')
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ backgroundColor: fileBg(file.mime_type) }}
      title="Открыть"
    >
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      ) : isImage ? (
        <Image className="w-5 h-5 text-indigo-300" />
      ) : file.mime_type === 'application/pdf' ? (
        <FileText className="w-5 h-5 text-red-300" />
      ) : (
        <File className="w-5 h-5 text-slate-300" />
      )}
    </button>
  )
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileAttachments({ plotId, initialFiles, dark }: Props) {
  const [files, setFiles] = useState<PlotFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const d = dark ?? false

  // Load signed URLs for image thumbnails
  useEffect(() => {
    const imageFiles = files.filter(f => f.mime_type?.startsWith('image/') && f.storage_path && !previewUrls[f.id])
    if (imageFiles.length === 0) return
    imageFiles.forEach(async f => {
      try {
        const url = await getPlotFileUrl(f.storage_path)
        setPreviewUrls(prev => ({ ...prev, [f.id]: url }))
      } catch { /* ignore */ }
    })
  }, [files])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightbox])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    const fileList = Array.from(selected)
    if (inputRef.current) inputRef.current.value = ''
    setUploading(true)
    try {
      for (const file of fileList) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name}: превышает 50 МБ`)
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('plotId', plotId)

        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Ошибка загрузки')

        setFiles(prev => [...prev, json.file as PlotFile])
      }
      toast.success('Файл загружен')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(file: PlotFile) {
    if (!confirm(`Удалить "${file.name}"?`)) return
    setDeletingId(file.id)
    try {
      await deletePlotFile(file.id, file.storage_path, plotId)
      setFiles(prev => prev.filter(f => f.id !== file.id))
      setPreviewUrls(prev => { const n = { ...prev }; delete n[file.id]; return n })
      toast.success('Файл удалён')
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleOpen(file: PlotFile) {
    try {
      const url = previewUrls[file.id] || await getPlotFileUrl(file.storage_path)
      if (file.mime_type?.startsWith('image/')) {
        if (!previewUrls[file.id]) setPreviewUrls(prev => ({ ...prev, [file.id]: url }))
        setLightbox({ url, name: file.name })
      } else {
        window.open(url, '_blank')
      }
    } catch {
      toast.error('Не удалось открыть файл')
    }
  }

  async function handleDownload(file: PlotFile) {
    try {
      const url = await getPlotFileUrl(file.storage_path)
      window.open(url, '_blank')
    } catch {
      toast.error('Не удалось открыть файл')
    }
  }

  const wrapCls = d
    ? 'rounded-xl p-4'
    : 'bg-white rounded-xl border border-gray-200 p-6'
  const wrapStyle = d ? { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' } : {}

  return (
    <>
      <div className={wrapCls} style={wrapStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${d ? 'text-white/80' : 'text-gray-900'}`}>
            <Paperclip className={`w-4 h-4 ${d ? 'text-white/30' : 'text-gray-400'}`} />
            Файлы
            {files.length > 0 && (
              <span className={`text-xs font-medium ${d ? 'text-white/30' : 'text-gray-400'}`}>({files.length})</span>
            )}
          </h3>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 transition-colors ${d ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>

        {files.length === 0 ? (
          <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${d ? 'border-white/10 hover:border-indigo-500/40 hover:bg-white/3' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
          >
            <Upload className={`w-6 h-6 mx-auto mb-2 ${d ? 'text-white/20' : 'text-gray-300'}`} />
            <p className={`text-sm ${d ? 'text-white/30' : 'text-gray-400'}`}>Нажмите или перетащите файлы</p>
            <p className={`text-xs mt-1 ${d ? 'text-white/20' : 'text-gray-300'}`}>До 50 МБ, любой формат</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg group transition-colors ${d ? 'hover:bg-white/5' : 'border border-gray-100 hover:bg-gray-50'}`}
                style={d ? { border: '1px solid rgba(255,255,255,0.06)' } : {}}
              >
                <FileThumb
                  file={file}
                  previewUrl={previewUrls[file.id]}
                  onClick={() => handleOpen(file)}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate cursor-pointer hover:underline ${d ? 'text-white/70' : 'text-gray-900'}`}
                    onClick={() => handleOpen(file)}
                  >
                    {file.name}
                  </p>
                  {file.size && <p className={`text-xs ${d ? 'text-white/30' : 'text-gray-400'}`}>{formatBytes(file.size)}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {file.storage_path && !file.mime_type?.startsWith('image/') && (
                    <button
                      onClick={() => handleDownload(file)}
                      className={`p-1.5 rounded transition-colors ${d ? 'text-white/30 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'}`}
                      title="Открыть в новой вкладке"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {file.storage_path && file.mime_type?.startsWith('image/') && (
                    <button
                      onClick={() => handleDownload(file)}
                      className={`p-1.5 rounded transition-colors ${d ? 'text-white/30 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'}`}
                      title="Скачать"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deletingId === file.id}
                    className={`p-1.5 rounded transition-colors disabled:opacity-40 ${d ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 py-2 text-xs border border-dashed rounded-lg transition-colors disabled:opacity-50 ${d ? 'text-white/30 border-white/10 hover:border-indigo-500/40 hover:text-indigo-400' : 'text-gray-400 border-gray-200 hover:text-indigo-600 hover:border-indigo-300'}`}
            >
              <Upload className="w-3.5 h-3.5" />
              Добавить файлы
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-5 pointer-events-none">
            <p className="text-white/60 text-sm truncate max-w-[70vw]">{lightbox.name}</p>
            <button
              className="pointer-events-auto p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
