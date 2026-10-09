'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { createRestockRequest } from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function RestockNotify({ articleId }: { articleId: string }) {
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) {
      toast.error('Indiquez un téléphone ou email');
      return;
    }
    setSending(true);
    try {
      await createRestockRequest(articleId, contact);
      setDone(true);
      toast.success('Vous serez notifié au réassort !');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return <p className="text-sm text-green-600 font-medium">Demande enregistrée — on vous préviendra !</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-orange-50 border border-orange-200 rounded-md p-4 space-y-2">
      <p className="text-sm font-medium flex items-center gap-2"><Bell size={16} /> Prévenez-moi quand c&apos;est de retour</p>
      <div className="flex gap-2">
        <input value={contact} onChange={(e) => setContact(e.target.value)}
          placeholder="Téléphone ou email" className="flex-1 border rounded-md px-3 py-2 text-sm" />
        <button type="submit" disabled={sending}
          className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-orange-600 disabled:opacity-50">
          {sending ? '...' : 'OK'}
        </button>
      </div>
    </form>
  );
}
