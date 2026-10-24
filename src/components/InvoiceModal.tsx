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
} from 'lucide-react';
import ThermalSlip from './ThermalSlip';
import { useStore } from '@/lib/store';
import { captureSlipPng, downloadBlob, printImage, shareImage, slipFileName } from '@/lib/invoiceImage';
import { smsLink, waLink } from '@/lib/billing';
import { smsMessage, whatsappMessage } from '@/lib/messages';
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

  const getCaptureTarget = useCallback((): HTMLElement | null => {
    return captureRef.current ?? slipRef.current;
  }, []);

  if (!invoice) return null;

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

  const onShare = () =>
    guard('share', async () => {
      const node = getCaptureTarget();
      if (!node) throw new Error('Slip not ready');
      const blob = await captureSlipPng(node);
      const result = await shareImage(blob, fileName, `Bill ${invoice.no} - ${settings.companyName}`);
      if (result === 'unsupported') {
        downloadBlob(blob, fileName);
        toast({
          title: 'Bill image downloaded',
          description: 'Sharing not supported here — attach the downloaded image in any app.',
        });
      }
    });

  const onWhatsApp = () =>
    guard('wa', async () => {
      const node = getCaptureTarget();
      if (!node) throw new Error('Slip not ready');
      const blob = await captureSlipPng(node);
      const file = new File([blob], fileName, { type: 'image/png' });
      // Prefer native share sheet (lets user pick WhatsApp WITH the image attached)
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: waMsg,
            title: `Bill ${invoice.no}`,
          });
          return;
        }
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return;
      }
      // Fallback: download image + open WhatsApp chat with text
      downloadBlob(blob, fileName);
      window.open(waLink(invoice.customer.phone, waMsg), '_blank');
      toast({
        title: 'Bill image downloaded',
        description: 'Attach the downloaded image in the WhatsApp chat that just opened.',
        duration: 6000,
      });
    });

  const onSMS = () =>
    guard('sms', () => {
      window.location.href = smsLink(invoice.customer.phone, smsMsg);
      toast({ title: 'Opening SMS app…', description: 'Bill text ready to send (SMS supports text only).' });
    });

  const onDownload = () =>
    guard('dl', async () => {
      const node = getCaptureTarget();
      if (!node) throw new Error('Slip not ready');
      const blob = await captureSlipPng(node);
      downloadBlob(blob, fileName);
      toast({ title: 'Saved to downloads', description: fileName });
    });

  const onPrint = () =>
    guard('print', async () => {
      const node = getCaptureTarget();
      if (!node) throw new Error('Slip not ready');
      const blob = await captureSlipPng(node, 3);
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
            Thermal slip preview. Share as an image on WhatsApp/SMS with the UPI QR included.
          </DialogDescription>
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
          <Button
            onClick={onShare}
            disabled={busy !== null}
            className="w-full h-12 text-base font-semibold bg-amber-600 hover:bg-amber-700 text-white"
          >
            {busy === 'share' ? <Loader2 className="size-5 animate-spin" /> : <Share2 className="size-5" />}
            Share Bill Image
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onWhatsApp} disabled={busy !== null} variant="outline" className="h-11 border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800">
              {busy === 'wa' ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              WhatsApp
            </Button>
            <Button onClick={onSMS} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'sms' ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
              SMS
            </Button>
            <Button onClick={onDownload} disabled={busy !== null} variant="outline" className="h-11">
              {busy === 'dl' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download
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

      {/* Off-screen capture target (never visible) */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, opacity: 1, pointerEvents: 'none', zIndex: -1 }}>
        <div ref={captureRef}>
          <ThermalSlip invoice={invoice} settings={settings} />
        </div>
      </div>
    </Dialog>
  );
}
