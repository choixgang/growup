async function resizeToJpeg(bitmap: ImageBitmap, maxSize: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('사진을 변환하지 못했어요'))), 'image/jpeg', quality),
  )
}

/**
 * 사진을 두 벌로 줄인다.
 * - full: 끼니 창에서 크게 볼 사진 (긴 변 1000px, 약 100KB)
 * - thumb: 위클리 목록 미리보기 (긴 변 200px, 약 10KB)
 */
export async function preparePhoto(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const [full, thumb] = await Promise.all([resizeToJpeg(bitmap, 1000, 0.78), resizeToJpeg(bitmap, 200, 0.72)])
    return { full, thumb }
  } finally {
    bitmap.close()
  }
}
