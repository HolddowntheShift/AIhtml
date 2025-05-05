// 链接处理器（立即执行函数封装）
(function() {
  // 配置参数
  const config = {
    checkTimeout: 5000, // 预检超时时间
    retryLimit: 2,      // 最大重试次数
    modalStyle: { /* 可自定义样式 */ }
  };

  // 初始化事件监听
  document.addEventListener('DOMContentLoaded', initLinkHandler);

  function initLinkHandler() {
    // 全局点击事件委托
    document.body.addEventListener('click', handleLinkClick);
  }

  // 点击事件处理
  async function handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link || !link.href) return;

    event.preventDefault();
    const url = link.href;
    
    // 显示加载状态
    const loader = showLoader(link);
    
    try {
      const isAvailable = await checkLinkAvailability(url);
      loader.remove();
      
      if (isAvailable) {
        window.location.href = url;
      } else {
        showErrorModal(url, link.textContent);
      }
    } catch (error) {
      loader.remove();
      showErrorModal(url, link.textContent);
    }
  }

  // 链接可用性检查
  async function checkLinkAvailability(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.checkTimeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok || response.type === 'opaque';
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  // 显示加载指示器
  function showLoader(anchor) {
    const loader = document.createElement('div');
    loader.className = 'link-loader';
    Object.assign(loader.style, {
      position: 'absolute',
      top: `${anchor.offsetTop}px`,
      left: `${anchor.offsetLeft}px`,
      width: `${anchor.offsetWidth}px`,
      height: `${anchor.offsetHeight}px`,
      background: 'rgba(255,255,255,0.8)'
    });
    anchor.parentNode.appendChild(loader);
    return loader;
  }

  // 显示错误模态框
  function showErrorModal(url, linkText) {
    const modalId = 'link-error-modal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'link-error-modal';
      Object.assign(modal.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000
      });
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <h3>无法访问链接</h3>
      <p>目标地址：${url}</p>
      <p>链接文本：${linkText}</p>
      <div class="actions">
        <button class="retry">重试</button>
        <button class="close">关闭</button>
      </div>
    `;

    // 事件绑定
    modal.querySelector('.retry').addEventListener('click', () => {
      modal.remove();
      window.location.href = url;
    });

    modal.querySelector('.close').addEventListener('click', () => {
      modal.remove();
    });
  }
})();
