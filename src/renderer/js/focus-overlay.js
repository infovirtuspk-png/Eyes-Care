document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('focus-canvas');
  const ctx = canvas.getContext('2d');

  let mode = 'read'; // 'read', 'spotlight', 'blur'
  let focusSize = 140;
  let opacity = 0.65;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    draw();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.eyesCare.focus.disable();
    }
  });

  window.eyesCare.focus.onUpdate((params) => {
    if (params.mode) mode = params.mode;
    if (params.size) focusSize = params.size;
    if (params.opacity !== undefined) opacity = params.opacity / 100;
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(10, 12, 14, ${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'destination-out';

    if (mode === 'read') {
      // Horizontal reading ruler
      const h = focusSize;
      const y = Math.max(0, mouseY - h / 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, y, canvas.width, h);
    } else if (mode === 'spotlight' || mode === 'blur') {
      // Circular spotlight
      const radius = focusSize;
      const gradient = ctx.createRadialGradient(mouseX, mouseY, radius * 0.4, mouseX, mouseY, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }
});
