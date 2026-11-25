'use strict';

const STUDIO_MODELS = [
  { id: 'A-1', group: 'A', groupTitle: '온정과 친밀', title: '따뜻한 마음', name: 'A-1 따뜻한 마음', type: '사진 중심형', dir: 'templates/A-1', isDefault: true },
  { id: 'A-2', group: 'A', groupTitle: '온정과 친밀', title: '아이의 마음', name: 'A-2 아이의 마음', type: '이야기 중심형', dir: 'templates/A-2' },
  { id: 'A-3', group: 'A', groupTitle: '온정과 친밀', title: '작은 호기심', name: 'A-3 작은 호기심', type: '교육 중심형', dir: 'templates/A-3' },
  { id: 'B-1', group: 'B', groupTitle: '자연과 성장', title: '아름다운 계절', name: 'B-1 아름다운 계절', type: '사진 중심형', dir: 'templates/B-1' },
  { id: 'B-2', group: 'B', groupTitle: '자연과 성장', title: '새싹의 이야기', name: 'B-2 새싹의 이야기', type: '이야기 중심형', dir: 'templates/B-2' },
  { id: 'B-3', group: 'B', groupTitle: '자연과 성장', title: '작은 탐험가', name: 'B-3 작은 탐험가', type: '교육 중심형', dir: 'templates/B-3' },
  { id: 'C-1', group: 'C', groupTitle: '배움과 미래', title: '행복한 순간', name: 'C-1 행복한 순간', type: '사진 중심형', dir: 'templates/C-1' },
  { id: 'C-2', group: 'C', groupTitle: '배움과 미래', title: '눈부신 내일', name: 'C-2 눈부신 내일', type: '이야기 중심형', dir: 'templates/C-2' },
  { id: 'C-3', group: 'C', groupTitle: '배움과 미래', title: '배움의 세계', name: 'C-3 배움의 세계', type: '교육 중심형', dir: 'templates/C-3' }
];
window.STUDIO_MODELS = STUDIO_MODELS;

const pages = [
  { id: 'home', file: 'index.html', label: '홈' },
  { id: 'about', file: 'about.html', label: '어린이집 소개' },
  { id: 'teachers', file: 'teachers.html', label: '원장님과 선생님' },
  { id: 'learning', file: 'learning.html', label: '언어와 수리의 즐거움' },
  { id: 'daily', file: 'daily.html', label: '행복한 하루' },
  { id: 'safety', file: 'safety.html', label: '건강하고 안전한 생활' },
  { id: 'parents', file: 'parents.html', label: '부모님과 함께' },
  { id: 'location', file: 'location.html', label: '오시는 길' }
];

const fields = [
  ['name', '어린이집명'], ['director', '원장명'], ['address', '주소'],
  ['phone', '전화번호'], ['hours', '운영시간'], ['mapUrl', '지도 공유 주소']
];

// 9종 모델별 데이터 격리 구조
const initialModels = {};
STUDIO_MODELS.forEach(m => { initialModels[m.id] = { text: {}, photos: {} }; });

const state = {
  currentModel: 'A-1',
  page: 'home',
  basic: {},
  logo: null,
  models: initialModels,
  selected: null,
  group: null,
  templates: {},
  catalogs: {}
};
window.studioState = state;

// 현재 활성 모델의 text 및 photos로의 투명한 접근자 정의 (하위 호환성 유지)
Object.defineProperty(state, 'text', {
  get() {
    if (!state.models[state.currentModel]) state.models[state.currentModel] = { text: {}, photos: {} };
    if (!state.models[state.currentModel].text) state.models[state.currentModel].text = {};
    return state.models[state.currentModel].text;
  },
  set(val) {
    if (!state.models[state.currentModel]) state.models[state.currentModel] = { text: {}, photos: {} };
    state.models[state.currentModel].text = val || {};
  }
});

Object.defineProperty(state, 'photos', {
  get() {
    if (!state.models[state.currentModel]) state.models[state.currentModel] = { text: {}, photos: {} };
    if (!state.models[state.currentModel].photos) state.models[state.currentModel].photos = {};
    return state.models[state.currentModel].photos;
  },
  set(val) {
    if (!state.models[state.currentModel]) state.models[state.currentModel] = { text: {}, photos: {} };
    state.models[state.currentModel].photos = val || {};
  }
});

const sectionDefinitions = {
  home: [
    ['hero', '대표 화면', '.hero'],
    ['care', '따뜻한 돌봄', '.care'],
    ['values', '핵심 가치와 성장 이야기', '.values, .moments, .journal, .stories, .explore, .learning-card-grid'],
    ['contact', '상담 및 방문 안내', '.contact']
  ],
  about: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['story', '보육 철학과 기관 소개', '.story-layout, .letter-layout, .about-feature, .about-story, .feature-grid, .story-feature, .inner-section']
  ],
  teachers: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['director', '원장님 인사', '.people-lead, .portrait-letter, .teacher-feature, .person-feature, .profile-feature, .profile-grid, .teacher-letter, .teacher-note, .people-heading'],
    ['teachers', '선생님 소개', '.people-pair, .people-stories, .teacher-cards, .photo-pair, .teacher-card-grid']
  ],
  learning: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['language', '언어의 즐거움', '.learning-row:nth-of-type(1), .chapter-copy:first-of-type, .learning-copy:first-of-type, .explore-card.language, .discovery-stack > div:first-child, .learning-grid > div:first-child, .learning-areas > div:first-child'],
    ['math', '수리의 즐거움', '.learning-row:nth-of-type(2), .chapter-copy:nth-of-type(2), .learning-copy:nth-of-type(2), .explore-card.math, .discovery-stack > div:nth-child(2), .learning-grid > div:nth-child(2), .learning-areas > div:nth-child(2)']
  ],
  daily: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['timeline', '행복한 하루 일과', '.timeline, .day-diary, .day-flow, .day-journal, .day-grid, .day-list, .inner-section']
  ],
  safety: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['care', '청결·식사·휴식', '.care-grid, .care-stories, .care-cards, .care-entries, .safety-grid'],
    ['safety', '건강과 안전 관리', '.inner-section']
  ],
  parents: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['consultation', '입소 상담 안내', '.consultation, .consultation-note, .consultation-details, .consultation-fields'],
    ['communication', '가정과의 소통', '.parents-layout, .family-letter, .family-feature, .family-grid, .story-layout, .inner-section']
  ],
  location: [
    ['intro', '페이지 소개', '.inner-intro, .inner-hero'],
    ['visit', '약도와 방문 안내', '.location-grid, .visit-layout, .location-layout, .inner-section']
  ]
};

const $ = selector => document.querySelector(selector);
const iframe = $('#preview');
const editor = $('#editor-body');
let loadVersion = 0;
let previewObserver = null;
let modelSwitchGeneration = 0;

function textCandidates(doc) {
  return [...doc.querySelectorAll('main h1, main h2, main h3, main p, main .timeline-copy > span, main dd')]
    .filter(el => !el.closest('.photo') && !el.closest('[data-demo-status]') &&
      !el.querySelector('[data-demo-field]') && !['address', 'phone', 'hours', 'director'].includes(el.dataset.demoField) &&
      !el.matches('[data-demo-map-note]') && el.textContent.trim());
}

function sectionFor(page, element) {
  const defs = sectionDefinitions[page.id] || [];
  for (const [id, , selector] of defs) {
    if (element.closest(selector)) return id;
  }
  return 'other';
}

function titleParts(element) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const plain = []; let node;
  while ((node = walker.nextNode())) if (!node.parentElement.closest('em')) plain.push(node);
  return { plain, emphasis: element.querySelector('em') };
}

function applyText(element, value) {
  if (value && typeof value === 'object') {
    const parts = titleParts(element);
    parts.plain.forEach((node, index) => { node.nodeValue = index === 0 ? value.plain : ''; });
    if (parts.emphasis) parts.emphasis.textContent = value.emphasis;
  } else element.textContent = value;
}

function prepareTemplate(page, html, modelDirUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script').forEach(el => el.remove());
  const base = doc.createElement('base');
  base.href = modelDirUrl.href;
  doc.head.prepend(base);

  const catalog = { photos: [], texts: [] };
  doc.querySelectorAll('main .photo').forEach((el, index) => {
    const id = `${page.id}.photo.${index + 1}`;
    el.dataset.editPhoto = id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `사진 ${index + 1} 편집`);
    catalog.photos.push({
      id,
      group: sectionFor(page, el),
      label: el.querySelector('.photo-label span:last-child')?.textContent.trim() || `사진 ${index + 1}`,
      defaultHTML: el.innerHTML
    });
  });

  textCandidates(doc).forEach((el, index) => {
    const id = `${page.id}.text.${index + 1}`;
    el.dataset.editText = id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `문구 편집: ${el.textContent.replace(/\s+/g, ' ').trim()}`);
    const formatted = el.matches('h1, h2, h3') && el.querySelector('em');
    const parts = formatted ? titleParts(el) : null;
    catalog.texts.push({
      id,
      group: sectionFor(page, el),
      label: el.textContent.replace(/\s+/g, ' ').trim(),
      defaultHTML: el.innerHTML,
      defaultText: el.textContent.trim(),
      defaultParts: parts ? { plain: parts.plain.map(node => node.nodeValue).join('').trim(), emphasis: parts.emphasis.textContent.trim() } : null
    });
  });

  doc.querySelectorAll('.brand small, .footer-brand p').forEach(el => {
    if (el.textContent.includes('시연용') || el.textContent.includes('디자인 시안')) {
      el.textContent = '기관 정보를 입력해 주세요';
    }
  });

  const style = doc.createElement('style');
  style.textContent = '[data-edit-photo],[data-edit-text]{cursor:pointer;outline:2px dashed transparent;outline-offset:3px}[data-edit-photo]:hover,[data-edit-text]:hover{outline-color:#c77b65}[data-studio-selected="true"]{outline:3px solid #c77b65!important;outline-offset:3px}[data-edit-photo] img.studio-image{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}[data-edit-photo].has-studio-image{position:relative;min-width:0}';
  style.dataset.studioStyle = 'true';
  doc.head.append(style);

  state.catalogs[page.id] = catalog;
  state.templates[page.id] = '<!doctype html>\n' + doc.documentElement.outerHTML;
}

function setStatus(message) { $('#status').textContent = message; }

function updateCount() {
  const currentPhotos = state.photos;
  const count = Object.values(currentPhotos).filter(photo => photo?.src).length;
  $('#photo-count').textContent = `${count} / 24`;
  $('#photo-progress-bar').style.width = `${count / 24 * 100}%`;
}

function updateModelDisplay() {
  const current = STUDIO_MODELS.find(m => m.id === state.currentModel) || STUDIO_MODELS[0];
  const strong = $('#current-model-name');
  const small = $('#current-model-type');
  if (strong) strong.textContent = current.name;
  if (small) small.textContent = current.type;
}

// --- 최종 디자인 선택 화면 모달 제어기 ---
let stagedModelId = state.currentModel;
let activeDetailTab = 'home';

function updateModelDialogFooter() {
  const staged = STUDIO_MODELS.find(m => m.id === stagedModelId) || STUDIO_MODELS[0];
  const infoEl = $('#model-dialog-selected-info');
  const statusDot = $('#model-dialog-status-dot');
  if (infoEl) {
    if (staged.id === state.currentModel) {
      infoEl.innerHTML = `선택된 디자인: <strong>${staged.name}</strong> (${staged.type} · 현재 적용 중)`;
      if (statusDot) statusDot.style.background = '#408060';
    } else {
      infoEl.innerHTML = `선택된 디자인: <strong>${staged.name}</strong> (${staged.type} · [선택 완료] 시 적용)`;
      if (statusDot) statusDot.style.background = '#c77b65';
    }
  }
}

function renderModelGrid() {
  const grid = $('#model-grid');
  if (!grid) return;
  grid.replaceChildren();

  STUDIO_MODELS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.dataset.modelId = m.id;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(m.id === stagedModelId));
    card.setAttribute('tabindex', '0');

    if (m.id === state.currentModel) card.classList.add('is-active');
    if (m.id === stagedModelId) card.classList.add('is-selected');

    // 1. 헤더 (그룹, 명칭, 구분, 뱃지)
    const head = document.createElement('div');
    head.className = 'model-card-head';

    const info = document.createElement('div');
    info.className = 'model-card-info';
    info.innerHTML = `
      <span class="model-card-group-tag">${m.group}. ${m.groupTitle}</span>
      <h3 class="model-card-title">${m.name}</h3>
      <span class="model-card-sub">${m.type}</span>
    `;

    const badges = document.createElement('div');
    badges.className = 'model-card-badges';
    if (m.isDefault) {
      const bDef = document.createElement('span');
      bDef.className = 'badge badge-default';
      bDef.textContent = '기본 디자인';
      badges.append(bDef);
    }
    if (m.id === state.currentModel) {
      const bAct = document.createElement('span');
      bAct.className = 'badge badge-active';
      bAct.textContent = '현재 사용 중';
      badges.append(bAct);
    } else if (m.id === stagedModelId) {
      const bSel = document.createElement('span');
      bSel.className = 'badge badge-selected';
      bSel.textContent = '선택됨';
      badges.append(bSel);
    }
    head.append(info, badges);

    // 2. 축소 미리보기 영역 (카드 중앙 중복 버튼 제거하여 깨끗한 썸네일 유지)
    const previewBox = document.createElement('div');
    previewBox.className = 'model-card-preview-box';

    const thumb = document.createElement('iframe');
    thumb.className = 'model-card-thumb';
    thumb.src = `templates/${m.id}/index.html`;
    thumb.loading = 'lazy';
    thumb.tabIndex = -1;
    thumb.setAttribute('aria-hidden', 'true');
    thumb.title = `${m.name} 축소 미리보기`;

    previewBox.append(thumb);

    // 3. 카드 하단 동작 버튼
    const actions = document.createElement('div');
    actions.className = 'model-card-actions';
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.className = 'model-btn-card-preview';
    previewBtn.textContent = '8페이지 둘러보기';
    previewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModelDetailView(m.id, 'home');
    });

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'model-btn-card-select';
    selectBtn.textContent = m.id === stagedModelId ? '선택됨' : '선택';
    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectStagedModel(m.id);
    });

    actions.append(previewBtn, selectBtn);
    card.append(head, previewBox, actions);

    // 클릭 및 키보드 선택
    card.addEventListener('click', () => selectStagedModel(m.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectStagedModel(m.id);
      }
    });

    grid.append(card);
  });

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => fitCardThumbnails());
  } else if (typeof setTimeout === 'function') {
    setTimeout(fitCardThumbnails, 0);
  }
}

function fitCardThumbnails() {
  const cards = document.querySelectorAll('.model-card');
  cards.forEach(card => {
    const box = card.querySelector('.model-card-preview-box');
    const thumb = card.querySelector('.model-card-thumb');
    if (box && thumb) {
      const boxWidth = box.clientWidth;
      if (boxWidth > 0) {
        const scale = boxWidth / 1200;
        thumb.style.transform = `scale(${scale})`;
        thumb.style.width = '1200px';
        thumb.style.height = `${Math.ceil(box.clientHeight / scale)}px`;
      }
    }
  });
}

function selectStagedModel(modelId) {
  stagedModelId = modelId;
  const cards = document.querySelectorAll('.model-card');
  cards.forEach(card => {
    const isThis = card.dataset.modelId === modelId;
    card.classList.toggle('is-selected', isThis);
    card.setAttribute('aria-checked', String(isThis));
    const selBtn = card.querySelector('.model-btn-card-select');
    if (selBtn) selBtn.textContent = isThis ? '선택됨' : '선택';

    const badges = card.querySelector('.model-card-badges');
    if (badges) {
      const existingSel = badges.querySelector('.badge-selected');
      if (existingSel) existingSel.remove();
      if (isThis && card.dataset.modelId !== state.currentModel) {
        const bSel = document.createElement('span');
        bSel.className = 'badge badge-selected';
        bSel.textContent = '선택됨';
        badges.append(bSel);
      }
    }
  });
  updateModelDialogFooter();
}

function openModelDetailView(modelId, pageId = 'home') {
  const model = STUDIO_MODELS.find(m => m.id === modelId) || STUDIO_MODELS[0];
  stagedModelId = model.id;
  activeDetailTab = pageId;

  const detailView = $('#model-detail-view');
  const gridView = $('#model-grid-view');
  if (!detailView || !gridView) return;

  const nameEl = $('#model-detail-name');
  const typeEl = $('#model-detail-type');
  if (nameEl) nameEl.textContent = model.name;
  if (typeEl) typeEl.textContent = model.type;

  const tabsContainer = $('#model-detail-tabs');
  if (tabsContainer) {
    tabsContainer.replaceChildren();
    pages.forEach(p => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = `model-detail-tab-btn ${p.id === activeDetailTab ? 'is-active' : ''}`;
      tabBtn.setAttribute('role', 'tab');
      tabBtn.setAttribute('aria-selected', String(p.id === activeDetailTab));
      tabBtn.textContent = p.label;
      tabBtn.addEventListener('click', () => {
        activeDetailTab = p.id;
        tabsContainer.querySelectorAll('.model-detail-tab-btn').forEach(b => {
          const isCurrent = b === tabBtn;
          b.classList.toggle('is-active', isCurrent);
          b.setAttribute('aria-selected', String(isCurrent));
        });
        const detailIframe = $('#model-detail-iframe');
        if (detailIframe) {
          detailIframe.onload = () => {
            try {
              if (detailIframe.contentWindow) detailIframe.contentWindow.scrollTo(0, 0);
            } catch {}
          };
          detailIframe.src = `./templates/${model.id}/${p.file}`;
        }
      });
      tabsContainer.append(tabBtn);
    });
  }

  const targetPage = pages.find(p => p.id === activeDetailTab) || pages[0];
  const detailIframe = $('#model-detail-iframe');
  if (detailIframe) {
    detailIframe.onload = () => {
      try {
        if (detailIframe.contentWindow) detailIframe.contentWindow.scrollTo(0, 0);
      } catch {}
    };
    detailIframe.src = `./templates/${model.id}/${targetPage.file}`;
  }

  // 디자인 목록과 상세 미리보기는 반드시 하나씩만 표시 (상호 배타적 전환)
  gridView.hidden = true;
  gridView.style.setProperty('display', 'none', 'important');
  detailView.hidden = false;
  detailView.style.setProperty('display', 'flex', 'important');

  // 모달 하단의 둘러보기 버튼은 상세 뷰에 진입했으므로 숨김
  const footPreviewBtn = $('#model-dialog-preview-btn');
  if (footPreviewBtn) footPreviewBtn.hidden = true;

  updateModelDialogFooter();
}

function closeModelDetailView() {
  const detailView = $('#model-detail-view');
  const gridView = $('#model-grid-view');
  if (detailView) {
    detailView.hidden = true;
    detailView.style.setProperty('display', 'none', 'important');
  }
  if (gridView) {
    gridView.hidden = false;
    gridView.style.setProperty('display', 'block', 'important');
  }

  // 모달 하단의 둘러보기 버튼 다시 표시
  const footPreviewBtn = $('#model-dialog-preview-btn');
  if (footPreviewBtn) footPreviewBtn.hidden = false;

  renderModelGrid();
  updateModelDialogFooter();
}

function openModelDialog() {
  stagedModelId = state.currentModel;
  activeDetailTab = 'home';
  const detailView = $('#model-detail-view');
  const gridView = $('#model-grid-view');
  if (detailView) {
    detailView.hidden = true;
    detailView.style.setProperty('display', 'none', 'important');
  }
  if (gridView) {
    gridView.hidden = false;
    gridView.style.setProperty('display', 'block', 'important');
  }

  const footPreviewBtn = $('#model-dialog-preview-btn');
  if (footPreviewBtn) footPreviewBtn.hidden = false;

  renderModelGrid();
  updateModelDialogFooter();

  const dialog = $('#model-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    dialog.showModal();
    const activeCard = gridView ? gridView.querySelector(`.model-card[data-model-id="${stagedModelId}"]`) : null;
    if (activeCard) activeCard.focus();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => fitCardThumbnails());
    } else if (typeof setTimeout === 'function') {
      setTimeout(fitCardThumbnails, 0);
    }
  }
}

function closeModelDialog() {
  const dialog = $('#model-dialog');
  if (dialog && dialog.open) {
    dialog.close();
  }
}

$('#model-select-button')?.addEventListener('click', openModelDialog);
$('#model-dialog-close')?.addEventListener('click', closeModelDialog);
$('#model-dialog-cancel-btn')?.addEventListener('click', closeModelDialog);
$('#model-detail-back')?.addEventListener('click', closeModelDetailView);
$('#model-dialog-preview-btn')?.addEventListener('click', () => openModelDetailView(stagedModelId, 'home'));

$('#model-dialog-confirm-btn')?.addEventListener('click', async () => {
  if (stagedModelId === state.currentModel) {
    closeModelDialog();
    return;
  }
  const confirmBtn = $('#model-dialog-confirm-btn');
  const originalText = confirmBtn ? confirmBtn.textContent : '선택 완료';
  try {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '디자인 적용 중...';
    }
    await window.studioSwitchModel(stagedModelId);
    closeModelDialog();
  } catch (err) {
    alert(`디자인 모델 변경 실패: ${err.message}`);
    stagedModelId = state.currentModel;
    renderModelGrid();
    updateModelDialogFooter();
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalText;
    }
  }
});

const modelDialogEl = $('#model-dialog');
if (modelDialogEl) {
  modelDialogEl.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeModelDialog();
  });
}
window.addEventListener('studio-open-model-dialog', openModelDialog);
window.addEventListener('resize', () => {
  const dialog = $('#model-dialog');
  if (dialog && dialog.open) fitCardThumbnails();
});
if (typeof ResizeObserver === 'function') {
  const gridEl = $('#model-grid');
  if (gridEl) new ResizeObserver(() => fitCardThumbnails()).observe(gridEl);
}

function renderNavigation() {
  const nav = $('#page-list');
  nav.replaceChildren();
  pages.forEach(page => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-button';
    button.textContent = page.label;
    if (state.page === page.id) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => changePage(page.id));
    nav.append(button);
  });
  $('#page-heading').textContent = pages.find(page => page.id === state.page)?.label || '홈';
}

function changePage(id) {
  state.page = id;
  state.selected = null;
  state.group = null;
  renderNavigation();
  renderEditor();
  renderPreview();
}

function applyBasic(doc) {
  doc.querySelectorAll('[data-demo-field]').forEach(el => {
    const key = el.dataset.demoField;
    if (key !== 'transit') el.textContent = state.basic[key] || (key === 'name' ? '어린이집 이름' : key === 'director' ? '이름을 입력해 주세요' : '입력해 주세요');
  });
  const mark = doc.querySelector('.brand-mark');
  if (mark && state.logo) {
    const img = doc.createElement('img');
    img.src = state.logo;
    img.alt = '기관 로고';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:50%';
    mark.replaceChildren(img);
  }
  const visit = doc.querySelector('.visit-info dl, dl.visit-info, .visit-note dl');
  if (visit) {
    let row = visit.querySelector('[data-studio-map-row]');
    if (!row) {
      row = doc.createElement('div');
      row.dataset.studioMapRow = '';
      const dt = doc.createElement('dt');
      dt.textContent = '지도 주소';
      const dd = doc.createElement('dd');
      row.append(dt, dd);
      visit.append(row);
    }
    row.querySelector('dd').textContent = state.basic.mapUrl || '입력해 주세요';
  }
}

function applyPhoto(doc, item) {
  const el = doc.querySelector(`[data-edit-photo="${item.id}"]`);
  if (!el) return;
  const photo = state.photos[item.id];
  if (photo?.src) {
    const img = doc.createElement('img');
    img.className = 'studio-image';
    img.src = photo.src;
    img.alt = photo.alt || item.label;
    el.replaceChildren(img);
    el.classList.add('has-studio-image');
  } else {
    el.innerHTML = item.defaultHTML;
    el.classList.remove('has-studio-image');
  }
}

function applySelection(doc) {
  doc.querySelectorAll('[data-studio-selected]').forEach(el => el.removeAttribute('data-studio-selected'));
  if (state.selected?.id) {
    const attr = state.selected.type === 'photo' ? 'editPhoto' : 'editText';
    const el = [...doc.querySelectorAll('[data-edit-photo], [data-edit-text]')].find(node => node.dataset[attr] === state.selected.id);
    if (el) el.dataset.studioSelected = 'true';
  }
}

function togglePreviewMenu(doc, toggle) {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  doc.querySelector('#site-nav')?.classList.toggle('is-open', open);
  const label = toggle.querySelector('.sr-only');
  if (label) label.textContent = open ? '메뉴 닫기' : '메뉴 열기';
}

function renderPreview() {
  const pageId = state.page;
  const version = ++loadVersion;
  previewObserver?.disconnect();
  previewObserver = null;
  iframe.style.height = '760px';

  iframe.onload = () => {
    if (version !== loadVersion || state.page !== pageId) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    applyBasic(doc);
    state.catalogs[pageId]?.texts?.forEach(item => {
      const el = doc.querySelector(`[data-edit-text="${item.id}"]`);
      if (el && Object.hasOwn(state.text, item.id)) applyText(el, state.text[item.id]);
    });
    state.catalogs[pageId]?.photos?.forEach(item => applyPhoto(doc, item));
    applySelection(doc);
    doc.documentElement.style.overflowY = 'hidden';

    const updateHeight = () => {
      if (version !== loadVersion || !doc.body) return;
      const height = Math.max(760, Math.ceil(doc.body.getBoundingClientRect().height));
      if (iframe.style.height !== `${height}px`) {
        iframe.style.height = `${height}px`;
        fitPreview();
      }
    };
    previewObserver = new ResizeObserver(updateHeight);
    previewObserver.observe(doc.body);
    updateHeight();

    doc.addEventListener('click', event => {
      const toggle = event.target.closest('.menu-toggle');
      if (toggle) { event.preventDefault(); togglePreviewMenu(doc, toggle); return; }
      const selected = event.target.closest('[data-edit-photo], [data-edit-text]');
      const link = event.target.closest('a, button');
      if (selected) {
        event.preventDefault();
        selectItem(selected.dataset.editPhoto ? 'photo' : 'text', selected.dataset.editPhoto || selected.dataset.editText);
      } else if (link) {
        event.preventDefault();
        const target = pages.find(page => page.file === link.getAttribute('href')?.split('#')[0]);
        if (target) changePage(target.id);
      }
    });

    doc.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const selected = event.target.closest('[data-edit-photo], [data-edit-text]');
      if (selected) {
        event.preventDefault();
        selectItem(selected.dataset.editPhoto ? 'photo' : 'text', selected.dataset.editPhoto || selected.dataset.editText);
      }
    });
  };

  iframe.srcdoc = state.templates[pageId] || '';
}

function selectItem(type, id) {
  const item = state.catalogs[state.page]?.[type === 'photo' ? 'photos' : 'texts']?.find(entry => entry.id === id);
  state.group = item?.group || null;
  state.selected = { type, id };
  renderEditor();
  if (iframe.contentDocument) applySelection(iframe.contentDocument);
}

function makeButton(label, handler, className = 'editor-action') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function field(label, input) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field';
  const lab = document.createElement('label');
  lab.textContent = label;
  lab.htmlFor = input.id;
  wrap.append(lab, input);
  return wrap;
}

function fileChooser(onSuccess) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.id = 'image-file';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const generation = window.studioGeneration || 0;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setStatus('JPEG, PNG, WebP, GIF 중 10MB 이하 이미지를 선택해 주세요.');
      input.value = '';
      return;
    }
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = data;
      });
      if (generation !== (window.studioGeneration || 0)) {
        setStatus('작업이 바뀌어 이전 이미지 선택을 취소했습니다.');
        return;
      }
      onSuccess(data);
      window.studioChanged?.();
      setStatus('이미지가 반영되었습니다. 자동 저장 중입니다.');
    } catch {
      setStatus('이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.');
    }
    input.value = '';
  });
  return input;
}

function renderEditor() {
  editor.replaceChildren();
  const selected = state.selected;
  const title = $('#editor-title');
  const description = $('#editor-description');

  if (selected?.type === 'basic') {
    title.textContent = '기관 기본 정보';
    description.textContent = '한 번 입력하면 9종 모든 모델과 페이지에 반영됩니다.';
    fields.forEach(([key, label]) => {
      const input = document.createElement('input');
      input.id = `basic-${key}`;
      input.type = key === 'mapUrl' ? 'url' : 'text';
      input.value = state.basic[key] || '';
      input.addEventListener('input', () => {
        state.basic[key] = input.value;
        if (iframe.contentDocument) applyBasic(iframe.contentDocument);
        setStatus('입력한 정보가 미리보기에 반영되었습니다.');
      });
      editor.append(field(label, input));
    });
    editor.append(field('로고 이미지', fileChooser(data => {
      state.logo = data;
      renderPreview();
      if (state.selected?.type === 'basic') renderEditor();
    })));
    const remove = makeButton('로고 제거', () => {
      state.logo = null;
      renderPreview();
      renderEditor();
      window.studioChanged?.();
    });
    remove.disabled = !state.logo;
    editor.append(remove);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = '로고와 사진의 공개 권한을 확인해 주세요. 시연용 정보는 기본값으로 사용하지 않습니다.';
    editor.append(hint);
    return;
  }

  const catalog = state.catalogs[state.page];
  if (!catalog) return;

  const currentSectionDefs = sectionDefinitions[state.page] || [];
  const availableGroups = currentSectionDefs.map(([id, label]) => ({ id, label }));
  if ([...catalog.photos, ...catalog.texts].some(item => item.group === 'other')) {
    availableGroups.push({ id: 'other', label: '기타 페이지 안내' });
  }

  if (!state.group) {
    title.textContent = '페이지 구성';
    description.textContent = '영역을 선택해 문구와 사진을 편집하세요.';
    const list = document.createElement('div');
    list.className = 'group-list';
    availableGroups.forEach(group => {
      const items = [...catalog.photos, ...catalog.texts].filter(item => item.group === group.id);
      if (!items.length) return;
      const button = makeButton(group.label, () => {
        state.group = group.id;
        state.selected = null;
        renderEditor();
        if (iframe.contentDocument) applySelection(iframe.contentDocument);
      }, 'group-button');
      const detail = document.createElement('small');
      detail.textContent = `문구 ${catalog.texts.filter(item => item.group === group.id).length} · 사진 ${catalog.photos.filter(item => item.group === group.id).length}`;
      button.append(detail);
      list.append(button);
    });
    editor.append(list);
    return;
  }

  const groupName = availableGroups.find(group => group.id === state.group)?.label || '페이지 안내';
  const groupHeader = document.createElement('div');
  groupHeader.className = 'group-heading';
  const heading = document.createElement('h3');
  heading.textContent = groupName;
  const back = makeButton('전체 영역', () => {
    state.group = null;
    state.selected = null;
    renderEditor();
    if (iframe.contentDocument) applySelection(iframe.contentDocument);
  }, 'back-button');
  groupHeader.append(heading, back);
  editor.append(groupHeader);

  if (selected?.type === 'text') {
    const item = catalog.texts.find(x => x.id === selected.id);
    if (!item) return;
    title.textContent = '문구 편집';
    description.textContent = item.label;
    if (item.defaultParts) {
      const value = state.text[item.id] || item.defaultParts;
      for (const [key, label] of [['plain', '기본 제목'], ['emphasis', '강조 제목']]) {
        const input = document.createElement('textarea');
        input.id = `text-${key}`;
        input.value = value[key] || '';
        input.addEventListener('input', () => {
          const current = state.text[item.id] || { ...item.defaultParts };
          state.text[item.id] = { ...current, [key]: input.value };
          const el = iframe.contentDocument?.querySelector(`[data-edit-text="${item.id}"]`);
          if (el) applyText(el, state.text[item.id]);
          setStatus('제목이 미리보기에 반영되었습니다.');
        });
        editor.append(field(label, input));
      }
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = '두 문구 사이의 줄바꿈과 강조 색상은 그대로 유지됩니다.';
      editor.append(hint);
    } else {
      const input = document.createElement('textarea');
      input.id = 'text-edit';
      input.value = Object.hasOwn(state.text, item.id) ? state.text[item.id] : item.defaultText;
      input.addEventListener('input', () => {
        state.text[item.id] = input.value;
        const el = iframe.contentDocument?.querySelector(`[data-edit-text="${item.id}"]`);
        if (el) applyText(el, input.value);
        setStatus('문구가 미리보기에 반영되었습니다.');
      });
      editor.append(field('제목 또는 본문', input));
    }
    editor.append(makeButton('기본 문안 복원', () => {
      delete state.text[item.id];
      const el = iframe.contentDocument?.querySelector(`[data-edit-text="${item.id}"]`);
      if (el) el.innerHTML = item.defaultHTML;
      renderEditor();
      window.studioChanged?.();
      setStatus('선택한 문구를 기본 문안으로 복원했습니다.');
    }));
  } else if (selected?.type === 'photo') {
    const item = catalog.photos.find(x => x.id === selected.id);
    if (!item) return;
    title.textContent = '사진 편집';
    description.textContent = item.label;
    editor.append(field('사진 선택 또는 교체', fileChooser(data => {
      state.photos[item.id] = { ...(state.photos[item.id] || {}), src: data };
      updateCount();
      if (state.page === item.id.split('.')[0]) renderPreview();
      if (state.selected?.id === item.id) renderEditor();
    })));
    const input = document.createElement('input');
    input.id = 'photo-alt';
    input.value = state.photos[item.id]?.alt || '';
    input.addEventListener('input', () => {
      state.photos[item.id] = { ...(state.photos[item.id] || {}), alt: input.value };
      const img = iframe.contentDocument?.querySelector(`[data-edit-photo="${item.id}"] img.studio-image`);
      if (img) img.alt = input.value || item.label;
    });
    editor.append(field('사진 설명', input));
    const remove = makeButton('사진 제거', () => {
      delete state.photos[item.id];
      updateCount();
      renderPreview();
      renderEditor();
      window.studioChanged?.();
      setStatus('사진을 제거했습니다.');
    });
    remove.disabled = !state.photos[item.id]?.src;
    editor.append(remove);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'JPEG, PNG, WebP, GIF · 최대 10MB. 사진 속 인물과 사진의 공개 권한을 확인해 주세요.';
    editor.append(hint);
  } else {
    title.textContent = groupName;
    description.textContent = '편집할 문구나 사진을 선택해 주세요.';
  }

  for (const [heading, items, type] of [['사진', catalog.photos, 'photo'], ['문구 및 페이지 정보', catalog.texts, 'text']]) {
    const groupItems = items.filter(item => item.group === state.group);
    if (!groupItems.length) continue;
    const sec = document.createElement('section');
    sec.className = 'editor-section';
    const h = document.createElement('h3');
    h.textContent = heading;
    sec.append(h);
    const list = document.createElement('div');
    list.className = 'item-list';
    groupItems.forEach(item => {
      const number = item.id.split('.').pop();
      const button = makeButton(type === 'photo' ? `사진 ${number} · ${item.label}` : item.label, () => selectItem(type, item.id), '');
      if (selected?.id === item.id) button.className = 'selected';
      list.append(button);
    });
    sec.append(list);
    editor.append(sec);
  }
}

$('#basic-button').addEventListener('click', () => {
  state.selected = { type: 'basic' };
  renderEditor();
  if (iframe.contentDocument) applySelection(iframe.contentDocument);
});

let mobilePreview = false;
let zoomMultiplier = 1;

function fitPreview() {
  const stage = $('#preview-stage');
  const frame = $('#preview-frame');
  const viewport = $('#preview-viewport');
  if (!stage || !frame || !viewport) return;
  const width = mobilePreview ? 377 : 1202;
  const fit = Math.min(1, Math.max(0.1, (stage.clientWidth - 16) / width));
  const scale = Math.round(fit * zoomMultiplier * 1000) / 1000;
  frame.style.transform = `scale(${scale})`;
  viewport.style.width = `${width * scale}px`;
  viewport.style.height = `${frame.offsetHeight * scale}px`;
  $('#zoom-value').textContent = `${Math.round(scale * 100)}%`;
  $('#zoom-out').disabled = zoomMultiplier <= 0.5;
  $('#zoom-in').disabled = zoomMultiplier >= 2.5;
}

for (const [id, mobile] of [['view-desktop', false], ['view-mobile', true]]) {
  $(`#${id}`)?.addEventListener('click', () => {
    mobilePreview = mobile;
    zoomMultiplier = 1;
    $('#preview-frame')?.classList.toggle('mobile', mobile);
    $('#view-desktop')?.setAttribute('aria-pressed', String(!mobile));
    $('#view-mobile')?.setAttribute('aria-pressed', String(mobile));
    fitPreview();
  });
}

$('#zoom-out')?.addEventListener('click', () => { zoomMultiplier = Math.max(0.5, Math.round((zoomMultiplier - 0.1) * 10) / 10); fitPreview(); });
$('#zoom-in')?.addEventListener('click', () => { zoomMultiplier = Math.min(2.5, Math.round((zoomMultiplier + 0.1) * 10) / 10); fitPreview(); });
$('#zoom-fit')?.addEventListener('click', () => { zoomMultiplier = 1; fitPreview(); });
new ResizeObserver(fitPreview).observe($('#preview-stage'));

// 단일 모델 전환 엔진 (switchModel)
async function switchModel(targetModelId, skipAutosave = false) {
  const modelMeta = STUDIO_MODELS.find(m => m.id === targetModelId);
  if (!modelMeta) throw new Error(`지원하지 않는 모델입니다: ${targetModelId}`);

  const generation = ++modelSwitchGeneration;
  const previousModel = state.currentModel;
  const previousTemplates = { ...state.templates };
  const previousCatalogs = { ...state.catalogs };

  try {
    setStatus(`${modelMeta.name} 템플릿을 불러오는 중...`);
    const modelDirUrl = new URL(`templates/${targetModelId}/`, location.href);

    // 8개 HTML 템플릿 병렬 요청
    const responses = await Promise.all(pages.map(async page => {
      const res = await fetch(new URL(page.file, modelDirUrl));
      if (!res.ok) throw new Error(`${targetModelId} 템플릿의 ${page.file}을 읽을 수 없습니다.`);
      return { page, html: await res.text() };
    }));

    // 연속 전환으로 새로운 전환이 시작되었으면 취소
    if (generation !== modelSwitchGeneration) return;

    // 템플릿 파싱 및 카탈로그 구축
    state.currentModel = targetModelId;
    if (!state.models[targetModelId]) {
      state.models[targetModelId] = { text: {}, photos: {} };
    }

    responses.forEach(({ page, html }) => {
      prepareTemplate(page, html, modelDirUrl);
    });

    const total = pages.reduce((n, page) => n + (state.catalogs[page.id]?.photos?.length || 0), 0);
    if (total !== 24) throw new Error(`사진 자리 수를 확인해 주세요. (현재 ${total}개)`);

    state.selected = null;
    state.group = null;

    updateModelDisplay();
    renderNavigation();
    renderEditor();
    updateCount();
    renderPreview();
    fitPreview();

    window.studioGeneration = (window.studioGeneration || 0) + 1;
    window.dispatchEvent(new CustomEvent('studio-model-changed', { detail: { model: targetModelId } }));

    if (!skipAutosave) {
      window.studioChanged?.();
      setStatus(`${modelMeta.name} 디자인으로 변경되었습니다.`);
    }
    return true;
  } catch (error) {
    if (generation === modelSwitchGeneration) {
      // 롤백
      state.currentModel = previousModel;
      state.templates = previousTemplates;
      state.catalogs = previousCatalogs;
      updateModelDisplay();
      renderNavigation();
      renderEditor();
      updateCount();
      renderPreview();
      fitPreview();
      setStatus(`모델 변경 실패: ${error.message}`);
    }
    throw error;
  }
}
window.studioSwitchModel = switchModel;

async function initialize() {
  try {
    if (location.protocol === 'file:') {
      throw new Error('로컬 파일 주소에서는 미리보기 파일을 읽을 수 없습니다. 작업 폴더에서 python -m http.server 8000 실행 후 http://localhost:8000/studio.html 로 접속해 주세요.');
    }
    await switchModel('A-1', true);
    window.studioReady = true;
    window.dispatchEvent(new Event('studio-ready'));
    setStatus('작업 준비 완료');

    // PWA 서비스 워커 등록 (HTTP/HTTPS 환경)
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => {
        console.warn('서비스 워커 등록 실패:', err);
      });
    }
  } catch (error) {
    $('#preview-error').hidden = false;
    $('#preview-error').textContent = error.message;
    setStatus('미리보기를 불러오지 못했습니다.');
  }
}
initialize();
