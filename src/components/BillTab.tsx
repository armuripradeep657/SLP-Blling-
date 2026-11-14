'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import BillPanel from './BillPanel';
import ProductCatalog, { CustomItemDialog } from './ProductCatalog';
import { useStore } from '@/lib/store';
import { computeTotals, fmt } from '@/lib/billing';
import { useT } from '@/hooks/use-app-lang';
import { ShoppingCart } from 'lucide-react';

export default function BillTab({
  onCompleted,
  onUpi,
}: {
  onCompleted: () => void;
  /** UPI bills go to the scan-and-pay screen first — the bill completes
   *  itself when the money arrives (auto-detected payment) */
  onUpi?: (amount: number) => void;
}) {
  const t = useT();
  const cart = useStore((s) => s.cart);
  const cfg = useStore((s) => s.billConfig);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const totals = computeTotals(cart, cfg);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="pb-44 lg:pb-4">
      <ProductCatalog onOpenCustom={() => setCustomOpen(true)} />

      {/* Sticky mobile cart bar — the only bill UI on this page */}
      {cart.length > 0 && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 lg:hidden">
          <button
            onClick={() => setSheetOpen(true)}
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

      {/* Mobile bill sheet — opens with a FRESH customer (name/mobile blank every time) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] max-w-md mx-auto rounded-t-2xl p-0 flex flex-col w-full sm:max-w-md"
        >
          <SheetHeader className="px-4 pt-4 pb-1 shrink-0">
            <SheetTitle className="text-left">{t('page.currentBill')}</SheetTitle>
            <SheetDescription className="text-left text-xs">{t('page.viewBillDesc')}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] min-h-0 flex-1">
            <BillPanel
              onComplete={() => {
                setSheetOpen(false);
                onCompleted();
              }}
              onUpi={(amount) => {
                setSheetOpen(false);
                onUpi?.(amount);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
