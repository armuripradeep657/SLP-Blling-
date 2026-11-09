'use client';

import { useState } from 'react';
import BillPanel from './BillPanel';
import ProductCatalog, { CustomItemDialog } from './ProductCatalog';
import { useStore } from '@/lib/store';
import { computeTotals, fmt } from '@/lib/billing';
import { useT } from '@/hooks/use-app-lang';
import { ShoppingCart } from 'lucide-react';

export default function BillTab({ onCompleted }: { onCompleted: () => void }) {
  const t = useT();
  const cart = useStore((s) => s.cart);
  const cfg = useStore((s) => s.billConfig);
  const [customOpen, setCustomOpen] = useState(false);

  const totals = computeTotals(cart, cfg);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  // Sticky bar jumps straight to the live bill panel below the catalog
  const scrollToBill = () =>
    document.getElementById('current-bill')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="pb-44 lg:pb-4">
      <ProductCatalog onOpenCustom={() => setCustomOpen(true)} />

      {/* Added items show up HERE — the current bill lives on the page, under the products */}
      <div id="current-bill" className="mt-5 lg:hidden">
        {cart.length > 0 && (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-neutral-800">
              <ShoppingCart className="size-4 text-blue-700" />
              {t('page.currentBill')}
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {count}
              </span>
            </h3>
            <div className="anim-fade-up rounded-2xl border bg-card p-3 shadow-sm">
              <BillPanel onComplete={onCompleted} />
            </div>
          </>
        )}
      </div>

      {/* Sticky mobile cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 lg:hidden">
          <button
            onClick={scrollToBill}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-xl shadow-blue-900/25 active:scale-[0.99] transition-transform"
            aria-label="View bill"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="relative">
                <ShoppingCart className="size-5" />
                <span className="absolute -right-2 -top-2 rounded-full bg-white text-blue-700 text-[10px] font-bold px-1.5 py-px">
                  {count}
                </span>
              </span>
              {t('page.viewBill')}
            </span>
            <span className="text-lg font-extrabold tabular-nums">₹{fmt(totals.total)}</span>
          </button>
        </div>
      )}

      <CustomItemDialog open={customOpen} onOpenChange={setCustomOpen} />
    </div>
  );
}
