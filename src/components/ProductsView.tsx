'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Plus, Search, Trash2, X, Camera, ImageUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fileToResizedDataUrl } from '@/lib/imageResize';
import { useT } from '@/hooks/use-app-lang';
import { PRODUCT_CATEGORIES } from '@/lib/defaultData';
import { fmtShort } from '@/lib/billing';
import type { Product } from '@/lib/types';

const SAMPLE_IMAGES = [
  '/products/well-rings.jpg',
  '/products/well-lids.jpg',
  '/products/poles.jpg',
  '/products/poles-2.jpg',
  '/products/rings-2.jpg',
  '/products/window-frames.jpg',
  '/products/window-frames-2.jpg',
  '/products/slabs.jpg',
  '/products/slabs-2.jpg',
];

const SIZE_PRESETS = ['2FT', '2.5FT', '3FT', '4FT', '5FT', '6FT', '8FT', '9FT', '10FT', '11FT', '12FT'];

export default function ProductsView() {
  const t = useT();
  const products = useStore((s) => s.products);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('cat.search')} className="h-11 pl-9 rounded-xl" aria-label="Search products" />
        </div>
        <Button onClick={() => setEditing('new')} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4" /> {t('products.add')}
        </Button>
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {p.image ? (
                <img src={p.image} alt={p.name} className="size-full object-cover" loading="lazy" />
              ) : (
                <div className="flex size-full items-center justify-center text-xl">{"\u{1F9F1}"}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              {p.nameTe ? <p className="truncate text-xs text-blue-800">{p.nameTe}</p> : null}
              <p className="text-xs text-muted-foreground">{p.category}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.sizes.slice(0, 6).map((s) => (
                  <span key={s} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                    {s}: ₹{fmtShort(p.sizePrices?.[s] ?? p.price)}
                  </span>
                ))}
                {p.sizes.length > 6 && <span className="text-[10px] text-muted-foreground">+{p.sizes.length - 6} more</span>}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="outline" size="icon" className="size-8" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                <Pencil className="size-3.5" />
              </Button>
              <DeleteProductButton id={p.id} name={p.name} />
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">{t('products.noProductsYet')}</li>
        )}
      </ul>

      <ProductFormDialog product={editing} onOpenChange={(v) => !v && setEditing(null)} />
    </div>
  );
}

function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const deleteProduct = useStore((s) => s.deleteProduct);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label={`Delete ${name}`}>
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-xs">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>{name} will be removed from the catalog. Existing bills are not affected.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteProduct(id)} className="bg-destructive text-white hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProductFormDialog({ product, onOpenChange }: { product: Product | 'new' | null; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const isNew = product === 'new';
  const p = isNew || !product ? null : product;

  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [category, setCategory] = useState('Custom');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({});
  const [image, setImage] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // sync form state when target changes
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const targetKey = p ? p.id : isNew ? 'new' : null;
  if (targetKey !== loadedId) {
    setLoadedId(targetKey);
    if (p) {
      setName(p.name);
      setNameTe(p.nameTe ?? '');
      setCategory(p.category);
      setPrice(String(p.price));
      setStock(p.stock !== undefined ? String(p.stock) : '');
      setSizes([...p.sizes]);
      setSizePrices({ ...(p.sizePrices ?? {}) });
      setImage(p.image);
    } else if (isNew) {
      setName('');
      setNameTe('');
      setCategory('Custom');
      setPrice('');
      setStock('');
      setSizes([]);
      setSizePrices({});
      setImage(undefined);
    }
  }

  if (!product) return null;

  const addSize = (s: string) => {
    const v = s.trim().toUpperCase();
    if (!v || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizePrices((prev) => ({ ...prev, [v]: Number(price) || 0 }));
    setSizeInput('');
  };

  const removeSize = (s: string) => {
    setSizes((prev) => prev.filter((x) => x !== s));
    setSizePrices((prev) => {
      const next = { ...prev };
      delete next[s];
      return next;
    });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const dataUrl = await fileToResizedDataUrl(f);
    setImage(dataUrl);
  };

  const submit = () => {
    if (!name.trim() || !Number(price)) return;
    const payload: Product = {
      id: p?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      nameTe: nameTe.trim() || undefined,
      category: category.trim() || 'Custom',
      price: Number(price),
      sizes: sizes.length ? sizes : ['Standard'],
      sizePrices: { ...sizePrices },
      image,
      stock: stock !== '' ? Number(stock) : undefined,
    };
    if (p) updateProduct(p.id, payload);
    else addProduct(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[90dvh] overflow-y-auto overflow-x-hidden [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>{p ? t('products.editProduct') : t('products.addProduct')}</DialogTitle>
          <DialogDescription>{t('products.formDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Image — upload from gallery OR capture with the camera */}
          <div className="flex items-center gap-3">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-neutral-100">
              {image ? (
                <img src={image} alt="Product" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl">{"\u{1F9F1}"}</div>
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              {/* capture=environment opens the phone camera directly */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
                  <ImageUp className="size-3.5" /> {t('products.uploadPhoto')}
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => cameraRef.current?.click()}>
                  <Camera className="size-3.5" /> {t('products.takePhoto')}
                </Button>
              </div>
              {image && (
                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => setImage(undefined)}>
                  <X className="size-3.5" /> {t('products.removePhoto')}
                </Button>
              )}
            </div>
          </div>

          {/* Sample images */}
          <div>
            <Label className="text-xs text-muted-foreground">{t('products.sampleImage')}</Label>
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
              {SAMPLE_IMAGES.map((src) => (
                <button
                  key={src}
                  onClick={() => setImage(src)}
                  className={`size-12 shrink-0 overflow-hidden rounded-md border-2 ${image === src ? 'border-blue-600' : 'border-transparent'}`}
                  aria-label={`Use sample image ${src}`}
                >
                  <img src={src} alt="Sample" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <Input placeholder={t('products.name')} value={name} onChange={(e) => setName(e.target.value)} className="h-11 min-w-0" />

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('products.nameTe')}</Label>
            <Input
              placeholder="ఉదా: గగులు (బావి రింగ్)"
              value={nameTe}
              onChange={(e) => setNameTe(e.target.value)}
              className="h-11 min-w-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('products.category')}</Label>
              <Input
                list="product-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 min-w-0"
                placeholder="Category"
              />
              <datalist id="product-categories">
                {PRODUCT_CATEGORIES.slice(1).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('products.basePrice')}</Label>
              <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11" placeholder="0" />
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('products.sizes')}</Label>
            <div className="flex flex-wrap gap-1">
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => addSize(s)}
                  disabled={sizes.includes(s)}
                  className="rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-30"
                >
                  +{s}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSize(sizeInput);
                  }
                }}
                placeholder={t('products.customSize')}
                className="h-10 min-w-0 flex-1"
              />
              <Button variant="outline" className="h-10 px-3" onClick={() => addSize(sizeInput)}>
                <Plus className="size-4" />
              </Button>
            </div>
            {sizes.length > 0 && (
              <ul className="space-y-1 rounded-lg border p-2 max-h-44 overflow-y-auto">
                {sizes.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 font-semibold">{s}</span>
                    <span className="text-muted-foreground shrink-0">₹</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={sizePrices[s] ?? ''}
                      onChange={(e) => setSizePrices((prev) => ({ ...prev, [s]: Number(e.target.value) || 0 }))}
                      className="h-8 min-w-0 flex-1"
                      aria-label={`Price for size ${s}`}
                    />
                    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeSize(s)} aria-label={`Remove size ${s}`}>
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('products.stock')}</Label>
            <Input type="number" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className="h-11" placeholder="Leave empty to hide" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
            {p ? t('products.saveChanges') : t('products.addProduct')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
