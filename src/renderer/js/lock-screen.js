document.addEventListener('DOMContentLoaded', () => {
  const timerText = document.getElementById('lock-timer-text');
  const progressFill = document.getElementById('lock-progress-fill');
  const tipText = document.getElementById('lock-tip-text');
  const skipBtn = document.getElementById('btn-skip-break');
  const skipContainer = document.getElementById('skip-container');

  const tips = [
    '"Look at a distant tree or horizon outside your window."',
    '"Blink softly and relax your facial muscles."',
    '"Roll your eyes in gentle clockwise circles."',
    '"Take 3 slow deep diaphragmatic breaths."',
    '"Rub your palms together and place them gently over your eyes."'
  ];

  let totalDuration = 20;

  window.eyesCare.lockScreen.onInit((data) => {
    totalDuration = data.duration || 20;
    if (data.enforced) {
      skipContainer.style.display = 'none';
    }
    tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
  });

  window.eyesCare.lockScreen.onTick((data) => {
    if (data.breakRemaining !== undefined) {
      const remaining = data.breakRemaining;
      const total = data.breakTotal || totalDuration;
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerText.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
      progressFill.style.width = `${pct}%`;
    }
  });

  skipBtn.addEventListener('click', async () => {
    await window.eyesCare.lockScreen.skip();
  });
});
