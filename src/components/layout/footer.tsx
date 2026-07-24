import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-2 text-lg font-bold text-red-600">华德福</div>
            <p className="text-sm text-gray-500">
              面向在德华人的本地化生活信息聚合与点评平台。
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">浏览</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/companies" className="hover:text-red-600">转运公司</Link></li>
              <li><Link href="/codes" className="hover:text-red-600">优惠码</Link></li>
              <li><Link href="/phone-plans" className="hover:text-red-600">电话套餐</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">商家</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/merchant/apply" className="hover:text-red-600">入驻申请</Link></li>
              <li><Link href="/merchant" className="hover:text-red-600">商家后台</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">关于</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-red-600">关于我们</Link></li>
              <li><Link href="/privacy" className="hover:text-red-600">隐私政策</Link></li>
              <li><Link href="/terms" className="hover:text-red-600">服务条款</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 rounded-md bg-amber-50 px-4 py-3 text-center text-xs text-amber-700 ring-1 ring-amber-200">
          ⚠️ 价格仅供参考，以官网为准。转运公司报价变动频繁，下单前请到官网核实最新费率。
        </div>
        <div className="mt-4 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} 华德福 HuaDeFu. 仅供信息聚合参考，不构成消费建议。
        </div>
      </div>
    </footer>
  );
}
