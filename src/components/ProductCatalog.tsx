'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, PackageX } from 'lucide-react';
import { useStore } from '@/lib/store';
import { priceForSize } from '@/lib/billing';
import { PRODUCT_CATEGORIES } from '@/lib/defaultData';
import type { Product } from '@/lib/types';

export default function ProductCatalog({ onOpenCustom }: { onOpenCustom: () => void }) {
  const products = useStore((s) => s.products);
  const addToCart = useStore((s) => s.addToCart);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  const cats = useMemo(() => {
    const found = new Set(products.map((p) => p.category));
    return ['All', ...PRODUCT_CATEGORIES.slice(1).filter((c) => found.has(c)), ...[...found].filter((c) => !PRODUCT_CATEGORIES.includes(c))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === 'All' || p.category === cat) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
  }, [products, query, cat]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-11 pl-9 rounded-xl"
            aria-label="Search products"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl px-3" onClick={onOpenCustom}>
          <Plus className="size-4" /> Custom
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Product categories">
        {cats.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              cat === c ? 'bg-blue-600 text-white' : 'border bg-card hover:bg-accent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <PackageX className="size-10 opacity-40" />
          <p className="text-sm">No products found. Add products in the Products tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAddSize={(size) => addToCart(p, size)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddSize }: { product: Product; onAddSize: (size: string) => void }) {
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0;
  return (
    <div className={`rounded-xl border bg-card overflow-hidden flex flex-col ${outOfStock ? 'opacity-60' : ''}`}>
      <div className="relative aspect-[4/3] bg-neutral-100">
        {product.image ? (
          <img src={product.image} alt={product.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl">{"\u{1F9F1}"}</div>
        )}
        {typeof product.stock === 'number' && (
          <span
            className={`absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              outOfStock ? 'bg-red-600 text-white' : 'bg-black/60 text-white'
            }`}
          >
            {outOfStock ? 'Out of stock' : `Stock: ${product.stock}`}
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[13px] font-semibold leading-tight line-clamp-2">{product.name}</p>
          {product.nameTe ? <p className="text-[11px] text-blue-800 leading-tight line-clamp-1">{product.nameTe}</p> : null}
          <p className="text-xs text-muted-foreground mt-0.5">
            from <span className="font-bold text-blue-700">₹{product.price}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1 mt-auto">
          {product.sizes.map((s) => {
            const price = priceForSize(product.price, product.sizePrices, s);
            return (
              <button
                key={s}
                disabled={outOfStock}
                onClick={() => onAddSize(s)}
                title={`${s} — ₹${price}`}
                className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors disabled:opacity-40 disabled:hover:bg-blue-50 disabled:hover:text-blue-800"
              >
                +{s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CustomItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addCustomItem = useStore((s) => s.addCustomItem);
  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');

  const submit = () => {
    if (!name.trim() || !Number(price)) return;
    addCustomItem(name.trim(), size.trim() || 'Standard', Number(price), Math.max(1, Number(qty) || 1), nameTe.trim() || undefined);
    setName('');
    setNameTe('');
    setSize('');
    setPrice('');
    setQty('1');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add custom item</DialogTitle>
          <DialogDescription>
            Added to the bill now — and saved to your product list with this name, size &amp; price for next time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Item name *" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          <Input
            placeholder="Item name in Telugu (optional — తెలుగు పేరు)"
            value={nameTe}
            onChange={(e) => setNameTe(e.target.value)}
            className="h-11"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Size (e.g. 10FT)" value={size} onChange={(e) => setSize(e.target.value)} className="h-11" />
            <Input placeholder="Price ₹ *" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11" />
          </div>
          <Input placeholder="Quantity" type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className="h-11" />
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
            Add to Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

