'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { CameraError, grabCameraFrame, openDeviceCamera } from '@/lib/photo';
import { teluguFromEnglish } from '@/lib/telugu';
import { useT } from '@/hooks/use-app-lang';
import { useToast } from '@/hooks/use-toast';
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
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  // v44: Telugu name auto-fills from the English name as the owner types —
  // until they edit the Telugu field themselves (or it's cleared), then the
  // auto-fill pauses/resumes so the owner's correction always wins
  const teAutoRef = useRef(false);
  const teTimerRef = useRef<number | undefined>(undefined);
  const scheduleTelugu = (english: string) => {
    window.clearTimeout(teTimerRef.current);
    teTimerRef.current = window.setTimeout(() => {
      if (!teAutoRef.current) return;
      const te = teluguFromEnglish(english);
      if (te) {
        setNameTe(te);
        setNameTeAuto(true);
      }
    }, 350);
  };
  const [nameTeAuto, setNameTeAuto] = useState(false);

  // sync form state when target changes
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const targetKey = p ? p.id : isNew ? 'new' : null;
  if (targetKey !== loadedId) {
    setLoadedId(targetKey);
    if (p) {
      setName(p.name);
      setNameTe(p.nameTe ?? '');
      // existing Telugu name → owner wrote it, don't auto-fill over it;
      // empty → auto-fill resumes as they type the English name
      teAutoRef.current = !p.nameTe;
      setNameTeAuto(false);
      setCategory(p.category);
      setPrice(String(p.price));
      setStock(p.stock !== undefined ? String(p.stock) : '');
      setSizes([...p.sizes]);
      setSizePrices({ ...(p.sizePrices ?? {}) });
      setImage(p.image);
    } else if (isNew) {
      setName('');
      setNameTe('');
      teAutoRef.current = true;
      setNameTeAuto(false);
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

  const { toast } = useToast();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const dataUrl = await fileToResizedDataUrl(f);
      setImage(dataUrl);
    } catch {
      // corrupt file / canvas failure — say so instead of failing silently
      toast({ title: t('products.photoError'), variant: 'destructive' });
    }
  };

  const [saving, setSaving] = useState(false);
  /** v44: the save is now AWAITED — the dialog stays open with a clear toast
   *  if the save fails (offline / server error) instead of silently closing
   *  and losing what the owner typed (the "error while adding/editing" bug) */
  const submit = async () => {
    if (saving) return;
    if (!name.trim() || !Number(price)) return;
    const payload: Product = {
      id: p?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      nameTe: nameTe.trim() || undefined,
      category: category.trim() || 'Custom',
      price: Number(price),
      sizes: sizes.length ? sizes : ['Standard'],
      sizePrices: { ...sizePrices },
      // v42 fix: send null EXPLICITLY when the photo was removed —
      // JSON.stringify drops `undefined` keys, so the server kept the old
      // image and the next poll brought it back (photos could not be removed)
      image: image ?? null,
      stock: stock !== '' ? Number(stock) : undefined,
    };
    setSaving(true);
    try {
      if (p) await updateProduct(p.id, payload);
      else await addProduct(payload);
      onOpenChange(false);
    } catch (e) {
      toast({
        title: e instanceof Error && e.message === 'offline' ? t('net.required') : t('net.saveFailed'),
        variant: 'destructive',
      });
      // dialog stays OPEN — the entered product is not lost
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = ''; // v42: allow re-picking the SAME file
                }}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
                  <ImageUp className="size-3.5" /> {t('products.uploadPhoto')}
                </Button>
                {/* v42: real live-camera preview instead of the unreliable
                    OS handoff (capture= did nothing on several devices) */}
                <Button variant="outline" size="sm" className="w-full" onClick={() => setCameraOpen(true)}>
                  <Camera className="size-3.5" /> {t('products.takePhoto')}
                </Button>
              </div>
              {image && (
                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => setImage(null)}>
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

          <Input
            placeholder={t('products.name')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              scheduleTelugu(e.target.value);
            }}
            className="h-11 min-w-0"
          />

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('products.nameTe')}</Label>
            <Input
              placeholder="ఉదా: గగులు (బావి రింగ్)"
              value={nameTe}
              onChange={(e) => {
                setNameTe(e.target.value);
                // a manual edit (or clearing the field) stops/resumes auto-fill
                teAutoRef.current = e.target.value === '';
                setNameTeAuto(false);
              }}
              className="h-11 min-w-0"
            />
            {nameTeAuto && nameTe && (
              <p className="text-[10px] leading-tight text-emerald-700">{t('products.nameTeAuto')}</p>
            )}
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
          <Button
            onClick={() => void submit()}
            disabled={saving}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? t('net.saving') : p ? t('products.saveChanges') : t('products.addProduct')}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <LiveCameraDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(dataUrl) => setImage(dataUrl)}
      />
    </>
  );
}

/**
 * v42: LIVE camera capture — a rear-camera preview with a shutter button.
 * Replaces the old capture="environment" input handoff, which silently did
 * nothing on several phones and inside the APK WebView: now the camera opens
 * inside the app, shows exactly what will be saved, and one tap captures the
 * frame (resized/compressed like any upload).
 */
function LiveCameraDialog({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCapture: (dataUrl: string) => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [busy, setBusy] = useState(false);
  // v43: callbacks/values flow through REFS — the parent form re-renders on
  // every keystroke AND on every 4s store poll, and a changing identity in
  // the deps re-ran this effect, whose cleanup KILLED the camera stream
  // mid-use (the "camera dies while taking a photo" bug). The effect now
  // depends only on `open`.
  const cbRef = useRef({ onOpenChange, onCapture, t, toast });
  cbRef.current = { onOpenChange, onCapture, t, toast };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBusy(true);
    void (async () => {
      try {
        // wait for the dialog card to actually mount (Radix mounts through a
        // portal + animation — up to ~2s on a slow phone), then attach the
        // video to the page BEFORE play() (detached elements refuse to play)
        for (let i = 0; i < 20 && !hostRef.current; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (cancelled) return;
        }
        const cam = await openDeviceCamera('environment', hostRef.current);
        if (cancelled) {
          cam.stop();
          return;
        }
        stopRef.current = cam.stop;
        // re-attach if the host rendered after the camera opened
        if (hostRef.current && cam.video.parentElement !== hostRef.current) {
          hostRef.current.replaceChildren(cam.video);
        }
      } catch (e) {
        if (cancelled) return;
        const { onOpenChange: close, t: tt, toast: tst } = cbRef.current;
        tst({
          title: tt('products.takePhoto'),
          description:
            e instanceof CameraError && e.kind === 'denied' ? tt('products.cameraPerm') : tt('products.photoError'),
          variant: 'destructive',
        });
        close(false);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [open]);

  const shoot = () => {
    const video = hostRef.current?.querySelector('video');
    if (!video) return;
    const dataUrl = grabCameraFrame(video);
    if (!dataUrl) {
      cbRef.current.toast({ title: cbRef.current.t('products.photoError'), variant: 'destructive' });
      return;
    }
    cbRef.current.onCapture(dataUrl);
    cbRef.current.onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>{t('products.takePhoto')}</DialogTitle>
          <DialogDescription>{t('products.cameraHint')}</DialogDescription>
        </DialogHeader>
        <div
          ref={hostRef}
          className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900"
          aria-label="Live camera"
        />
        <DialogFooter>
          <Button
            onClick={shoot}
            disabled={busy}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
            aria-label={t('products.shutter')}
          >
            <Camera className="size-4" />
            {t('products.shutter')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
