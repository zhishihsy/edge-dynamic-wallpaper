// ----------------------------------------------------
// (1) 视频配置
// ----------------------------------------------------
// 视频列表 "videoList" 从 "videoConfig.js" 加载
// ----------------------------------------------------

// ----------------------------------------------------
// (2) 获取我们需要的HTML元素
// ----------------------------------------------------
const videoPlayer = document.getElementById('bg-video');
const muteButton = document.getElementById('mute-btn');
const randomButton = document.getElementById('random-btn');
const videoSelect = document.getElementById('video-select');
const opacitySlider = document.getElementById('opacity-range');
const searchContainer = document.querySelector('.search-container');
const controlsContainer = document.querySelector('.controls-container');
const rotateToggle = document.getElementById('rotate-toggle');
const volumeSlider = document.getElementById('volume-range'); // 音量滑块

// ----------------------------------------------------
// (3) 视频逻辑
// ----------------------------------------------------

// 填充下拉菜单
videoList.forEach(videoName => {
  const option = document.createElement('option');
  option.value = videoName;
  option.textContent = videoName.split('.')[0];
  videoSelect.appendChild(option);
});

// 播放指定视频
function playVideo(videoName) {
  const videoSource = `videos/${videoName}`;
  if (videoPlayer.querySelector('source')) {
    videoPlayer.querySelector('source').setAttribute('src', videoSource);
  } else {
    const sourceElement = document.createElement('source');
    sourceElement.setAttribute('src', videoSource);
    sourceElement.setAttribute('type', 'video/mp4');
    videoPlayer.appendChild(sourceElement);
  }
  videoPlayer.load();
  videoPlayer.play();
  videoSelect.value = videoName;
}

// 播放随机视频
function playRandomVideo() {
  const randomIndex = Math.floor(Math.random() * videoList.length);
  const randomVideoName = videoList[randomIndex];
  playVideo(randomVideoName);
}

// 下拉菜单选择事件
videoSelect.addEventListener('change', () => {
  playVideo(videoSelect.value);
  if (rotateToggle.checked) {
    startRotation();
  }
});

// 随机按钮点击事件
randomButton.addEventListener('click', () => {
  playRandomVideo();
  if (rotateToggle.checked) {
    startRotation();
  }
});

// ----------------------------------------------------
// (4) 音频逻辑 (静音 + 音量)
// ----------------------------------------------------

// 更新静音状态和按钮文本的辅助函数
function updateMuteState(muted) {
  videoPlayer.muted = muted;
  if (muted) {
    muteButton.textContent = "🔇 静音";
  } else {
    muteButton.textContent = "🔊 播放声音";
    // 尝试播放（如果因为浏览器策略被暂停了）
    videoPlayer.play().catch(error => {
      console.warn("有声播放被阻止，等待用户交互。", error);
    });
  }
}

// 静音按钮逻辑
muteButton.addEventListener('click', () => {
  const currentlyMuted = videoPlayer.muted;

  if (currentlyMuted) {
    // 正在取消静音
    updateMuteState(false);
    // 如果取消静音时音量为0，则自动设置一个默认音量
    if (videoPlayer.volume === 0) {
      const defaultVolume = 0.5;
      videoPlayer.volume = defaultVolume;
      volumeSlider.value = defaultVolume;
      chrome.storage.sync.set({ videoVolume: defaultVolume });
    }
  } else {
    // 正在静音
    updateMuteState(true);
  }
});

// 音量滑块逻辑
volumeSlider.addEventListener('input', () => {
  const newVolume = parseFloat(volumeSlider.value);
  videoPlayer.volume = newVolume;
  chrome.storage.sync.set({ videoVolume: newVolume });

  // 如果用户拖动滑块，自动取消静音（除非拖到0）
  if (newVolume > 0) {
    updateMuteState(false);
  } else {
    updateMuteState(true);
  }
});

// 页面加载时：获取保存的音量
chrome.storage.sync.get(['videoVolume'], (result) => {
  // 默认音量为 1 (100%)
  let savedVolume = result.videoVolume !== undefined ? result.videoVolume : 1.0;
  videoPlayer.volume = savedVolume;
  volumeSlider.value = savedVolume;

});

// ----------------------------------------------------
// (5) 透明度逻辑 (使用 storage API)
// ----------------------------------------------------

// 设置UI透明度的函数
function setOpacity(value) {
  const opacityValue = parseFloat(value);
  searchContainer.style.opacity = opacityValue;
  opacitySlider.value = opacityValue;
}

// 页面加载时：尝试从存储中获取保存的透明度
chrome.storage.sync.get(['uiOpacity'], (result) => {
  let savedOpacity = result.uiOpacity || 0.8;
  setOpacity(savedOpacity);
});

// 滑块滑动时：更新UI并保存设置
opacitySlider.addEventListener('input', () => {
  const newOpacity = opacitySlider.value;
  setOpacity(newOpacity);
  chrome.storage.sync.set({ uiOpacity: newOpacity });
});


// ----------------------------------------------------
// (5.5) 自动轮播逻辑
// ----------------------------------------------------

let rotationTimer = null;
const ROTATION_INTERVAL = 15 * 60 * 1000;

function startRotation() {
  if (rotationTimer) {
    clearInterval(rotationTimer);
  }
  rotationTimer = setInterval(playRandomVideo, ROTATION_INTERVAL);
  console.log('自动轮播已启动 (15分钟)');
}

function stopRotation() {
  if (rotationTimer) {
    clearInterval(rotationTimer);
    rotationTimer = null;
    console.log('自动轮播已停止');
  }
}

// 页面加载时：获取保存的轮播状态
chrome.storage.sync.get(['autoRotate'], (result) => {
  const enabled = !!result.autoRotate;
  rotateToggle.checked = enabled;
  if (enabled) {
    startRotation();
  }
});

// 开关点击事件
rotateToggle.addEventListener('change', () => {
  const enabled = rotateToggle.checked;
  chrome.storage.sync.set({ autoRotate: enabled });

  if (enabled) {
    startRotation();
    playRandomVideo();
  } else {
    stopRotation();
  }
});


// ----------------------------------------------------
// (6) 初始启动
// ----------------------------------------------------
playRandomVideo();