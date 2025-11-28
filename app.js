(function () {
  const startBtn = document.getElementById('startButton');

  function goToTarget(target) {
    if (!target) return;
    if (target.startsWith('#')) {
      const dest = document.querySelector(target);
      if (dest) {
        dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    window.location.href = target;
  }

  if (startBtn) {
    const target = startBtn.dataset.target || '/app';
    startBtn.addEventListener('click', () => goToTarget(target));
  }
})();
