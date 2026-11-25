// 시연 전용 데이터. 실제 사용자 데이터와 정식 출력물에 포함하지 않는다.
const demoInstitution = Object.freeze({
  name: '햇살나무 어린이집',
  director: '김햇살',
  phone: '02-0000-0000',
  address: '서울시 행복구 사랑로 123',
  hours: '오전 7시 30분 ~ 오후 7시 30분',
  transit: '가상의 햇살 정류장에서 내려 사랑로를 따라 어린이집 방향으로 도보 이동합니다.'
});

document.querySelectorAll('[data-demo-field]').forEach((element) => {
  const value = demoInstitution[element.dataset.demoField];
  if (value) element.textContent = value;
});

const banner = document.createElement('div');
banner.className = 'demo-banner';
banner.textContent = '디자인 검토용 시연 화면 · 기관 정보와 약도는 가상입니다';
document.body.insertBefore(banner, document.querySelector('.site-header'));

const map = document.querySelector('[data-demo-map]');
if (map) {
  const picture = document.createElement('img');
  picture.src = 'demo-map.svg';
  picture.alt = '시연용 가상 약도: 사랑로와 햇살길, 주변 건물, 햇살 정류장과 어린이집 위치';
  map.replaceChildren(picture);
  const note = document.querySelector('[data-demo-map-note]');
  note.textContent = '시연용 가상 약도입니다. 실제 위치가 아닙니다.';

  const phone = document.querySelector('[data-demo-phone]');
  const showMap = document.querySelector('[data-demo-show-map]');
  const status = document.querySelector('[data-demo-status]');
  phone.disabled = false;
  showMap.disabled = false;
  phone.addEventListener('click', () => {
    status.textContent = `시연용 전화번호 ${demoInstitution.phone}입니다. 실제 전화는 연결되지 않습니다.`;
  });
  showMap.addEventListener('click', () => {
    status.textContent = '시연용 가상 약도를 보여 드립니다. 실제 지도와 연결되지 않습니다.';
    map.scrollIntoView({ behavior: 'smooth', block: 'center' });
    map.focus({ preventScroll: true });
  });
}
