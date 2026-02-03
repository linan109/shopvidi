/**
 * 将图片 URL 转换为 base64
 */
async function imageToBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(url); // 失败时返回原 URL
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // 失败时返回原 URL
  }
}

/**
 * 获取页面所有样式
 */
function getAllStyles() {
  let styles = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        styles += rule.cssText + '\n';
      }
    } catch (e) {
      // 跨域样式表无法访问，跳过
    }
  }
  return styles;
}

/**
 * 保存页面为单一 HTML 文件
 */
export async function saveAsHtml(selector = '#report-content', filename = 'ShopVidi_Report.html') {
  const element = document.querySelector(selector);
  if (!element) {
    console.error('找不到要保存的元素:', selector);
    return;
  }

  // 克隆元素
  const clone = element.cloneNode(true);

  // 将图片转为 base64
  const images = clone.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(async (img) => {
      if (img.src && !img.src.startsWith('data:')) {
        img.src = await imageToBase64(img.src);
      }
    })
  );

  // 获取样式
  const styles = getAllStyles();

  // 构建完整 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShopVidi Report</title>
  <style>
    ${styles}
    /* 覆盖样式确保居中 */
    body {
      font-family: system-ui, -apple-system, sans-serif !important;
      background: #ffffff !important;
      padding: 40px !important;
      max-width: 1200px !important;
      margin: 0 auto !important;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

  // 下载
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * 生成报告（保存为 HTML）
 */
export async function generateReportImage() {
  await saveAsHtml('#report-content', 'ShopVidi_Report.html');
}
