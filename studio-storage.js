'use strict';

const storage = {
  db: null, root: null, folders: null, lastSnapshot: null,
  projectId: crypto.randomUUID(), createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
  timer: null, chain: Promise.resolve(), revision: 0, started: false, pendingChange: false
};
const workFormat = 'our-website-studio';

function openStudioDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('our-website-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbOperation(mode, key, value) {
  return new Promise((resolve, reject) => {
    if (!storage.db) return reject(new Error('브라우저 저장소를 사용할 수 없습니다.'));
    const tx = storage.db.transaction('data', mode);
    const store = tx.objectStore('data');
    const request = mode === 'readonly' ? store.get(key) : store.put(value, key);
    let result;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function workSnapshot() {
  // v2 구조: basic과 logo는 공통, 모델별 데이터는 models에 격리 보존
  // v2 사진 및 문구 데이터를 루트와 모델별 저장소에 중복 저장하지 않는다.
  return structuredClone({
    format: workFormat,
    version: 2,
    projectId: storage.projectId,
    model: state.currentModel, // 마지막 활성 모델
    createdAt: storage.createdAt,
    modifiedAt: storage.modifiedAt,
    basic: state.basic,
    logo: state.logo,
    models: state.models
  });
}

function imageDataValid(value) {
  return typeof value === 'string' && value.length <= 14 * 1024 * 1024 && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

async function validateWork(data) {
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const string = v => typeof v === 'string' && v.length <= 10000;

  if (!object(data) || data.format !== workFormat || !string(data.projectId) ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(data.projectId) || !string(data.createdAt) ||
      !string(data.modifiedAt) || !Number.isFinite(Date.parse(data.createdAt)) ||
      !Number.isFinite(Date.parse(data.modifiedAt)) || !object(data.basic)) {
    throw new Error('지원하지 않거나 손상된 작업 파일입니다.');
  }

  const allowedFields = fields.map(([key]) => key);
  if (Object.entries(data.basic).some(([key, value]) => !allowedFields.includes(key) || !string(value))) {
    throw new Error('기관 정보 형식이 올바르지 않습니다.');
  }

  const supportedModelIds = (window.STUDIO_MODELS || []).map(m => m.id);
  const isV1 = data.version === 1 && data.model === 'A-1' && object(data.text) && object(data.photos);
  const isV2 = data.version === 2 && supportedModelIds.includes(data.model) && object(data.models);

  if (!isV1 && !isV2) {
    throw new Error('지원하지 않는 작업 버전이거나 모델 정보가 올바르지 않습니다.');
  }

  const images = [];
  if (data.logo !== null && data.logo !== undefined) {
    if (!imageDataValid(data.logo)) throw new Error('로고 이미지 형식이 올바르지 않습니다.');
    images.push(data.logo);
  }

  let normalizedModels = {};

  if (isV1) {
    // 기존 v1 저장 자료를 v2 구조로 안전하게 변환 (A-1 모델에 매핑)
    for (const [id, value] of Object.entries(data.text)) {
      if (typeof value === 'object' && value !== null) {
        if (!string(value.plain) || !string(value.emphasis)) throw new Error('문구 데이터 형식이 올바르지 않습니다.');
      } else if (!string(value)) {
        throw new Error('문구 데이터 형식이 올바르지 않습니다.');
      }
    }
    for (const [id, photo] of Object.entries(data.photos)) {
      if (!object(photo) || (photo.alt !== undefined && !string(photo.alt)) || (photo.src !== undefined && !imageDataValid(photo.src))) {
        throw new Error('사진 데이터 형식이 올바르지 않습니다.');
      }
      if (photo.src) images.push(photo.src);
    }
    normalizedModels = {};
    supportedModelIds.forEach(mId => {
      normalizedModels[mId] = mId === 'A-1'
        ? { text: structuredClone(data.text), photos: structuredClone(data.photos) }
        : { text: {}, photos: {} };
    });
  } else {
    // v2 구조 검증
    supportedModelIds.forEach(mId => {
      normalizedModels[mId] = { text: {}, photos: {} };
    });
    for (const [modelId, mData] of Object.entries(data.models)) {
      if (!supportedModelIds.includes(modelId) || !object(mData)) {
        throw new Error(`모델(${modelId}) 데이터 형식이 올바르지 않습니다.`);
      }
      const modelText = mData.text || {};
      const modelPhotos = mData.photos || {};
      if (!object(modelText) || !object(modelPhotos)) {
        throw new Error(`모델(${modelId})의 상세 데이터 형식이 올바르지 않습니다.`);
      }
      for (const [id, value] of Object.entries(modelText)) {
        if (typeof value === 'object' && value !== null) {
          if (!string(value.plain) || !string(value.emphasis)) throw new Error('문구 데이터 형식이 올바르지 않습니다.');
        } else if (!string(value)) {
          throw new Error('문구 데이터 형식이 올바르지 않습니다.');
        }
      }
      for (const [id, photo] of Object.entries(modelPhotos)) {
        if (!object(photo) || (photo.alt !== undefined && !string(photo.alt)) || (photo.src !== undefined && !imageDataValid(photo.src))) {
          throw new Error('사진 데이터 형식이 올바르지 않습니다.');
        }
        if (photo.src) images.push(photo.src);
      }
      normalizedModels[modelId] = {
        text: structuredClone(modelText),
        photos: structuredClone(modelPhotos)
      };
    }
  }

  await Promise.all(images.map(src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = () => reject(new Error('이미지 데이터가 손상되었습니다.'));
    image.src = src;
  })));

  return {
    format: workFormat,
    version: 2,
    projectId: data.projectId,
    model: data.model || 'A-1', // 재실행/복원 시 선택할 모델
    createdAt: data.createdAt,
    modifiedAt: data.modifiedAt,
    basic: structuredClone(data.basic),
    logo: data.logo || null,
    models: normalizedModels
  };
}

async function restoreWork(data) {
  const previous = {
    projectId: storage.projectId,
    createdAt: storage.createdAt,
    modifiedAt: storage.modifiedAt,
    model: state.currentModel,
    basic: structuredClone(state.basic),
    logo: state.logo,
    models: structuredClone(state.models)
  };

  try {
    storage.projectId = data.projectId;
    storage.createdAt = data.createdAt;
    storage.modifiedAt = data.modifiedAt;
    state.basic = data.basic;
    state.logo = data.logo || null;

    const restoredModels = {};
    (window.STUDIO_MODELS || []).forEach(m => {
      restoredModels[m.id] = data.models?.[m.id] ? structuredClone(data.models[m.id]) : { text: {}, photos: {} };
    });
    state.models = restoredModels;

    // 마지막으로 저장된 모델 선택
    const targetModel = data.model || 'A-1';
    await window.studioSwitchModel(targetModel, true);

    window.studioGeneration = (window.studioGeneration || 0) + 1;
  } catch (error) {
    storage.projectId = previous.projectId;
    storage.createdAt = previous.createdAt;
    storage.modifiedAt = previous.modifiedAt;
    state.basic = previous.basic;
    state.logo = previous.logo;
    state.models = previous.models;
    try {
      await window.studioSwitchModel(previous.model, true);
    } catch {}
    throw error;
  }
}

function enqueueAutosave() {
  if (!storage.started) { storage.pendingChange = true; return; }
  storage.revision++;
  storage.modifiedAt = new Date().toISOString();
  clearTimeout(storage.timer);
  setStatus('변경 사항 자동 저장 대기 중');
  storage.timer = setTimeout(() => {
    const revision = storage.revision;
    const snapshot = workSnapshot();
    storage.chain = storage.chain.catch(() => {}).then(() => dbOperation('readwrite', 'autosave', snapshot));
    storage.chain.then(() => {
      if (revision === storage.revision) setStatus('브라우저에 자동 저장됨 · 작업 파일도 별도로 저장할 수 있습니다.');
    }).catch(() => setStatus('자동 저장 실패 · 저장하기를 눌러 작업 파일을 내려받으세요.'));
  }, 1000);
}
window.studioChanged = enqueueAutosave;

editor.addEventListener('input', event => {
  if (event.target.matches('input:not([type=file]),textarea')) enqueueAutosave();
});

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function createFolders(root) {
  const base = await root.getDirectoryHandle('우리들의 웹사이트 스튜디오', { create: true });
  return {
    base,
    works: await base.getDirectoryHandle('작업물 보관함', { create: true }),
    finished: await base.getDirectoryHandle('홈페이지 완성본', { create: true }),
    backups: await base.getDirectoryHandle('백업', { create: true })
  };
}

async function permission(handle, ask) {
  const options = { mode: 'readwrite' };
  if (await handle.queryPermission(options) === 'granted') return true;
  return ask && await handle.requestPermission(options) === 'granted';
}

async function uniqueWrite(directory, name, contents) {
  try {
    await directory.getFileHandle(name);
    throw new Error('같은 이름의 파일이 있어 덮어쓰기를 중단했습니다.');
  } catch (error) {
    if (error.name !== 'NotFoundError') throw error;
  }
  const handle = await directory.getFileHandle(name, { create: true });
  const writer = await handle.createWritable();
  try {
    await writer.write(contents);
    await writer.close();
  } catch (error) {
    try { await writer.abort(); } catch {}
    throw error;
  }
  return handle;
}

async function connectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus('이 브라우저는 폴더 연결을 지원하지 않습니다. 저장하기에서 다운로드하세요.');
    return false;
  }
  try {
    let handle = storage.root;
    if (!handle || await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
      if (handle && await permission(handle, true)) { /* restored handle */ }
      else handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    }
    if (!await permission(handle, false)) throw new Error('폴더 쓰기 권한이 필요합니다.');
    const folders = await createFolders(handle);
    storage.root = handle;
    storage.folders = folders;
    storage.lastSnapshot = null;
    let remembered = true;
    if (storage.db) {
      try {
        await dbOperation('readwrite', 'folder', handle);
        await dbOperation('readwrite', 'folderMode', 'folder');
      } catch { remembered = false; }
    } else remembered = false;
    $('#folder-note').textContent = `${handle.name} / 우리들의 웹사이트 스튜디오`;
    setStatus(remembered ? '작업 폴더가 연결되었습니다.' : '폴더는 연결되었지만 다음 실행을 위한 연결 정보는 저장하지 못했습니다.');
    return true;
  } catch (error) {
    const message = error.name === 'AbortError' ? '폴더 선택이 취소되었습니다. 다시 선택하거나 다운로드 방식으로 시작할 수 있습니다.' : `폴더 연결 실패: ${error.message}`;
    setStatus(message);
    $('#welcome-message').textContent = message;
    return false;
  }
}

function showWelcome(message = '') {
  const dialog = $('#welcome-dialog');
  $('#welcome-message').textContent = message;
  const supported = typeof window.showDirectoryPicker === 'function';
  $('#welcome-connect').hidden = !supported;
  if (!supported) $('#welcome-message').textContent = '이 브라우저는 폴더 연결을 지원하지 않습니다. 다운로드 방식으로 작업을 저장해 주세요.';
  if (!dialog.open) dialog.showModal();
}

$('#welcome-dialog').addEventListener('cancel', event => event.preventDefault());

$('#welcome-connect').addEventListener('click', async () => {
  const button = $('#welcome-connect');
  button.disabled = true;
  try { if (await connectFolder()) $('#welcome-dialog').close(); }
  finally { button.disabled = false; }
});

$('#welcome-download').addEventListener('click', async () => {
  storage.root = null;
  storage.folders = null;
  storage.lastSnapshot = null;
  let remembered = true;
  if (storage.db) {
    try { await dbOperation('readwrite', 'folderMode', 'download'); }
    catch { remembered = false; }
  } else remembered = false;
  $('#folder-note').textContent = '폴더 미연결 · 다운로드로 저장';
  setStatus(remembered ? '다운로드 방식으로 시작합니다. 필요하면 나중에 폴더를 연결할 수 있습니다.' : '다운로드 방식으로 시작합니다. 다음 실행에는 안내가 다시 표시될 수 있습니다.');
  $('#welcome-dialog').close();
});

async function saveWork() {
  try {
    if (storage.root && !await permission(storage.root, true)) throw new Error('작업 폴더 쓰기 권한이 없습니다.');
    storage.modifiedAt = new Date().toISOString();
    const snapshot = workSnapshot();
    await validateWork(snapshot);
    const json = JSON.stringify(snapshot, null, 2);
    const name = `작업-${snapshot.projectId}-${crypto.randomUUID()}.json`;
    if (storage.root) {
      if (!storage.folders) storage.folders = await createFolders(storage.root);
      if (storage.lastSnapshot) {
        const prior = await storage.folders.works.getFileHandle(storage.lastSnapshot);
        const file = await prior.getFile();
        await uniqueWrite(storage.folders.backups, `백업-${crypto.randomUUID()}.json`, file);
      }
      const savedHandle = await uniqueWrite(storage.folders.works, name, json);
      if (await (await savedHandle.getFile()).text() !== json) throw new Error('저장 파일 확인에 실패했습니다.');
      storage.lastSnapshot = name;
      setStatus(`작업 파일 저장 완료: ${storage.root.name} / 우리들의 웹사이트 스튜디오 / 작업물 보관함 / ${name}`);
    } else {
      downloadBlob(new Blob([json], { type: 'application/json' }), name);
      setStatus('작업 파일 다운로드를 시작했습니다. 브라우저의 다운로드 위치를 확인해 주세요.');
    }
    if (storage.db) enqueueAutosave();
  } catch (error) {
    setStatus(`저장 실패: ${error.message}`);
  }
}

$('#folder-button').addEventListener('click', connectFolder);
$('#save-work').addEventListener('click', saveWork);
$('#load-work').addEventListener('click', () => $('#work-file').click());

$('#work-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 400 * 1024 * 1024) throw new Error('작업 파일이 너무 큽니다.');
    const candidate = await validateWork(JSON.parse(await file.text()));
    if (!confirm('현재 편집 중인 작업을 선택한 작업으로 바꾸시겠습니까? 저장하지 않은 변경은 사라집니다.')) return;
    clearTimeout(storage.timer);
    await restoreWork(candidate);
    storage.lastSnapshot = null;
    enqueueAutosave();
    setStatus('작업을 불러왔습니다. 자동 저장 중입니다.');
  } catch (error) {
    setStatus(`불러오기 실패: ${error.message}`);
  }
});

async function initializeStorage() {
  for (const id of ['save-work', 'load-work', 'complete-work']) $(`#${id}`).disabled = false;
  let welcomeNeeded = true;
  let welcomeMessage = '';
  let startupMessage = '자동 저장 준비 완료 · 저장하기로 별도 작업 파일을 보관하세요.';

  try {
    storage.db = await openStudioDB();
    const savedFolder = await dbOperation('readonly', 'folder');
    const savedMode = await dbOperation('readonly', 'folderMode');
    if (savedMode === 'download') {
      welcomeNeeded = false;
      $('#folder-note').textContent = '폴더 미연결 · 다운로드로 저장';
    } else if (savedFolder && typeof window.showDirectoryPicker === 'function') {
      storage.root = savedFolder;
      try {
        if (await permission(savedFolder, false)) {
          storage.folders = await createFolders(savedFolder);
          $('#folder-note').textContent = `${savedFolder.name} / 우리들의 웹사이트 스튜디오`;
          welcomeNeeded = false;
          startupMessage = '이전에 연결한 작업 폴더를 다시 사용할 수 있습니다.';
        } else {
          $('#folder-note').textContent = `${savedFolder.name} · 권한 확인 후 다시 연결`;
          welcomeMessage = `이전에 선택한 ${savedFolder.name} 폴더를 다시 사용하려면 연결 버튼을 눌러 권한을 확인해 주세요.`;
        }
      } catch {
        $('#folder-note').textContent = `${savedFolder.name} · 다시 연결 필요`;
        welcomeMessage = '이전에 연결한 폴더를 사용할 수 없습니다. 다시 연결하거나 다운로드 방식을 선택해 주세요.';
      }
    }

    const saved = await dbOperation('readonly', 'autosave');
    if (saved) {
      const candidate = await validateWork(saved);
      if (confirm('이 브라우저에 자동 저장된 작업이 있습니다. 불러오면 현재 입력 중인 내용이 바뀝니다. 불러오시겠습니까?')) {
        await restoreWork(candidate);
        storage.pendingChange = false;
      }
    }
    storage.started = true;
    if (storage.pendingChange) {
      storage.pendingChange = false;
      enqueueAutosave();
    } else {
      setStatus(startupMessage);
    }
  } catch (error) {
    storage.started = true;
    if (storage.pendingChange) {
      storage.pendingChange = false;
      enqueueAutosave();
    }
    setStatus(`자동 저장을 확인하지 못했습니다. 작업 파일 다운로드를 이용하세요. (${error.message})`);
  }
  if (welcomeNeeded) showWelcome(welcomeMessage);
}

if (window.studioReady) initializeStorage();
else window.addEventListener('studio-ready', initializeStorage, { once: true });
