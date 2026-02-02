import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * 对数据进行脱敏处理
 */
function sanitizeData(data) {
  const clone = JSON.parse(JSON.stringify(data));

  // 替换店铺名称
  const originalName = clone.meta?.shop_name || '';
  const placeholder = '店鋪 A';

  if (clone.meta?.shop_name) {
    clone.meta.shop_name = placeholder;
  }
  if (clone.shop_name) {
    clone.shop_name = placeholder;
  }

  // 替换 analysis_summary 中的店铺名
  if (clone.analysis_summary && originalName) {
    clone.analysis_summary = clone.analysis_summary.replaceAll(originalName, placeholder);
  }

  return clone;
}

/**
 * 创建脱敏报告的 HTML 内容
 */
function buildReportHtml(data) {
  const shopName = data.meta?.shop_name || '店鋪 A';
  const summary = data.analysis_summary || '';
  const scores = data.scores || {};

  // 将 markdown 简单转为 HTML
  const summaryHtml = summary
    .replace(/### (.+)/g, '<h3 style="margin:16px 0 8px;font-size:16px;color:#334155;">$1</h3>')
    .replace(/\n/g, '<br/>');

  const scoreEntries = Object.entries(scores)
    .map(([key, val]) => `<div style="display:inline-block;margin:4px 8px;padding:6px 14px;background:#f1f5f9;border-radius:8px;"><strong>${key}</strong>: ${val}</div>`)
    .join('');

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e293b;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="font-size:24px;color:#6d28d9;">ShopVidi Demo Report</h1>
        <p style="color:#94a3b8;font-size:14px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="margin-bottom:24px;">
        <h2 style="font-size:18px;margin-bottom:12px;">店鋪: ${shopName}</h2>
        ${scoreEntries ? `<div style="margin-bottom:16px;">${scoreEntries}</div>` : ''}
      </div>
      <div style="line-height:1.8;font-size:14px;">
        ${summaryHtml}
      </div>
      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;">
        This is a demo report with anonymized data. Powered by ShopVidi.
      </div>
    </div>
  `;
}

/**
 * 生成脱敏 Demo 报告 PDF
 * @param {object} resultData - 原始分析结果数据
 */
export async function generateDemoReport(resultData) {
  const sanitized = sanitizeData(resultData);

  // 创建隐藏容器
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;';
  container.innerHTML = buildReportHtml(sanitized);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // 首页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // 多页处理
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save('ShopVidi_Demo_Report.pdf');
  } finally {
    document.body.removeChild(container);
  }
}
