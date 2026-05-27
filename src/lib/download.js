// 이미지/영상 URL을 받아 실제 파일로 다운로드합니다.
// 교차 출처 URL은 <a download>로는 저장되지 않으므로 blob으로 받아 처리합니다.
export async function downloadUrl(url, baseName = 'image') {
  const res = await fetch(url)
  const blob = await res.blob()
  const ext = (blob.type.split('/')[1] || 'png').split('+')[0]
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objUrl
  a.download = `${baseName}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objUrl)
}
