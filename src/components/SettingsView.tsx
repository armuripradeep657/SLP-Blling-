'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '@/lib/defaultData';
import { normalizePhone } from '@/lib/billing';
import InstallAppSection from '@/components/InstallAppSection';

export default function SettingsView() {
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const { toast } = useToast();

  const set = (patch: Partial<typeof settings>) => saveSettings(patch);

  return (
    <div className="space-y-5">
      <section aria-label="Business identity" className="space-y-3">
        <h3 className="text-sm font-bold text-blue-800">Business Identity</h3>
        <Field label="Company name" value={settings.companyName} onChange={(v) => set({ companyName: v })} textarea />
        <Field
          label="Company name in Telugu (బిల్లు పేరు — తెలుగు)"
          value={settings.companyNameTe ?? ''}
          onChange={(v) => set({ companyNameTe: v })}
          textarea
          placeholder="శ్రీ లక్ష్మీ పెంచిల నరసింహ స్వామి సిమెంట్ వర్క్స్"
        />
        <Field label="Owner / Proprietor name" value={settings.ownerName} onChange={(v) => set({ ownerName: v })} placeholder="A. Prasad" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Phone" value={settings.phone} onChange={(v) => set({ phone: v })} type="tel" placeholder="98765 43210" />
          <Field label="WhatsApp number" value={settings.whatsappNumber} onChange={(v) => set({ whatsappNumber: v })} type="tel" placeholder="Used on bills" />
        </div>
        <Field label="Shop address" value={settings.address} onChange={(v) => set({ address: v })} textarea placeholder="Main Road, Village, District" />
        <Field label="UPI ID (for balance QR)" value={settings.upiId} onChange={(v) => set({ upiId: v })} placeholder="name@upi" />
      </section>

      <Separator />

      <section aria-label="Billing preferences" className="space-y-3">
        <h3 className="text-sm font-bold text-blue-800">Billing & Slip</h3>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Invoice prefix" value={settings.invoicePrefix} onChange={(v) => set({ invoicePrefix: v })} placeholder="SLP-INV-" />
          <Field
            label="Next invoice no."
            value={String(settings.nextInvoiceNo)}
            onChange={(v) => set({ nextInvoiceNo: Math.max(1, Number(v.replace(/\D/g, '')) || 1) })}
            type="number"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Thermal slip width</Label>
          <div className="flex gap-2">
            {([58, 80] as const).map((mm) => (
              <button
                key={mm}
                onClick={() => set({ slipWidthMm: mm })}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                  settings.slipWidthMm === mm ? 'border-blue-600 bg-blue-600 text-white' : 'bg-card hover:bg-accent'
                }`}
              >
                {mm} mm {mm === 58 ? '(small)' : '(standard)'}
              </button>
            ))}
          </div>
        </div>
        <Field label="Thank-you note" value={settings.thankYouNote} onChange={(v) => set({ thankYouNote: v })} />
        <Field label="Terms / return policy" value={settings.returnPolicy} onChange={(v) => set({ returnPolicy: v })} />
      </section>

      <Separator />

      <InstallAppSection />

      <Separator />

      <section aria-label="Data management" className="space-y-2">
        <h3 className="text-sm font-bold text-blue-800">Data</h3>
        <p className="text-xs text-muted-foreground">
          All data (products, bills, settings) is stored on this device only — the app works fully offline.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              Reset products to factory catalog
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset catalog?</AlertDialogTitle>
              <AlertDialogDescription>
                Your custom products will be replaced with the default cement product list. Bills & settings are kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  saveSettings(DEFAULT_SETTINGS);
                  useStore.setState({ products: DEFAULT_PRODUCTS });
                  toast({ title: 'Catalog reset to defaults' });
                }}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              Erase all data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle>Erase everything?</AlertDialogTitle>
              <AlertDialogDescription>
                All products, invoices and settings on this device will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  localStorage.removeItem('slp-cement-billing-v1');
                  location.reload();
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Erase
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  const isPhone = type === 'tel';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      ) : (
        <Input
          type={type}
          inputMode={isPhone ? 'numeric' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={isPhone ? (e) => onChange(normalizePhone(e.target.value)) : undefined}
          placeholder={placeholder}
          className="h-11"
        />
      )}
    </div>
  );
}
