import html2canvas from 'html2canvas';

/**
 * 等待页面所有图片加载完成
 */
async function waitForImages(element) {
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    )
  );
}

/**
 * 截取页面内容生成图片下载
 * @param {string} selector - 要截取的 DOM 选择器
 * @param {string} filename - 下载文件名
 */
export async function captureAndDownload(selector = '#report-content', filename = 'ShopVidi_Report.png') {
  const element = document.querySelector(selector);
  if (!element) {
    console.error('找不到要截取的元素:', selector);
    return;
  }

  // 等待图片加载
  await waitForImages(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      logging: true,
    });

    // 转为图片并下载
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('截图失败:', err);
  }
}

/**
 * 生成报告图片（供外部 API 调用）
 */
export async function generateReportImage() {
  await captureAndDownload('#report-content', 'ShopVidi_Report.png');
}
