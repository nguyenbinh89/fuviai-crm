'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmailWriter } from '@/hooks/useAI';
import type { EmailDraftResult } from '@/hooks/useAI';

const schema = z.object({
  purpose: z.string().min(1, 'Vui lòng nhập mục đích').max(200),
  contactName: z.string().min(1, 'Vui lòng nhập tên người nhận'),
  contactCompany: z.string().optional(),
  contactPosition: z.string().optional(),
  dealTitle: z.string().optional(),
  additionalContext: z.string().max(500).optional(),
  tone: z.enum(['formal', 'friendly', 'urgent']),
});

type FormValues = z.infer<typeof schema>;

interface EmailWriterDialogProps {
  // Context từ contact/deal page
  defaultContactName?: string;
  defaultContactCompany?: string;
  defaultContactPosition?: string;
  defaultDealTitle?: string;
  trigger?: React.ReactNode;
}

export function EmailWriterDialog({
  defaultContactName = '',
  defaultContactCompany = '',
  defaultContactPosition = '',
  defaultDealTitle = '',
  trigger,
}: EmailWriterDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EmailDraftResult | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: writeEmail, isPending } = useEmailWriter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purpose: 'chào hàng',
      contactName: defaultContactName,
      contactCompany: defaultContactCompany,
      contactPosition: defaultContactPosition,
      dealTitle: defaultDealTitle,
      tone: 'formal',
    },
  });

  const onSubmit = (values: FormValues) => {
    setDraft(null);
    writeEmail(
      {
        ...values,
        contactCompany: values.contactCompany || undefined,
        contactPosition: values.contactPosition || undefined,
        dealTitle: values.dealTitle || undefined,
        additionalContext: values.additionalContext || undefined,
      },
      { onSuccess: setDraft },
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
        >
          ✉️ Soạn email AI
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>✉️</span> AI Email Writer
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Mục đích + Tone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mục đích <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('purpose')}
                      placeholder="VD: chào hàng, follow-up, cảm ơn"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giọng văn</label>
                    <select
                      {...register('tone')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="formal">Lịch sự, chuyên nghiệp</option>
                      <option value="friendly">Thân thiện, gần gũi</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                {/* Người nhận */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('contactName')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
                    <input
                      {...register('contactCompany')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                    <input
                      {...register('contactPosition')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal liên quan</label>
                    <input
                      {...register('dealTitle')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin bổ sung</label>
                  <textarea
                    {...register('additionalContext')}
                    rows={2}
                    placeholder="VD: Khách đã xem demo lần trước, quan tâm đến tính năng X..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin">⟳</span> Đang soạn email...
                    </>
                  ) : (
                    '✨ Soạn email với AI'
                  )}
                </button>
              </form>

              {/* Kết quả */}
              {draft && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">📧 Email được tạo</h3>
                    <button
                      onClick={() => handleCopy(`Tiêu đề: ${draft.subject}\n\n${draft.body}`)}
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
                    >
                      {copied ? '✓ Đã sao chép' : '📋 Sao chép'}
                    </button>
                  </div>

                  {/* Subject */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Tiêu đề</p>
                    <p className="text-sm font-medium text-gray-900">{draft.subject}</p>
                  </div>

                  {/* Body */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Nội dung</p>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {draft.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
