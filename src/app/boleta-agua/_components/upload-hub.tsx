'use client'

import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FileDrop } from '@/components/ui/FileDrop'
import { ExtractedTextPreview } from '@/components/parsers/ExtractedTextPreview'
import { OcrPhotoTips } from '@/components/parsers/OcrPhotoTips'
import { useBoletaUpload } from '@/lib/parsers/use-boleta-upload'

export function UploadHubAgua() {
  const { handleFile, error, ocrStatus, resetKey } = useBoletaUpload('agua')

  return (
    <div>
      <FileDrop key={resetKey} onFile={handleFile} statusMessage={ocrStatus} />
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
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/boleta-luz">Ver boleta de luz</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
