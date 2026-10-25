'use client';

import { useCallback, useRef, useState } from 'react';
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
  QrCode,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import ThermalSlip from './ThermalSlip';
import { useStore } from '@/lib/store';
import { captureSlipPng, downloadBlob, printImage, slipFileName } from '@/lib/invoiceImage';
import { normalizePhone, smsLink, waLink } from '@/lib/billing';
import { smsMessage, whatsappCaption, whatsappMessage } from '@/lib/messages';
import type { Invoice } from '@/lib/types';

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceModal({ invoice, open, onOpenChange }: Props) {
  const settings = useStore((s) => s.settings);
  const { toast } = useToast();
  const slipRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Off-screen render node used for html-to-image capture
  const captureRef = useRef<HTMLDivElement | null>(null);

  // Helper dialog state for browsers that cannot attach files to a share
  const [waFallback, setWaFallback] = useState<{ url: string; fileName: string } | null>(null);

  const getCaptureTarget = useCallback((): HTMLElement | null => {
    return captureRef.current ?? slipRef.current;
  }, []);

  if (!invoice) return null;

  const waCaption = whatsappCaption(invoice, settings);
  const waMsg = whatsappMessage(invoice, settings);
  const smsMsg = smsMessage(invoice, settings);
  const fileName = slipFileName(invoice.no);

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

  const onShare = () =>
    guard('share', async () => {
      const blob = await capture();
      const file = new File([blob], fileName, { type: 'image/png' });
      // Direct native share WITH the image attached (WhatsApp, SMS, etc.)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: waCaption,
          title: `Bill ${invoice.no}`,
        });
        return;
      }
      // Fallback: download + open WhatsApp chat, guide the user to attach
      downloadBlob(blob, fileName);
      setWaFallback({ url: URL.createObjectURL(blob), fileName });
    });

  /**
   * DIRECT send: opens the customer's own WhatsApp chat using the number typed
   * in the bill — click-to-chat works even when the customer is brand new and
   * not saved in contacts. The slip image is put on the clipboard AND saved to
   * the gallery so attaching is a 2-tap job.
   */
  const onWhatsAppDirect = () =>
    guard('wa', async () => {
      const blob = await capture();

      // 1) Put the bill image on the clipboard — paste straight into the chat
      let copied = false;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copied = true;
      } catch {
        /* clipboard blocked — gallery copy below still works */
      }

      // 2) Save to gallery — reliable attach fallback on every phone
      downloadBlob(blob, fileName);

      // 3) Open the customer's chat DIRECTLY with the bill text pre-filled
      window.open(waLink(invoice.customer.phone, waMsg), '_blank');

      toast({
        title: `Chat opened for ${invoice.customer.name || normalizePhone(invoice.customer.phone)}`,
        description: copied
          ? 'Bill image copied — long-press the WhatsApp message box, Paste, and Send. (Image also saved to gallery.)'
          : `Bill image ${fileName} saved to gallery — tap 📎 in the chat, attach it, and Send.`,
      });
    });

  /** Share-sheet send (used when no customer number is on the bill) */
  const onWhatsApp = () =>
    guard('wa', async () => {
      const blob = await capture();
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
      }
      // 2nd choice: save the image + show step-by-step helper with preview
      downloadBlob(blob, fileName);
      setWaFallback({ url: URL.createObjectURL(blob), fileName });
    });

  const openWaChat = () => {
    window.open(waLink(invoice.customer.phone, waMsg), '_blank');
    setWaFallback(null);
  };

  const onSMS = () =>
    guard('sms', () => {
      window.location.href = smsLink(invoice.customer.phone, smsMsg);
      toast({ title: 'Opening SMS app…', description: 'SMS carries text — the bill image can be MMS-attached by your messaging app.' });
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
            Bill Generated — {invoice.no}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Thermal-slip <b>image</b> — WhatsApp sends this picture, not text. Paid bills carry a <b>PAID</b> stamp; balance bills carry the <b>UPI QR</b>.
          </DialogDescription>
          {invoice.totals.balance > 0 && !settings.upiId && (
            <div className="mt-1 flex items-start gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-2 text-[11px] leading-snug text-blue-900">
              <QrCode className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Balance is due — add your <b>UPI ID</b> in <b>Settings</b> and the bill image gets a scan-to-pay QR for the balance.
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <div className="mx-4 rounded-lg border bg-neutral-100">
            <div className="flex justify-center py-4">
              <div className="shadow-md bg-white">
                <ThermalSlip invoice={invoice} settings={settings} rootRef={(n) => (slipRef.current = n)} />
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
          <ThermalSlip invoice={invoice} settings={settings} />
        </div>
      </div>
    </Dialog>
  );
}
