'use strict';

const output = { files: null, zip: null, location: '', urls: [] };
const encoder = new TextEncoder();

async function bytesFromImage(src) {
  if (!imageDataValid(src)) throw new Error('이미지 형식이 올바르지 않습니다.');
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 변환할 수 없습니다.'));
    img.src = src;
  });
  const width = image.naturalWidth, height = image.naturalHeight;
  if (!width || !height) throw new Error('이미지 크기가 올바르지 않습니다.');
  const ratio = Math.min(1, 4096 / width, 4096 / height, Math.sqrt(16000000 / (width * height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('이미지 변환을 지원하지 않습니다.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('이미지를 변환할 수 없습니다.')), 'image/png');
  });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), extension: 'png' };
}

function validMapUrl(value) {
  if (!value || !value.trim()) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function validateOutputBasics(basic) {
  const labels = { name: '어린이집명', address: '주소', phone: '전화번호', hours: '운영시간' };
  const missing = Object.entries(labels).filter(([key]) => !basic[key]?.trim()).map(([, label]) => label);
  if (missing.length) throw new Error(`필수 정보를 입력해 주세요: ${missing.join(', ')}`);
  if (!/^[+\d][\d ()-]{6,24}$/.test(basic.phone.trim()) || basic.phone.replace(/\D/g, '').length < 8) {
    throw new Error('올바른 전화번호를 입력해 주세요.');
  }
  if (validMapUrl(basic.mapUrl || '') === null) {
    throw new Error('지도 공유 주소는 http 또는 https 주소로 입력해 주세요.');
  }
}

function stripEditorAttributes(el) {
  for (const attr of [...el.attributes]) {
    if (attr.name.startsWith('data-edit-') || attr.name.startsWith('data-demo-') || attr.name.startsWith('data-studio-')) {
      el.removeAttribute(attr.name);
    }
  }
}

async function buildSite(snapshot) {
  const validated = await validateWork(snapshot);
  validateOutputBasics(validated.basic);

  const modelId = validated.model || state.currentModel || 'A-1';
  if (state.currentModel !== modelId && typeof window.studioSwitchModel === 'function') {
    await window.studioSwitchModel(modelId, true);
  }

  // 선택된 모델의 사진과 문구만 추출하여 출력 (타 모델 자료 배제)
  const modelData = validated.models?.[modelId] || { text: {}, photos: {} };
  const modelPhotos = modelData.photos || {};
  const modelText = modelData.text || {};

  const files = new Map();
  files.set('images/', new Uint8Array());
  const assetPaths = new Map();

  for (const [id, photo] of Object.entries(modelPhotos)) {
    if (!photo.src) continue;
    const image = await bytesFromImage(photo.src);
    const path = `images/${id.replaceAll('.', '-')}.${image.extension}`;
    files.set(path, image.bytes);
    assetPaths.set(id, path);
  }

  let logoPath = '';
  if (validated.logo) {
    const logo = await bytesFromImage(validated.logo);
    logoPath = `images/logo.${logo.extension}`;
    files.set(logoPath, logo.bytes);
  }

  for (const page of pages) {
    const doc = new DOMParser().parseFromString(state.templates[page.id], 'text/html');
    doc.querySelector('base')?.remove();
    doc.querySelector('[data-studio-style]')?.remove();
    doc.querySelectorAll('style').forEach(el => {
      if (el.hasAttribute('data-studio-style') || el.textContent.includes('[data-edit-photo]')) el.remove();
    });
    doc.querySelectorAll('script').forEach(el => el.remove());

    doc.title = `${validated.basic.name.trim()} | ${page.label}`;
    const description = doc.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', `${validated.basic.name.trim()} 홈페이지`);

    doc.querySelectorAll('.brand small, .footer-brand p, .footer-note, [data-demo-status], [data-demo-map-note]').forEach(el => el.remove());

    doc.querySelectorAll('[data-demo-field]').forEach(el => {
      const key = el.dataset.demoField;
      const value = validated.basic[key] || '';
      if (key === 'transit') return;
      if (value.trim()) {
        el.textContent = value;
      } else if (key === 'director') {
        const parent = el.closest('p');
        if (parent) parent.remove(); else el.remove();
      } else if (el.closest('.footer-info p')) {
        el.closest('p').remove();
      } else if (el.parentElement?.tagName === 'DIV' && el.tagName === 'DD') {
        el.parentElement.remove();
      } else {
        el.remove();
      }
    });

    const mark = doc.querySelector('.brand-mark');
    if (mark && logoPath) {
      const img = doc.createElement('img');
      img.src = logoPath;
      img.alt = '기관 로고';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:50%';
      mark.replaceChildren(img);
    }

    for (const item of (state.catalogs[page.id]?.texts || [])) {
      const el = doc.querySelector(`[data-edit-text="${item.id}"]`);
      if (!el) continue;
      const edited = Object.hasOwn(modelText, item.id);
      if (edited) {
        applyText(el, modelText[item.id]);
        if (!el.textContent.trim()) { el.remove(); continue; }
      } else if (el.textContent.includes('입력해 주세요')) {
        el.remove();
        continue;
      }
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-label');
    }

    for (const item of (state.catalogs[page.id]?.photos || [])) {
      const el = doc.querySelector(`[data-edit-photo="${item.id}"]`);
      if (!el) continue;
      if (!assetPaths.has(item.id)) {
        el.remove();
        continue;
      }
      const img = doc.createElement('img');
      img.src = assetPaths.get(item.id);
      img.alt = modelPhotos[item.id].alt || item.label;
      el.replaceChildren(img);
      el.classList.add('export-photo');
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-label');
    }

    doc.querySelectorAll('.hero-art, .hero-composition, .hero-visual').forEach(el => {
      if (!el.querySelector('.photo')) {
        el.closest('.hero-grid, .hero')?.classList.add('export-no-photo');
        el.remove();
      }
    });

    for (const selector of ['.people-lead', '.story-layout', '.letter-layout', '.about-feature', '.teacher-feature', '.person-feature', '.profile-feature', '.profile-grid']) {
      const section = doc.querySelector(selector);
      if (section && !section.querySelector('.photo')) section.classList.add('export-no-photo');
    }

    const locationGrid = doc.querySelector('.location-grid, .visit-layout, .location-layout');
    if (locationGrid?.firstElementChild && !locationGrid.firstElementChild.textContent.trim() && !locationGrid.firstElementChild.querySelector('img')) {
      locationGrid.firstElementChild.remove();
      locationGrid.classList.add('export-no-photo');
    }

    // 전화하기 버튼 처리 (모든 모델 공통)
    const phoneButton = doc.querySelector('[data-demo-phone]');
    if (phoneButton) {
      const a = doc.createElement('a');
      a.className = phoneButton.className;
      a.setAttribute('href', `tel:${validated.basic.phone.replace(/[^\d+]/g, '')}`);
      a.textContent = '전화하기';
      phoneButton.replaceWith(a);
    }

    // 지도 보기 버튼 처리 (모든 모델 공통)
    const mapButton = doc.querySelector('[data-demo-show-map]');
    const mapUrl = validMapUrl(validated.basic.mapUrl || '');
    if (mapButton && mapUrl) {
      const a = doc.createElement('a');
      a.className = mapButton.className;
      a.setAttribute('href', mapUrl);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.textContent = '지도 보기';
      mapButton.replaceWith(a);
    } else {
      mapButton?.remove();
    }

    doc.querySelectorAll('[data-demo-field="transit"]').forEach(el => {
      if (el.textContent.includes('입력해 주세요')) el.parentElement?.remove();
    });

    doc.querySelectorAll('*').forEach(stripEditorAttributes);

    const script = doc.createElement('script');
    script.src = 'script.js';
    script.defer = true;
    doc.head.append(script);

    files.set(page.file, encoder.encode('<!doctype html>\n' + doc.documentElement.outerHTML));
  }

  // 선택된 모델의 에셋 로드 (styles.css 및 inner.css)
  const modelDirUrl = new URL(`templates/${modelId}/`, location.href);
  const cssResponse = await fetch(new URL('styles.css', modelDirUrl));
  if (!cssResponse.ok) throw new Error(`${modelId}의 styles.css를 읽지 못했습니다.`);
  const css = await cssResponse.text();

  files.set('styles.css', encoder.encode(css + '\n.export-photo{position:relative}.export-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.hero-grid.export-no-photo,.people-lead.export-no-photo,.story-layout.export-no-photo,.location-grid.export-no-photo{grid-template-columns:1fr}.story-layout.export-no-photo .story-copy{grid-column:auto}\n'));

  // inner.css 누락 방지 (B-3, C-1, C-2, C-3 모델 등)
  try {
    const innerRes = await fetch(new URL('inner.css', modelDirUrl));
    if (innerRes.ok) {
      const innerCss = await innerRes.text();
      files.set('inner.css', encoder.encode(innerCss));
    }
  } catch {}

  // 공통 모바일 메뉴 대응 script.js
  const commonJs = `const menuToggle=document.querySelector('.menu-toggle');const navigation=document.querySelector('#site-nav,.site-nav');if(menuToggle&&navigation){menuToggle.addEventListener('click',()=>{const isOpen=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!isOpen));const sr=menuToggle.querySelector('.sr-only');if(sr)sr.textContent=isOpen?'메뉴 열기':'메뉴 닫기';navigation.classList.toggle('is-open',!isOpen);});window.addEventListener('resize',()=>{if(window.innerWidth>700){menuToggle.setAttribute('aria-expanded','false');const sr=menuToggle.querySelector('.sr-only');if(sr)sr.textContent='메뉴 열기';navigation.classList.remove('is-open');}});}`;
  files.set('script.js', encoder.encode(commonJs));

  verifySite(files);
  return files;
}

function verifySite(files) {
  for (const page of pages) {
    const data = files.get(page.file);
    if (!data) throw new Error(`${page.file}이 없습니다.`);
    const html = new TextDecoder('utf-8', { fatal: true }).decode(data);
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (doc.querySelector('[data-edit-text],[data-edit-photo],[data-demo-field],script[src="demo-data.js"]') ||
        /햇살나무 어린이집|김햇살|02-0000-0000|서울시 행복구 사랑로 123/.test(html)) {
      throw new Error('시연용 또는 편집용 데이터가 남아 있습니다.');
    }

    for (const node of doc.querySelectorAll('a[href],img[src],link[href],script[src]')) {
      const value = node.getAttribute('href') || node.getAttribute('src');
      if (!value || /^(?:tel:|https?:)/i.test(value)) continue;
      const [path, fragment] = value.split('#');
      const target = path || page.file;
      if (!files.has(target)) throw new Error(`연결 파일이 없습니다: ${target}`);
      if (fragment && target.endsWith('.html')) {
        const dest = new DOMParser().parseFromString(new TextDecoder().decode(files.get(target)), 'text/html');
        if (!dest.getElementById(fragment)) throw new Error(`연결 위치가 없습니다: ${value}`);
      }
    }
  }
}

function makeZip(files) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc32 = data => {
    let c = 0xffffffff;
    for (const b of data) c = table[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const le = (len, fields) => {
    const a = new Uint8Array(len), v = new DataView(a.buffer);
    for (const [offset, value, size] of fields) size === 2 ? v.setUint16(offset, value, true) : v.setUint32(offset, value, true);
    return a;
  };
  const chunks = [], central = [];
  let offset = 0, centralSize = 0;
  for (const [name, data] of files) {
    const filename = encoder.encode(name), size = data.length, crc = crc32(data);
    const local = le(30, [[0,0x04034b50,4],[4,20,2],[6,0x800,2],[14,crc,4],[18,size,4],[22,size,4],[26,filename.length,2]]);
    chunks.push(local, filename, data);
    const record = le(46, [[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[16,crc,4],[20,size,4],[24,size,4],[28,filename.length,2],[42,offset,4]]);
    central.push(record, filename);
    centralSize += record.length + filename.length;
    offset += local.length + filename.length + size;
  }
  const end = le(22, [[0,0x06054b50,4],[8,files.size,2],[10,files.size,2],[12,centralSize,4],[16,offset,4]]);
  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

async function storeOutput(files) {
  if (!storage.root) return '폴더 미연결 · 홈페이지 파일 저장을 눌러 ZIP을 다운로드하세요.';
  if (!await permission(storage.root, false)) return '폴더 권한이 없습니다 · 홈페이지 파일 저장을 눌러 ZIP을 다운로드하세요.';
  if (!storage.folders) storage.folders = await createFolders(storage.root);
  const name = `완성본-${crypto.randomUUID()}`;
  try {
    await storage.folders.finished.getDirectoryHandle(name);
    throw new Error('같은 이름의 완성본이 있어 보관을 중단했습니다.');
  } catch (error) {
    if (error.name !== 'NotFoundError') throw error;
  }
  const dir = await storage.folders.finished.getDirectoryHandle(name, { create: true });
  let imageDir = await dir.getDirectoryHandle('images', { create: true });
  for (const [path, bytes] of files) {
    if (path === 'images/') continue;
    const handle = path.startsWith('images/') ? await uniqueWrite(imageDir, path.slice(7), bytes) : await uniqueWrite(dir, path, bytes);
    const written = new Uint8Array(await (await handle.getFile()).arrayBuffer());
    if (written.length !== bytes.length || written.some((value, index) => value !== bytes[index])) {
      throw new Error(`${path} 저장 확인에 실패했습니다.`);
    }
  }
  return `${storage.root.name} / 우리들의 웹사이트 스튜디오 / 홈페이지 완성본 / ${name}`;
}

async function completeWebsite() {
  try {
    validateOutputBasics(state.basic);
    if (!confirm('등록한 사진과 로고를 홈페이지에 공개할 권한을 확인하셨습니까?')) return;
    setStatus('홈페이지를 만들고 검증하고 있습니다.');
    const files = await buildSite(workSnapshot());
    const zip = makeZip(files);
    let location;
    try {
      location = await storeOutput(files);
    } catch (error) {
      location = `폴더 보관 실패: ${error.message} · ZIP을 다운로드해 주세요.`;
    }
    output.files = files;
    output.zip = zip;
    output.location = location;
    $('#complete-location').textContent = location;
    $('#complete-frame').hidden = true;
    $('#complete-help').hidden = true;
    $('#complete-dialog').showModal();
    setStatus('홈페이지 생성 및 파일 구조 검사 완료');
  } catch (error) {
    setStatus(`홈페이지 생성 실패: ${error.message}`);
    alert(error.message);
  }
}

function showCompletedPage(filename) {
  output.urls.forEach(URL.revokeObjectURL);
  output.urls = [];
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(output.files.get(filename)), 'text/html');
  for (const node of doc.querySelectorAll('img[src],link[href],script[src]')) {
    const attr = node.tagName === 'IMG' || node.tagName === 'SCRIPT' ? 'src' : 'href';
    const name = node.getAttribute(attr);
    if (!output.files.has(name)) continue;
    const type = name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : `image/${name.endsWith('.jpg') ? 'jpeg' : name.split('.').pop()}`;
    const url = URL.createObjectURL(new Blob([output.files.get(name)], { type }));
    output.urls.push(url);
    node.setAttribute(attr, url);
  }
  const frame = $('#complete-frame');
  frame.hidden = false;
  frame.onload = () => {
    frame.contentDocument.addEventListener('click', event => {
      const a = event.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      const [path] = href.split('#');
      if (path && output.files.has(path)) {
        event.preventDefault();
        showCompletedPage(path);
      } else if (href.startsWith('tel:') || /^https?:/i.test(href)) {
        event.preventDefault();
      }
    });
  };
  frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
}

$('#complete-work').addEventListener('click', completeWebsite);
$('#complete-preview').addEventListener('click', () => showCompletedPage('index.html'));
$('#complete-download').addEventListener('click', () => { if (output.zip) downloadBlob(output.zip, '홈페이지-완성본.zip'); });
$('#complete-guide').addEventListener('click', () => { $('#complete-help').hidden = !$('#complete-help').hidden; });
$('#complete-back').addEventListener('click', () => {
  $('#complete-dialog').close();
  output.urls.forEach(URL.revokeObjectURL);
  output.urls = [];
});
