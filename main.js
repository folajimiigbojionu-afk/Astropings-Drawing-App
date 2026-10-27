const themeToggle = document.getElementById('themeToggle');
const fullScreenBtn = document.getElementById('fullScreenBtn');
const fullScreenIcon = document.getElementById('fullScreenIcon');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearButton = document.getElementById('clearCanvas');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const recentColorsContainer = document.getElementById('recentColors');
const exportButton = document.getElementById('exportBtn');

/* Drawing */
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 70;
let recentColors = [];
const MAX_RECENT_COLORS = 5;

const setContextProperties = () => {
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSizeInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
};

const resizeCanvas = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.putImageData(imageData, 0, 0);
    setContextProperties();
};

resizeCanvas();

const debounce = (func, delay = 100) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args)
        }, delay);
    }
};

const debouncedResize = debounce(resizeCanvas, 50);
window.addEventListener('resize', debouncedResize);

const draw = (e) => {
    if (!isDrawing) return;
    setContextProperties();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
};

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    addRecentColor(colorPicker.value);
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    saveHistory();
});
canvas.addEventListener('mouseleave', () => (isDrawing = false));

brushSizeInput.addEventListener('input', (e) => {
    brushSizeValue.textContent = e.target.value;
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
});

/* Theme Change */

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark-mode');
    } else {
        localStorage.removeItem('theme');
    }
});

if (localStorage.getItem('theme') === 'dark-mode') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
};

// Fullscreen

const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch((err) =>  ("Error: ${err.message}"))
    } else {
        document.exitFullscreen();
    }
};

fullScreenBtn.addEventListener('click', toggleFullScreen);

document.addEventListener('fullscreenchange', () => {
    fullScreenIcon.classList.toggle("fa-expand");
    fullScreenIcon.classList.toggle("fa-compress");
});

// Undo/Redo

const updateButtons = () => {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}

const saveHistory = () => {
    history = history.slice(0, historyIndex + 1);
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }

    if (historyIndex >= history.length) {
        historyIndex = history.length - 1;
    }

    updateButtons();
    console.log("History:", historyIndex, history);
    console.log("History index: ", historyIndex);
};

saveHistory();

const applyHistory = () => {
    if (history[historyIndex]) {
        ctx.putImageData(history[historyIndex], 0, 0);
    }
};

const stepHistory = (direction) => {
    const newIndex = historyIndex + direction;
    if (newIndex >= 0 && newIndex < history.length) {
        historyIndex = newIndex;
        applyHistory();
        updateButtons();
    }
};

const undo = () => {
    stepHistory(-1);
};

const redo = () => {
    stepHistory(1);
};

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
    }    
});

// Recent Colors

const displayRecentColors = () => {
    recentColorsContainer.innerHTML = '';
    recentColors.forEach((color) => {
        const colorDiv = document.createElement('div');
        colorDiv.classList.add('recent-color-item');
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', () => {
            colorPicker.value = color;
        });

        recentColorsContainer.appendChild(colorDiv);
    });
};

const addRecentColor = (color) => {
    if (!recentColors.includes(color)) {
        recentColors = recentColors.filter(c => c !== color);
    }

    recentColors.unshift(color);

    if (recentColors.length > MAX_RECENT_COLORS) {
        recentColors.pop();
    }

    console.log("colors:", recentColors);

    displayRecentColors();
};

addRecentColor("#2d3436");

// ==========================================
// EXPORT TO PNG FUNCTION
// ==========================================
function exportToPNG() {
    // Convert canvas strokes into a downloadable image link
    const imageURL = drawingCanvas.toDataURL('image/png');
    
    // Create an invisible download link element
    const downloadLink = document.createElement('a');
    downloadLink.download = 'my-drawing.png';
    downloadLink.href = imageURL;
    
    // Programmatically click the link to trigger the download
    downloadLink.click();
}

// Listen for clicks on your new export button
exportButton.addEventListener('click', exportToPNG);