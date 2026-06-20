'use client'

import { Alert } from '@/components/ui/Alert'
import { FileDrop } from '@/components/ui/FileDrop'
import { ExtractedTextPreview } from '@/components/parsers/ExtractedTextPreview'
import { OcrPhotoTips } from '@/components/parsers/OcrPhotoTips'
import { useBoletaUpload } from '@/lib/parsers/use-boleta-upload'
import { RedirectMessage } from '@/components/parsers/RedirectMessage'

export function UploadHub() {
  const { handleFiles, error, ocrStatus, resetKey } = useBoletaUpload('luz')

  return (
    <div>
      <RedirectMessage />
      <FileDrop key={resetKey} onFiles={handleFiles} statusMessage={ocrStatus} />
      <OcrPhotoTips />
      {error && (
        <div className="mt-6">
          <Alert variant="warning">
            <Alert.Title>No pudimos procesar tu boleta</Alert.Title>
            <Alert.Body>{error.message}</Alert.Body>
          </Alert>
          {error.extractedText && (
            <ExtractedTextPreview text={error.extractedText} className="mt-4" />
          )}
        </div>
      )}
    </div>
  )
}
