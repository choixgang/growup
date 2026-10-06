/** 사진을 긴 변 maxSize 픽셀의 JPEG로 줄인다 (모바일 업로드·저장 용량 절약) */
export async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('사진을 변환하지 못했어요'))), 'image/jpeg', quality),
  )
}
