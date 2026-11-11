'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplatePicker, type TemplateSendValues } from './template-picker';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ContactOption {
  id: string;
  name: string | null;
  phone: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: (conversationId: string) => void;
}

export function NewMessageDialog({
  open,
  onOpenChange,
  onSent,
}: NewMessageDialogProps) {
  const t = useTranslations('Inbox.newMessage');
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    null
  );
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const fetchContacts = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from('contacts')
        .select('id, name, phone')
        .order('created_at', { ascending: false })
        .limit(50);

      const term = search.trim();
      if (term) {
        const pattern = `%${term}%`;
        query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        console.error('Failed to load contacts for new message:', error);
        toast.error(t('loadFailed'));
        setContacts([]);
      } else {
        setContacts((data ?? []) as ContactOption[]);
      }
      setLoading(false);
    };

    void fetchContacts();
    return () => {
      cancelled = true;
    };
  }, [open, search, t]);

  function chooseContact(contact: ContactOption) {
    setSelectedContact(contact);
    onOpenChange(false);
    setTemplatePickerOpen(true);
  }

  function handleTemplatePickerOpenChange(next: boolean) {
    setTemplatePickerOpen(next);
    if (!next) setSelectedContact(null);
  }

  async function handleSendTemplate(
    template: MessageTemplate,
    values: TemplateSendValues
  ) {
    const contact = selectedContact;
    if (!contact || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contact.id,
          message_type: 'template',
          template_name: template.name,
          template_language: template.language,
          template_message_params: {
            body: values.body,
            headerText: values.headerText,
            buttonParams: values.buttonParams,
          },
          template_params: values.body,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const reason = payload?.error || `HTTP ${response.status}`;
        toast.error(t('sendFailed', { reason }));
        return;
      }

      if (typeof payload?.conversation_id !== 'string') {
        throw new Error('The send response did not include a conversation ID');
      }

      toast.success(t('sent'));
      onSent(payload.conversation_id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const reason = error instanceof Error ? error.message : 'network error';
      toast.error(t('sendFailed', { reason }));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-xs">{t('consentNotice')}</p>
          <div className="space-y-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="border-border bg-muted pl-9"
              />
            </div>
            <ScrollArea className="border-border h-72 rounded-md border">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                  {t('noContacts')}
                </p>
              ) : (
                <div className="flex flex-col p-1">
                  {contacts.map((contact) => (
                    <Button
                      key={contact.id}
                      type="button"
                      variant="ghost"
                      className="h-auto justify-start px-3 py-2 text-left"
                      onClick={() => chooseContact(contact)}
                      disabled={sending}
                    >
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="max-w-full truncate font-medium">
                          {contact.name || contact.phone}
                        </span>
                        {contact.name && (
                          <span className="text-muted-foreground text-xs">
                            {contact.phone}
                          </span>
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={handleTemplatePickerOpenChange}
        onSelect={handleSendTemplate}
      />
    </>
  );
}
