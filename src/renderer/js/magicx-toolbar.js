document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.tool-btn');
  const closeBtn = document.getElementById('btn-close-magicx');

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      await window.eyesCare.magicx.setFilter(filter);
    });
  });

  closeBtn.addEventListener('click', async () => {
    await window.eyesCare.magicx.toggle();
  });

  window.eyesCare.magicx.onInit((params) => {
    if (params.activeFilter) {
      buttons.forEach(b => {
        b.classList.toggle('active', b.dataset.filter === params.activeFilter);
      });
    }
  });
});
