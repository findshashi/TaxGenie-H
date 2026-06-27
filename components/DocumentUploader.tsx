import { useState, useRef } from 'react'

interface FileWithPreview extends File {
  preview?: string
}

export default function DocumentUploader() {
  const [form16, setForm16] = useState<FileWithPreview | null>(null)
  const [form26as, setForm26as] = useState<FileWithPreview | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef16 = useRef<HTMLInputElement>(null)
  const fileInputRef26 = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File, type: 'form16' | 'form26as') => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file)
    })

    if (type === 'form16') {
      setForm16(fileWithPreview)
    } else {
      setForm26as(fileWithPreview)
    }

    setIsUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const removeFile = (type: 'form16' | 'form26as') => {
    if (type === 'form16') {
      if (form16?.preview) URL.revokeObjectURL(form16.preview)
      setForm16(null)
    } else {
      if (form26as?.preview) URL.revokeObjectURL(form26as.preview)
      setForm26as(null)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'form16' | 'form26as') => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0], type)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const FileUploadCard = ({ 
    title, 
    description, 
    type, 
    file, 
    onFileSelect,
    onRemove 
  }: { 
    title: string
    description: string
    type: 'form16' | 'form26as'
    file: FileWithPreview | null
    onFileSelect: (file: File) => void
    onRemove: () => void
  }) => {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:shadow-lg'
        }`}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!file ? (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <i className="fas fa-file-pdf text-4xl text-indigo-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-4">{description}</p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-upload mr-2"></i> Choose File
              </button>
              <p className="text-xs text-gray-400">or drag and drop PDF here</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onFileSelect(e.target.files[0])
                }
              }}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-file-pdf text-2xl text-indigo-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="fas fa-cloud-upload-alt"></i>
            <span>Secure Document Upload</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Upload Your Tax Documents
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Securely upload your Form 16 and Form 26AS. All files are encrypted and protected.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FileUploadCard
            title="Form 16"
            description="Upload your salary TDS certificate"
            type="form16"
            file={form16}
            onFileSelect={(file) => handleFileUpload(file, 'form16')}
            onRemove={() => removeFile('form16')}
          />
          <FileUploadCard
            title="Form 26AS"
            description="Upload your tax credit statement"
            type="form26as"
            file={form26as}
            onFileSelect={(file) => handleFileUpload(file, 'form26as')}
            onRemove={() => removeFile('form26as')}
          />
        </div>

        {form16 && form26as && (
          <div className="mt-8 text-center p-6 bg-green-50 border border-green-200 rounded-2xl animate-fadeIn">
            <i className="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
            <p className="text-green-700 font-semibold">All documents uploaded successfully!</p>
            <p className="text-sm text-green-600 mt-1">Your documents are ready for processing.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </section>
  )
}
