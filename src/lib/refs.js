// 자주 쓰는 레퍼런스 이미지(인물 시트 등)를 브라우저(IndexedDB)에 저장해 재사용합니다.
// img2img에서 매번 업로드하지 않고 토글로 선택할 수 있게 합니다.

const DB_NAME = 'studio-refs'
const STORE = 'refs'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function addRef(ref) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(ref)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listRefs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt))
    req.onerror = () => reject(req.error)
  })
}

export async function deleteRef(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 저장된 레퍼런스를 업로드용 File로 변환 (확장자 포함)
export function refToFile(ref) {
  const ext = (ref.type && ref.type.split('/')[1]) || 'png'
  return new File([ref.blob], `ref-${ref.id}.${ext}`, { type: ref.type || 'image/png' })
}
