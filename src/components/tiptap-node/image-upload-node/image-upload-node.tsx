"use client"

import { useRef, useState } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { CloseIcon } from "@/components/tiptap-icons/close-icon"
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss"
import { focusNextNode, isValidPosition } from "@/lib/tiptap-utils"
import { Upload } from "lucide-react"
import { ImageCropperModal } from "@/components/ui/ImageCropperModal"

export interface FileItem {
  /**
   * Unique identifier for the file item
   */
  id: string
  /**
   * The actual File object being uploaded
   */
  file: File
  /**
   * Current upload progress as a percentage (0-100)
   */
  progress: number
  /**
   * Current status of the file upload process
   * @default "uploading"
   */
  status: "uploading" | "success" | "error"

  /**
   * URL to the uploaded file, available after successful upload
   * @optional
   */
  url?: string
  /**
   * Controller that can be used to abort the upload process
   * @optional
   */
  abortController?: AbortController
}

export interface UploadOptions {
  /**
   * Maximum allowed file size in bytes
   */
  maxSize: number
  /**
   * Maximum number of files that can be uploaded
   */
  limit: number
  /**
   * String specifying acceptable file types (MIME types or extensions)
   * @example ".jpg,.png,image/jpeg" or "image/*"
   */
  accept: string
  /**
   * Function that handles the actual file upload process
   * @param {File} file - The file to be uploaded
   * @param {Function} onProgress - Callback function to report upload progress
   * @param {AbortSignal} signal - Signal that can be used to abort the upload
   * @returns {Promise<string>} Promise resolving to the URL of the uploaded file
   */
  upload: (
    file: File,
    onProgress: (event: { progress: number }) => void,
    signal: AbortSignal
  ) => Promise<string>
  /**
   * Callback triggered when a file is uploaded successfully
   * @param {string} url - URL of the successfully uploaded file
   * @optional
   */
  onSuccess?: (url: string) => void
  /**
   * Callback triggered when an error occurs during upload
   * @param {Error} error - The error that occurred
   * @optional
   */
  onError?: (error: Error) => void
}

interface UploadErrorProps {
  message: string
}

/**
 * Custom hook for managing multiple file uploads with progress tracking and cancellation
 */
function useFileUpload(options: UploadOptions) {
  const [fileItems, setFileItems] = useState<FileItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > options.maxSize) {
      const sizeLimit = options.maxSize / 1024 / 1024
      const actualSize = file.size / 1024 / 1024
      const error = new Error(
        `Image size is greater than ${sizeLimit.toFixed(0)}MB. Uploaded file is ${actualSize.toFixed(2)}MB.`
      )
      setErrorMessage(error.message)
      options.onError?.(error)
      return null
    }

    const abortController = new AbortController()
    const fileId = crypto.randomUUID()

    const newFileItem: FileItem = {
      id: fileId,
      file,
      progress: 0,
      status: "uploading",
      abortController,
    }

    setFileItems((prev) => [...prev, newFileItem])

    try {
      if (!options.upload) {
        throw new Error("Upload function is not defined")
      }

      const url = await options.upload(
        file,
        (event: { progress: number }) => {
          setFileItems((prev) =>
            prev.map((item) =>
              item.id === fileId ? { ...item, progress: event.progress } : item
            )
          )
        },
        abortController.signal
      )

      if (!url) throw new Error("Upload failed: No URL returned")

      if (!abortController.signal.aborted) {
        setFileItems((prev) =>
          prev.map((item) =>
            item.id === fileId
              ? { ...item, status: "success", url, progress: 100 }
              : item
          )
        )
        options.onSuccess?.(url)
        return url
      }

      return null
    } catch (error) {
      if (!abortController.signal.aborted) {
        setFileItems((prev) =>
          prev.map((item) =>
            item.id === fileId
              ? { ...item, status: "error", progress: 0 }
              : item
          )
        )
        options.onError?.(
          error instanceof Error ? error : new Error("Upload failed")
        )
      }
      return null
    }
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) {
      options.onError?.(new Error("No files to upload"))
      return []
    }

    if (options.limit && files.length > options.limit) {
      const error = new Error(
        `Maximum ${options.limit} file${options.limit === 1 ? "" : "s"} allowed`
      )
      setErrorMessage(error.message)
      options.onError?.(error)
      return []
    }

    // Upload all files concurrently
    const uploadPromises = files.map((file) => uploadFile(file))
    const results = await Promise.all(uploadPromises)
    const successUrls = results.filter((url): url is string => url !== null)

    if (successUrls.length > 0) {
      setErrorMessage(null)
    }

    return successUrls
  }

  const removeFileItem = (fileId: string) => {
    setFileItems((prev) => {
      const fileToRemove = prev.find((item) => item.id === fileId)
      if (fileToRemove?.abortController) {
        fileToRemove.abortController.abort()
      }
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((item) => item.id !== fileId)
    })
  }

  const clearError = () => setErrorMessage(null)

  const clearAllFiles = () => {
    fileItems.forEach((item) => {
      if (item.abortController) {
        item.abortController.abort()
      }
      if (item.url) {
        URL.revokeObjectURL(item.url)
      }
    })
    setFileItems([])
  }

  return {
    fileItems,
    uploadFiles,
    removeFileItem,
    clearAllFiles,
    errorMessage,
    setErrorMessage,
  }
}



interface ImageUploadDragAreaProps {
  /**
   * Callback function triggered when files are dropped or selected
   * @param {File[]} files - Array of File objects that were dropped or selected
   */
  onFile: (files: File[]) => void
  /**
   * Render prop pattern to allow children to access drag states
   */
  children: (props: { isDragActive: boolean; isDragOver: boolean }) => React.ReactNode
}

/**
 * A component that creates a drag-and-drop area for image uploads
 */
const ImageUploadDragArea: React.FC<ImageUploadDragAreaProps> = ({
  onFile,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false)
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFile(files)
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children({ isDragActive, isDragOver })}
    </div>
  )
}

interface ImageUploadPreviewProps {
  /**
   * The file item to preview
   */
  fileItem: FileItem
  /**
   * Callback to remove this file from upload queue
   */
  onRemove: () => void
}

/**
 * Component that displays a preview of an uploading file with progress
 */
const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  fileItem,
  onRemove,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="tiptap-image-upload-preview">
      {fileItem.status === "uploading" && (
        <div
          className="tiptap-image-upload-progress"
          style={{ width: `${fileItem.progress}%` }}
        />
      )}

      <div className="tiptap-image-upload-preview-content">
        <div className="tiptap-image-upload-file-info">
          <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-full mr-3 text-gray-600 dark:text-gray-400">
            <Upload className="w-4 h-4" />
          </div>
          <div className="tiptap-image-upload-details">
            <span className="tiptap-image-upload-text">
              {fileItem.file.name}
            </span>
            <span className="tiptap-image-upload-subtext">
              {formatFileSize(fileItem.file.size)}
            </span>
          </div>
        </div>
        <div className="tiptap-image-upload-actions">
          {fileItem.status === "uploading" && (
            <span className="tiptap-image-upload-progress-text">
              {fileItem.progress}%
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <CloseIcon className="tiptap-button-icon" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const DropZoneContent: React.FC<{ maxSize: number; limit: number; isDragActive: boolean }> = ({
  maxSize,
  limit,
  isDragActive,
}) => (
  <div
    className={`w-full h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 text-center my-4 ${
      isDragActive 
        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 scale-[0.99]' 
        : 'border-gray-300 dark:border-white/20 bg-white/5 hover:border-black dark:hover:border-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'
    }`}
  >
    <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full mb-3 text-gray-600 dark:text-gray-400">
      <Upload className="w-5 h-5 stroke-[1.5]" />
    </div>
    <span className="text-xs font-semibold text-black dark:text-white mb-1">
      Upload Image
    </span>
    <span className="text-[10px] text-gray-400">
      Maximum {limit} file{limit === 1 ? "" : "s"}, {maxSize / 1024 / 1024}MB each.
    </span>
  </div>
)

export const ImageUploadNode: React.FC<NodeViewProps> = (props) => {
  const { accept, limit, maxSize } = props.node.attrs
  const inputRef = useRef<HTMLInputElement>(null)
  const extension = props.extension

  const uploadOptions: UploadOptions = {
    maxSize,
    limit,
    accept,
    upload: extension.options.upload,
    onSuccess: extension.options.onSuccess,
    onError: extension.options.onError,
  }

  const { fileItems, uploadFiles, removeFileItem, clearAllFiles, errorMessage, setErrorMessage } =
    useFileUpload(uploadOptions)

  const [cropperOpen, setCropperOpen] = useState<boolean>(false)
  const [cropSrc, setCropSrc] = useState<string>('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleUpload = async (files: File[]) => {
    setErrorMessage(null)
    const urls = await uploadFiles(files)

    if (urls.length > 0) {
      const pos = props.getPos()

      if (isValidPosition(pos)) {
        const imageNodes = urls.map((url, index) => {
          const filename =
            files[index]?.name.replace(/\.[^/.]+$/, "") || "unknown"
          return {
            type: "image",
            attrs: {
              src: url,
              alt: filename,
              title: filename,
            },
          }
        })

        props.editor.commands.insertContentAt(pos, imageNodes)
        props.deleteNode()
        focusNextNode(props.editor)
      }
    }
  }

  const handleSelectFiles = (files: File[]) => {
    if (!files || files.length === 0) {
      extension.options.onError?.(new Error("No file selected"))
      return
    }
    const file = files[0]
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false)
    const filename = (pendingFile?.name || "image").replace(/\.[^/.]+$/, "") + ".webp"
    const croppedFile = new File([croppedBlob], filename, { type: "image/webp" })
    await handleUpload([croppedFile])
    setPendingFile(null)
    setCropSrc('')
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      extension.options.onError?.(new Error("No file selected"))
      return
    }
    handleSelectFiles(Array.from(files))
  }

  const handleClick = () => {
    if (inputRef.current && fileItems.length === 0) {
      inputRef.current.value = ""
      inputRef.current.click()
    }
  }

  const hasFiles = fileItems.length > 0

  return (
    <NodeViewWrapper
      className="tiptap-image-upload"
      tabIndex={0}
      onClick={handleClick}
    >
      {!hasFiles && (
        <ImageUploadDragArea onFile={handleSelectFiles}>
          {({ isDragActive }) => (
            <DropZoneContent maxSize={maxSize} limit={limit} isDragActive={isDragActive} />
          )}
        </ImageUploadDragArea>
      )}

      {hasFiles && (
        <div className="tiptap-image-upload-previews">
          {fileItems.length > 1 && (
            <div className="tiptap-image-upload-header">
              <span>Uploading {fileItems.length} files</span>
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  clearAllFiles()
                }}
              >
                Clear All
              </Button>
            </div>
          )}
          {fileItems.map((fileItem) => (
            <ImageUploadPreview
              key={fileItem.id}
              fileItem={fileItem}
              onRemove={() => removeFileItem(fileItem.id)}
            />
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="tiptap-image-upload-error" role="alert">
          {errorMessage}
        </div>
      )}

      <input
        ref={inputRef}
        name="file"
        accept={accept}
        type="file"
        multiple={limit > 1}
        onChange={handleChange}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
      />

      {/* Interactive Custom Aspect Ratio Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropSrc}
        aspectRatio={null}
        aspectPresetLabel="Article Image Framing & Crop"
        allowRatioSelection={true}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setCropperOpen(false);
          setCropSrc('');
          setPendingFile(null);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </NodeViewWrapper>
  )
}
