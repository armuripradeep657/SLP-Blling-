'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  MessageCircle,
  MessageSquare,
  Printer,
  Share2,
  Copy,
  Loader2,
  ScanLine,
  Image as ImageIcon,
  Send,
  ReceiptText,
  FileText,
  Truck,
} from 'lucide-react';
import ThermalSlip from './ThermalSlip';
import InvoiceDoc from './InvoiceDoc';
import DriverSlip from './DriverSlip';
import { useStore } from '@/lib/store';
import { captureSlipPng, downloadBlob, printImage, slipFileName } from '@/lib/invoiceImage';
import { normalizePhone, smsLink, waChatLink, waLink } from '@/lib/billing';
import { smsMessage, whatsappCaption, whatsappMessage } from '@/lib/messages';
import { BILL_LANGUAGES } from '@/lib/i18n';
import type { BillLanguage, Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** which document to show first — thermal slip, formal invoice or driver slip */
  view?: DocView;
}

export type DocView = 'slip' | 'invoice' | 'driver';

export default function InvoiceModal({ invoice: invoiceProp, open, onOpenChange, view = 'slip' }: Props) {
  const settings = useStore((s) => s.settings);
  const updateInvoiceLanguage = useStore((s) => s.updateInvoiceLanguage);
  // Live copy from the store so a language switch re-renders the slip instantly
  // (and the invoice saved in History keeps the chosen language)
  const stored = useStore((s) => s.invoices.find((i) => i.id === invoiceProp?.id));
  const invoice = stored ?? invoiceProp;
  const { toast } = useToast();
  const slipRef = useRef<HTMLDivElement | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const driverRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Which document is shown / captured — thermal slip or formal invoice
  const [mode, setMode] = useState<DocView>(view);
  useEffect(() => {
    if (open) setMode(view);
  }, [view, open]);

  // Off-screen render node used for html-to-image capture
  const captureRef = useRef<HTMLDivElement | null>(null);

  // Helper dialog state for browsers that cannot attach files to a share
  const [waFallback, setWaFallback] = useState<{ url: string; fileName: string } | null>(null);

  const getCaptureTarget = useCallback((): HTMLElement | null => {
    if (captureRef.current) return captureRef.current;
    if (mode === 'invoice') return invoiceRef.current;
    if (mode === 'driver') return driverRef.current;
    return slipRef.current;
  }, [mode]);

  if (!invoice) return null;

  const hasDriverSlip = !!invoice.delivery?.delivered;
  const waCaption = whatsappCaption(invoice, settings);
  const waMsg = whatsappMessage(invoice, settings);
  const smsMsg = smsMessage(invoice, settings);
  const fileName = slipFileName(mode === 'driver' ? `${invoice.no}-driver` : invoice.no);

  const guard = async (key: string, fn: () => Promise<void> | void) => {
    try {
      setBusy(key);
      await fn();
    } catch (err) {
      // user cancelled share sheet — not an error
      if ((err as DOMException)?.name === 'AbortError') return;
      console.error(err);
      toast({
        title: 'Action failed',
        description: (err as Error)?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const capture = async (pixelRatio = 3): Promise<Blob> => {
    const node = getCaptureTarget();
    if (!node) throw new Error('Slip not ready');
    return captureSlipPng(node, pixelRatio);
  };

  /** v53 — capture that NEVER blocks sharing: on phones where html-to-image
   *  fails (font inlining, canvas memory, blocked asset fetch), it retries
   *  lighter and finally gives up with null so the TEXT path can take over.
   *  The customer always receives the bill one way or another. */
  const captureBestEffort = async (): Promise<Blob | null> => {
    try {
      return await capture(3);
    } catch (e) {
      console.warn('capture r1 failed — retrying lighter', e);
    }
    try {
      const node = getCaptureTarget();
      if (!node) return null;
      return await captureSlipPng(node, 2, { skipFonts: true, cacheBust: false });
    } catch (e) {
      console.warn('capture r2 failed — falling back to text share', e);
    }
    return null;
  };

  /** v53 — open an external URL even when window.open is popup-blocked
   *  (PWAs and in-app browsers block popups; the anchor click still navigates) */
  const openExternal = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onShare = () =>
    guard('share', async () => {
      const blob = await captureBestEffort();
      if (!blob) {
        // capture failed on this phone — the bill still goes out as TEXT
        openExternal(waLink(invoice.customer.phone, waMsg));
        toast({
          title: 'Bill sent as text',
          description: 'The image could not be processed on this phone — the full bill was sent as a WhatsApp message instead.',
        });
        return;
      }
      const file = new File([blob], fileName, { type: 'image/png' });
      // Direct native share WITH the image attached (WhatsApp, SMS, etc.)
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: waCaption,
            title: `Bill ${invoice.no}`,
          });
          return;
        }
      } catch (e) {
        // user cancelled — stop silently; a REAL share rejection falls through
        // to the helper below instead of dead-ending with "Action failed"
        if ((e as DOMException)?.name === 'AbortError') return;
        console.warn('native share rejected — falling back', e);
      }
      // Fallback: download + open WhatsApp chat, guide the user to attach
      downloadBlob(blob, fileName);
      setWaFallback({ url: URL.createObjectURL(blob), fileName });
    });

  /**
   * DIRECT send — v54 IMAGE-FIRST: the bill goes to WhatsApp as the PICTURE.
   * 1) clipboard image → the customer's chat opens ready to Paste+Send;
   * 2) clipboard blocked → the native share sheet carries the IMAGE FILE —
   *    WhatsApp receives the picture itself, you just pick the customer;
   * 3) neither works → the image is saved to the gallery and the chat opens
   *    (bill text pre-filled) — attach the picture from 📎/gallery;
   * 4) only when no image can be captured at all → text-only bill.
   */
  const onWhatsAppDirect = () =>
    guard('wa', async () => {
      const phone = invoice.customer.phone;
      const blob = await captureBestEffort();

      // no image possible on this phone — the text bill is the last resort
      if (!blob) {
        openExternal(waLink(phone, waMsg));
        toast({
          title: 'Bill sent as text',
          description: 'The image could not be processed on this phone — the full bill was placed in WhatsApp as a message.',
        });
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      // 1) Put the bill image on the clipboard — paste straight into the chat
      let copied = false;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copied = true;
      } catch {
        /* clipboard blocked — the share sheet below carries the image instead */
      }

      if (copied) {
        // image is ON the clipboard — open the customer's chat directly and
        // the bill goes as the PICTURE (long-press → Paste → Send)
        downloadBlob(blob, fileName); // gallery copy too — belt and braces
        openExternal(waChatLink(phone));
        toast({
          title: invoice.customer.phone
            ? `Chat opened for ${invoice.customer.name || normalizePhone(phone)}`
            : 'No customer number on the bill — pick a chat',
          description: 'Bill image copied — long-press the WhatsApp message box, Paste, and Send. (Image also saved to gallery.)',
        });
        return;
      }

      // 2) clipboard blocked → share the IMAGE FILE itself: WhatsApp receives
      //    the picture with the bill caption; you pick the customer chat
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: waCaption, title: `Bill ${invoice.no}` });
          return;
        }
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return;
        console.warn('share-sheet image rejected — opening chat with attach guidance', e);
      }

      // 3) image saved to the gallery + chat opens — attach with 📎
      downloadBlob(blob, fileName);
      openExternal(waLink(phone, waMsg));
      toast({
        title: invoice.customer.phone
          ? `Chat opened for ${invoice.customer.name || normalizePhone(phone)}`
          : 'No customer number on the bill — pick a chat',
        description: `Bill image ${fileName} saved to gallery — tap 📎 in the chat, attach it, and Send. The bill text is pre-filled too.`,
      });
    });

  /** Share-sheet send (used when no customer number is on the bill) */
  const onWhatsApp = () =>
    guard('wa', async () => {
      const blob = await captureBestEffort();
      if (!blob) {
        openExternal(waLink(invoice.customer.phone, waMsg));
        toast({
          title: 'Bill sent as text',
          description: 'The image could not be processed on this phone — the full bill was placed in WhatsApp as a message.',
        });
        return;
      }
      const file = new File([blob], fileName, { type: 'image/png' });
      // 1st choice: share sheet WITH the bill image attached — user picks WhatsApp
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: waCaption,
            title: `Bill ${invoice.no}`,
          });
          return;
        }
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return;
        console.warn('native share rejected — falling back', e);
      }
      // 2nd choice: save the image + show step-by-step helper with preview
      downloadBlob(blob, fileName);
      setWaFallback({ url: URL.createObjectURL(blob), fileName });
    });

  const openWaChat = () => {
    openExternal(waChatLink(invoice.customer.phone));
    setWaFallback(null);
  };

  const onSMS = () =>
    guard('sms', () => {
      // v53: sms:+91… so the recipient resolves on every device/carrier
      window.location.href = smsLink(invoice.customer.phone, smsMsg);
      toast({
        title: 'Opening SMS app…',
        description: invoice.customer.phone
          ? 'SMS carries text — the bill image can be MMS-attached by your messaging app.'
          : 'No customer number on the bill — pick a recipient, the bill text is ready.',
      });
    });

  const onDownload = () =>
    guard('dl', async () => {
      const blob = await capture();
      downloadBlob(blob, fileName);
      toast({ title: 'Bill image saved', description: fileName });
    });

  const onPrint = () =>
    guard('print', async () => {
      const blob = await capture(3);
      const ok = printImage(blob);
      if (!ok) throw new Error('Allow pop-ups to print the bill');
    });

  const onCopy = () =>
    guard('copy', async () => {
      await navigator.clipboard.writeText(waMsg);
      toast({ title: 'Bill text copied' });
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-hidden p-0 gap-0 grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            {mode === 'invoice' ? 'Invoice' : mode === 'driver' ? 'Driver Slip' : 'Bill Generated'} — {invoice.no}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === 'invoice' ? (
              <>
                Full <b>invoice</b> image — WhatsApp sends this picture only. Paid bills carry a <b>PAID</b> stamp; every bill carries the <b>Code 128 verification barcode</b>.
              </>
            ) : mode === 'driver' ? (
              <>
                <b>Driver slip</b> image — items &amp; quantities only, <b>no prices</b>. Driver, vehicle &amp; delivery address included.
              </>
            ) : (
              <>
                Thermal-slip <b>image</b> — WhatsApp sends this picture only. Paid bills carry a <b>PAID</b> stamp; every bill carries the <b>Code 128 verification barcode</b>.
              </>
            )}
          </DialogDescription>
          {/* View switch — the owner sees the thermal slip, the formal invoice AND the driver slip */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground shrink-0">View:</span>
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setMode('slip')}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  mode === 'slip' ? 'border-blue-600 bg-blue-600 text-white' : 'bg-card hover:bg-accent'
                }`}
                aria-pressed={mode === 'slip'}
              >
                <ReceiptText className="size-3" /> Thermal slip
              </button>
              <button
                type="button"
                onClick={() => setMode('invoice')}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  mode === 'invoice' ? 'border-blue-600 bg-blue-600 text-white' : 'bg-card hover:bg-accent'
                }`}
                aria-pressed={mode === 'invoice'}
              >
                <FileText className="size-3" /> Invoice
              </button>
              {hasDriverSlip && (
                <button
                  type="button"
                  onClick={() => setMode('driver')}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    mode === 'driver' ? 'border-blue-600 bg-blue-600 text-white' : 'bg-card hover:bg-accent'
                  }`}
                  aria-pressed={mode === 'driver'}
                >
                  <Truck className="size-3" /> Driver
                </button>
              )}
            </div>
          </div>
          {/* Bill language — flips the slip + bill text instantly, saved on the invoice */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground shrink-0">Bill language:</span>
            <div className="flex gap-1">
              {BILL_LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    updateInvoiceLanguage(invoice.id, l.value as BillLanguage)
                  }
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    (invoice.language ?? 'en') === l.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'bg-card hover:bg-accent'
                  }`}
                  aria-pressed={(invoice.language ?? 'en') === l.value}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {invoice.totals.balance > 0 && !settings.upiId && (
            <div className="mt-1 flex items-start gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-2 text-[11px] leading-snug text-blue-900">
              <ScanLine className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Balance is due — add your <b>UPI ID</b> in <b>Settings</b> and the bill shows it for the balance payment.
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <div className="mx-4 rounded-lg border bg-neutral-100">
            <div className="flex justify-center py-4">
              {/* Invoice doc is 430px wide — zoom the PREVIEW to fit the modal;
                  the off-screen capture node below stays full-size.
                  Keyed by view+language so switching re-plays the entrance animation */}
              <div
                key={`${mode}-${invoice.language}`}
                className="anim-fade-up shadow-md bg-white"
                style={mode === 'invoice' ? { zoom: 0.7 } : undefined}
              >
                {mode === 'invoice' ? (
                  <InvoiceDoc invoice={invoice} settings={settings} rootRef={(n) => (invoiceRef.current = n)} />
                ) : mode === 'driver' ? (
                  <DriverSlip invoice={invoice} settings={settings} rootRef={(n) => (driverRef.current = n)} />
                ) : (
                  <ThermalSlip invoice={invoice} settings={settings} rootRef={(n) => (slipRef.current = n)} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          {invoice.customer.phone ? (
            <Button
              onClick={onWhatsAppDirect}
              disabled={busy !== null}
              className="w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#1eb857] text-white"
            >
              {busy === 'wa' ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              Send Direct to {invoice.customer.name || normalizePhone(invoice.customer.phone)}
            </Button>
          ) : (
            <Button
              onClick={onWhatsApp}
              disabled={busy !== null}
              className="w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#1eb857] text-white"
            >
              {busy === 'wa' ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
              Send Bill Image on WhatsApp
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onShare} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'share' ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Share Image
            </Button>
            <Button onClick={onDownload} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'dl' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download
            </Button>
            <Button onClick={onSMS} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'sms' ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
              SMS
            </Button>
            <Button onClick={onPrint} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'print' ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              Print
            </Button>
          </div>
          <Button onClick={onCopy} disabled={busy !== null} variant="ghost" className="w-full h-9 text-xs">
            <Copy className="size-3.5" /> Copy bill as text
          </Button>
        </div>
      </DialogContent>

      {/* Helper: browser can't attach the image automatically */}
      <Dialog open={!!waFallback} onOpenChange={(o) => !o && setWaFallback(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4 text-blue-700" /> Bill image ready
            </DialogTitle>
            <DialogDescription asChild>
              <ol className="list-decimal space-y-1.5 pl-4 pt-1 text-left text-xs">
                <li>
                  Image <b>{waFallback?.fileName}</b> was saved to your downloads / gallery.
                </li>
                <li>
                  Tap <b>Open WhatsApp chat</b> — the customer chat opens.
                </li>
                <li>
                  In WhatsApp tap the <b>attach 📎</b> button, pick the bill image, and send it.
                </li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          {waFallback && (
            <div className="rounded-lg border bg-neutral-100 p-2">
              <img src={waFallback.url} alt="Bill slip preview" className="mx-auto max-h-56 rounded shadow" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setWaFallback(null)} className="h-11">
              Close
            </Button>
            <Button onClick={openWaChat} className="h-11 bg-[#25D366] hover:bg-[#1eb857] text-white">
              <MessageCircle className="size-4" /> Open WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Off-screen capture target (never visible) */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, opacity: 1, pointerEvents: 'none', zIndex: -1 }}>
        <div ref={captureRef}>
          {mode === 'invoice' ? (
            <InvoiceDoc invoice={invoice} settings={settings} />
          ) : mode === 'driver' ? (
            <DriverSlip invoice={invoice} settings={settings} />
          ) : (
            <ThermalSlip invoice={invoice} settings={settings} />
          )}
        </div>
      </div>
    </Dialog>
  );
}
