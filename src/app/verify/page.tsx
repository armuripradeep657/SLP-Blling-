import type { Metadata } from 'next';
import VerifyPublicClient from './verify-client';

export const metadata: Metadata = {
  title: 'Verify a bill — SLP Cement Works',
  description:
    'Public Code 128 barcode verification for SLP Cement Works bills — scan or type the verification number printed on the bill.',
};

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
  return <VerifyPublicClient />;
}
