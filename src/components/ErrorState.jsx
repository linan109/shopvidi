import { AlertCircle } from 'lucide-react';

/**
 * 错误状态组件
 * 显示未开通提示
 */
export default function ErrorState() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          您的店鋪尚未開通此功能
        </h2>
        <p className="text-gray-600">
          請您聯繫 Boutir 客服咨詢開通事宜
        </p>
      </div>
    </div>
  );
}
