'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useT } from '@/hooks/use-app-lang';
import { useToast } from '@/hooks/use-toast';
import { fileToSmallDataUrl } from '@/lib/photo';
import { apiStaffSetPhoto, authRole } from '@/lib/cloud';
import { lockApp } from '@/lib/cloud';

/**
 * STAFF PROFILE (v39) — the staff member's own page: profile photo (captured
 * from the camera), name, Staff ID, password change and logout. The ONLY
 * personalisation a staff device has; everything else stays central.
 */
export default function StaffProfile() {
  const t = useT();
  const { toast } = useToast();
  const staff = useStore((s) => s.staff);
  const refreshStaff = useStore((s) => s.refreshStaff);
  const staffChangePassword = useStore((s) => s.staffChangePassword);

  const [newPass, setNewPass] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // session-only fallback: the store is hydrated before this view mounts
  useEffect(() => {
    if (!staff && authRole() === 'staff') void refreshStaff();
  }, [staff, refreshStaff]);

  if (!staff) {
    return <div className="py-16 text-center text-sm text-muted-foreground">{t('page.loading')}</div>;
  }

  const savePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToSmallDataUrl(file);
      const res = await apiStaffSetPhoto(dataUrl);
      if (res.ok) {
        await refreshStaff();
        toast({ title: t('staff.photoSaved') });
      }
    } catch {
      toast({ title: t('net.saveFailed'), variant: 'destructive' });
    }
  };

  const changePass = async () => {
    if (busy || newPass.length < 3) return;
    setBusy(true);
    try {
      await staffChangePassword({ current: currentPass || undefined, newPassword: newPass });
      toast({ title: t('staff.passOk') });
      setNewPass('');
      setCurrentPass('');
    } catch (e) {
      toast({
        title: e instanceof Error && e.message === 'unauthorized' ? t('staff.errWrong') : t('net.saveFailed'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    lockApp();
    useStore.setState({ staff: null });
    window.dispatchEvent(new Event('slp-lock'));
  };

  return (
    <div className="space-y-4">
      {/* identity card */}
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
        {staff.photoData ? (
          <img src={staff.photoData} alt="Profile photo" className="size-20 shrink-0 rounded-full object-cover ring-2 ring-blue-200" />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-300">
            <UserRound className="size-9" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-neutral-900">{staff.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            {t('staff.userIdLabel')}: <span className="font-bold tracking-wide text-neutral-700">{staff.userId}</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void savePhoto(e.target.files?.[0])}
            aria-label="Change profile photo"
          />
          <Button onClick={() => fileRef.current?.click()} variant="outline" size="sm" className="mt-2 h-8 gap-1.5 text-xs">
            <Camera className="size-3.5" />
            {t('staff.photoChange')}
          </Button>
        </div>
      </div>

      {/* password */}
      <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
          <KeyRound className="size-4 text-blue-700" />
          {t('staff.passTitle')}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="sp-current" className="text-xs text-muted-foreground">
            {t('staff.currentPass')}
          </Label>
          <Input
            id="sp-current"
            type="password"
            autoComplete="current-password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            aria-label="Current password"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-new" className="text-xs text-muted-foreground">
            {t('staff.newPass')}
          </Label>
          <Input
            id="sp-new"
            type="password"
            autoComplete="new-password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void changePass();
            }}
            aria-label="New password"
            className="h-11"
          />
        </div>
        <Button onClick={() => void changePass()} disabled={busy || newPass.length < 3} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700" aria-label="Save new password">
          <KeyRound className="size-4" />
          {busy ? t('lock.saving') : t('staff.savePass')}
        </Button>
      </div>

      <Button onClick={logout} variant="outline" className="h-11 w-full gap-2 text-sm font-bold" aria-label="Log out">
        <LogOut className="size-4" />
        {t('staff.logout')}
      </Button>
    </div>
  );
}
