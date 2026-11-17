'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/hooks/use-app-lang';
import { apiStaffList, apiStaffCreate, apiStaffDelete, apiStaffResets, type StaffRow, type ResetRow } from '@/lib/cloud';
import { KeyRound, Plus, ShieldAlert, Trash2, UserRound } from 'lucide-react';

/**
 * OWNER → Settings → Staff (v39). Manage who can sign in: create staff
 * logins, remove them, and review every "Forgot password" reset with the
 * identity photo the staff member captured.
 */
export default function StaffSection() {
  const t = useT();
  const { toast } = useToast();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [resets, setResets] = useState<ResetRow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [list, logs] = await Promise.all([apiStaffList(), apiStaffResets()]);
    if (list.ok && list.staff) setRows(list.staff);
    if (logs.ok && logs.resets) setResets(logs.resets);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const create = async () => {
    if (busy || !name.trim() || !userId.trim() || password.length < 3) return;
    setBusy(true);
    const res = await apiStaffCreate({ name: name.trim(), userId: userId.trim(), password, mpin: mpin.trim() || undefined });
    setBusy(false);
    if (!res.ok) {
      toast({ title: res.error === 'exists' ? t('settings.staffUserId') + ': ' + userId.toUpperCase() : t('net.saveFailed'), variant: 'destructive' });
      return;
    }
    toast({ title: `${name.trim()} · ${userId.toUpperCase()}` });
    setName('');
    setUserId('');
    setPassword('');
    setMpin('');
    setOpen(false);
    void load();
  };

  const remove = async (id: string) => {
    const res = await apiStaffDelete(id);
    if (res.ok) {
      void load();
      toast({ title: t('settings.staffDelete') });
    }
  };

  return (
    <section data-settings-staff className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
            <UserRound className="size-4 text-blue-700" />
            {t('settings.staff')}
          </h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t('settings.staffDesc')}</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" aria-label="Add staff">
          <Plus className="size-3.5" />
          {t('settings.staffAdd')}
        </Button>
      </div>

      {open && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="st-name" className="text-[11px] text-muted-foreground">{t('settings.staffName')}</Label>
              <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Staff full name" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="st-uid" className="text-[11px] text-muted-foreground">{t('settings.staffUserId')}</Label>
              <Input id="st-uid" value={userId} onChange={(e) => setUserId(e.target.value)} aria-label="Staff ID" className="h-9 text-sm uppercase" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="st-pass" className="text-[11px] text-muted-foreground">{t('settings.staffPassword')}</Label>
              <Input id="st-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Starting password" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="st-mpin" className="text-[11px] text-muted-foreground">{t('settings.staffMpin')}</Label>
              <Input id="st-mpin" inputMode="numeric" value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 8))} aria-label="Staff MPIN optional" className="h-9 text-sm" />
            </div>
          </div>
          <Button onClick={() => void create()} disabled={busy || !name.trim() || !userId.trim() || password.length < 3} className="h-9 w-full gap-1.5 bg-blue-600 text-sm text-white hover:bg-blue-700" aria-label="Create staff login">
            <Plus className="size-3.5" />
            {t('settings.staffCreate')}
          </Button>
        </div>
      )}

      {/* staff list */}
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.id} data-staff-row className="flex items-center gap-3 rounded-xl border bg-card p-3">
            {s.photoData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photoData} alt={`Photo of ${s.name}`} className="size-10 shrink-0 rounded-full object-cover ring-1 ring-neutral-200" />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-300">
                <UserRound className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-800">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('settings.staffUserId')}: <span className="font-bold tracking-wide">{s.userId}</span>
                {!s.active && ' · inactive'}
                {s.mustChangePassword && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{t('settings.staffMustChange')}</span>}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="size-8 shrink-0 text-destructive hover:text-destructive" aria-label={`Remove ${s.userId}`}>
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-xs">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm">{t('settings.staffDelete')}</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">{t('settings.staffDeleteDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void remove(s.id)} className="bg-destructive text-white hover:bg-destructive/90">
                    {t('settings.staffDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {/* forgot-password audit trail */}
      <Separator />
      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
          <ShieldAlert className="size-3.5 text-amber-600" />
          {t('settings.staffResets')}
        </h4>
        {resets.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">{t('settings.staffNoResets')}</p>
        ) : (
          resets.map((r) => (
            <div key={r.id} data-reset-row className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
              {r.photoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoData} alt={`Identity photo of ${r.name}`} className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-500">
                  <KeyRound className="size-5" />
                </div>
              )}
              <div className="min-w-0 text-[11px]">
                <p className="truncate font-bold text-neutral-800">{r.name} · {r.userId}</p>
                <p className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
