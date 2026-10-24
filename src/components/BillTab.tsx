'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import BillPanel from './BillPanel';
import ProductCatalog, { CustomItemDialog } from './ProductCatalog';
import { useStore } from '@/lib/store';
import { computeTotals, fmt } from '@/lib/billing';
import { ShoppingCart } from 'lucide-react';

export default function BillTab({ onCompleted }: { onCompleted: () => void }) {
  const cart = useStore((s) => s.cart);
  const cfg = useStore((s) => s.billConfig);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const totals = computeTotals(cart, cfg);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="pb-44 lg:pb-4">
      <ProductCatalog onOpenCustom={() => setCustomOpen(true)} />

      {/* Sticky mobile cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 lg:hidden">
          <button
            onClick={() => setSheetOpen(true)}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-amber-600 px-4 py-3 text-white shadow-xl shadow-amber-900/25 active:scale-[0.99] transition-transform"
            aria-label="View bill"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="relative">
                <ShoppingCart className="size-5" />
                <span className="absolute -right-2 -top-2 rounded-full bg-white text-amber-700 text-[10px] font-bold px-1.5 py-px">
                  {count}
                </span>
              </span>
              View Bill
            </span>
            <span className="text-lg font-extrabold tabular-nums">₹{fmt(totals.total)}</span>
          </button>
        </div>
      )}

      <CustomItemDialog open={customOpen} onOpenChange={setCustomOpen} />

      {/* Mobile bill sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] max-w-md mx-auto rounded-t-2xl p-0 flex flex-col w-full sm:max-w-md"
        >
          <SheetHeader className="px-4 pt-4 pb-1 shrink-0">
            <SheetTitle className="text-left">Current Bill</SheetTitle>
            <SheetDescription className="text-left text-xs">
              Review items, customer & payment — then generate the thermal slip.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] min-h-0 flex-1">
            <BillPanel
              onComplete={() => {
                setSheetOpen(false);
                onCompleted();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
