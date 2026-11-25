const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.querySelector('.sr-only').textContent = isOpen ? '메뉴 열기' : '메뉴 닫기';
  navigation.classList.toggle('is-open', !isOpen);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 700) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.sr-only').textContent = '메뉴 열기';
    navigation.classList.remove('is-open');
  }
});
