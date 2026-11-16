'use client';

import VerifyView from '@/components/VerifyView';

/**
 * PUBLIC barcode verification page — no login, no MPIN gate.
 *
 * Anyone who scans a bill's Code 128 barcode (or types its verification
 * number) lands here. The barcode carries nothing but the verification ID;
 * every detail shown comes from the server's VerifiedBill registry, and
 * private customer data (phone/address) is never stored there in the first
 * place — so nothing private can leak on this page.
 */
export default function PublicVerifyPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 via-white to-blue-100 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/narasimha-logo.jpg" alt="Company logo" className="size-16 rounded-full object-cover shadow-md ring-2 ring-white" />
          <h1 className="text-lg font-extrabold text-blue-900">SLP Cement Works</h1>
          <p className="text-xs font-semibold text-muted-foreground">Bill verification — Code 128</p>
        </div>

        <VerifyView autoFocus={false} />

        <p className="pb-6 text-center text-[10px] leading-relaxed text-muted-foreground">
          Scan the Code 128 barcode on any SLP bill, or type its verification number. Verification always
          reflects the live database record — a cancelled bill stops verifying immediately.
        </p>
      </div>
    </div>
  );
}
