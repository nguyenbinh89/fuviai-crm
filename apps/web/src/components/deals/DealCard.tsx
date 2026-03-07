'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Deal } from '@/hooks/useDeals';
import { DealStatusBadge } from './DealStatusBadge';
import { useDealsStore } from '@/store/deals.store';

// Định dạng tiền tệ VND
function formatCurrency(value: number | null, currency: string): string {
  if (value === null) return '—';
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
}

export function DealCard({ deal, onEdit }: DealCardProps) {
  const setDraggingDeal = useDealsStore((s) => s.setDraggingDeal);

  const contactName = deal.contact
    ? [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(' ')
    : null;

  // Kiểm tra expected close date
  const isOverdue =
    deal.expectedCloseDate && deal.status === 'OPEN' && isPast(new Date(deal.expectedCloseDate));
  const isDueSoon =
    deal.expectedCloseDate &&
    deal.status === 'OPEN' &&
    !isOverdue &&
    isWithinInterval(new Date(deal.expectedCloseDate), {
      start: new Date(),
      end: addDays(new Date(), 7),
    });

  return (
    <div
      draggable
      onDragStart={() => setDraggingDeal(deal.id)}
      onDragEnd={() => setDraggingDeal(null)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
    >
      {/* Title + link */}
      <Link href={`/deals/${deal.id}`} className="block">
        <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-1.5">
          {deal.title}
        </h4>
      </Link>

      {/* Value */}
      {deal.value !== null && (
        <p className="text-sm font-semibold text-gray-700 mb-1.5">
          {formatCurrency(deal.value, deal.currency)}
        </p>
      )}

      {/* Contact */}
      {contactName && (
        <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
          <span>👤</span> {contactName}
        </p>
      )}

      {/* Expected close date */}
      {deal.expectedCloseDate && (
        <p
          className={`text-xs mb-1.5 flex items-center gap-1 ${
            isOverdue
              ? 'text-red-600 font-medium'
              : isDueSoon
              ? 'text-amber-600'
              : 'text-gray-500'
          }`}
        >
          <span>{isOverdue ? '⚠️' : '📅'}</span>
          {format(new Date(deal.expectedCloseDate), 'dd/MM/yyyy', { locale: vi })}
          {isOverdue && ' (Quá hạn)'}
        </p>
      )}

      {/* Footer: status + edit */}
      <div className="flex items-center justify-between mt-2">
        <DealStatusBadge status={deal.status} />
        {onEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit(deal);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  );
}
