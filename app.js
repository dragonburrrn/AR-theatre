// Генерация промокода
function generatePromoCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Исключаем 0, O, I, 1
    let code = 'THEATRE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  // Показываем промокод при обнаружении маркера
  document.querySelector('a-marker').addEventListener('markerFound', () => {
    const promoCode = generatePromoCode();
    document.getElementById('promo-code').textContent = promoCode;
    document.getElementById('promo').style.display = 'block';
    
    // Сохраняем в LocalStorage (для теста)
    localStorage.setItem('lastPromo', promoCode);
  });
  
  // Скрываем промокод при потере маркера
  document.querySelector('a-marker').addEventListener('markerLost', () => {
    document.getElementById('promo').style.display = 'none';
  });