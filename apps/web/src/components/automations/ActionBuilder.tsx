'use client';

import { useState } from 'react';
import type { WorkflowAction, ActionType } from '@/hooks/useAutomations';
import { ACTION_CONFIG } from './ActionLabel';

const ACTION_TYPES: ActionType[] = [
  'SEND_EMAIL', 'SEND_ZALO', 'CREATE_ACTIVITY',
  'UPDATE_CONTACT_STATUS', 'UPDATE_DEAL_STAGE',
  'ASSIGN_TO_USER', 'ADD_TAG', 'SEND_WEBHOOK', 'WAIT',
];

interface ActionBuilderProps {
  actions: WorkflowAction[];
  onChange: (actions: WorkflowAction[]) => void;
}

export function ActionBuilder({ actions, onChange }: ActionBuilderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addAction = (type: ActionType) => {
    const newAction: WorkflowAction = {
      type,
      order: actions.length + 1,
      config: getDefaultConfig(type),
    };
    onChange([...actions, newAction]);
    setShowAddMenu(false);
  };

  const removeAction = (index: number) => {
    const updated = actions.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i + 1 }));
    onChange(updated);
  };

  const updateConfig = (index: number, key: string, value: string) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {actions.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          Chưa có hành động nào. Thêm hành động bên dưới.
        </p>
      )}

      {actions.map((action, index) => {
        const cfg = ACTION_CONFIG[action.type];
        return (
          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                {index + 1}. {cfg.icon} {cfg.label}
              </span>
              <button onClick={() => removeAction(index)} className="text-red-400 hover:text-red-600 text-xs">
                ✕ Xóa
              </button>
            </div>

            {/* Config fields per action type */}
            <ActionConfigFields
              action={action}
              onChange={(key, val) => updateConfig(index, key, val)}
            />
          </div>
        );
      })}

      {/* Add action button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg py-2 hover:bg-blue-50 transition-colors"
        >
          + Thêm hành động
        </button>

        {showAddMenu && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {ACTION_TYPES.map((type) => {
              const cfg = ACTION_CONFIG[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addAction(type)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionConfigFields({
  action,
  onChange,
}: {
  action: WorkflowAction;
  onChange: (key: string, value: string) => void;
}) {
  const inputClass =
    'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

  switch (action.type) {
    case 'SEND_EMAIL':
      return (
        <input
          placeholder="Template ID"
          value={action.config.templateId ?? ''}
          onChange={(e) => onChange('templateId', e.target.value)}
          className={inputClass}
        />
      );

    case 'SEND_ZALO':
      return (
        <textarea
          placeholder="Nội dung tin nhắn Zalo"
          value={action.config.message ?? ''}
          onChange={(e) => onChange('message', e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      );

    case 'CREATE_ACTIVITY':
      return (
        <div className="space-y-1.5">
          <select
            value={action.config.activityType ?? 'TASK'}
            onChange={(e) => onChange('activityType', e.target.value)}
            className={inputClass}
          >
            <option value="CALL">📞 Gọi điện</option>
            <option value="EMAIL">✉️ Email</option>
            <option value="MEETING">🤝 Họp</option>
            <option value="TASK">✅ Task</option>
          </select>
          <input
            placeholder="Tiêu đề activity"
            value={action.config.subject ?? ''}
            onChange={(e) => onChange('subject', e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Hạn chót sau N ngày"
            value={action.config.dueInDays ?? ''}
            onChange={(e) => onChange('dueInDays', e.target.value)}
            className={inputClass}
          />
        </div>
      );

    case 'UPDATE_CONTACT_STATUS':
      return (
        <select
          value={action.config.contactStatus ?? 'LEAD'}
          onChange={(e) => onChange('contactStatus', e.target.value)}
          className={inputClass}
        >
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="CUSTOMER">Customer</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      );

    case 'UPDATE_DEAL_STAGE':
      return (
        <input
          placeholder="Stage ID"
          value={action.config.stageId ?? ''}
          onChange={(e) => onChange('stageId', e.target.value)}
          className={inputClass}
        />
      );

    case 'ASSIGN_TO_USER':
      return (
        <input
          placeholder="User ID nhân viên"
          value={action.config.userId ?? ''}
          onChange={(e) => onChange('userId', e.target.value)}
          className={`${inputClass} font-mono`}
        />
      );

    case 'ADD_TAG':
      return (
        <input
          placeholder="Tag ID"
          value={action.config.tagId ?? ''}
          onChange={(e) => onChange('tagId', e.target.value)}
          className={`${inputClass} font-mono`}
        />
      );

    case 'SEND_WEBHOOK':
      return (
        <div className="space-y-1.5">
          <select
            value={action.config.method ?? 'POST'}
            onChange={(e) => onChange('method', e.target.value)}
            className={inputClass}
          >
            <option>POST</option>
            <option>GET</option>
            <option>PUT</option>
          </select>
          <input
            placeholder="URL Webhook (https://...)"
            value={action.config.url ?? ''}
            onChange={(e) => onChange('url', e.target.value)}
            className={inputClass}
          />
        </div>
      );

    case 'WAIT':
      return (
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Ngày"
            value={action.config.waitDays ?? ''}
            onChange={(e) => onChange('waitDays', e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            type="number"
            min="0"
            max="23"
            placeholder="Giờ"
            value={action.config.waitHours ?? ''}
            onChange={(e) => onChange('waitHours', e.target.value)}
            className={`${inputClass} flex-1`}
          />
        </div>
      );

    default:
      return null;
  }
}

function getDefaultConfig(type: ActionType): Record<string, any> {
  switch (type) {
    case 'SEND_EMAIL': return { templateId: '' };
    case 'SEND_ZALO': return { message: '' };
    case 'CREATE_ACTIVITY': return { activityType: 'TASK', subject: '', dueInDays: 1 };
    case 'UPDATE_CONTACT_STATUS': return { contactStatus: 'PROSPECT' };
    case 'UPDATE_DEAL_STAGE': return { stageId: '' };
    case 'ASSIGN_TO_USER': return { userId: '' };
    case 'ADD_TAG': return { tagId: '' };
    case 'SEND_WEBHOOK': return { url: '', method: 'POST' };
    case 'WAIT': return { waitDays: 1, waitHours: 0 };
    default: return {};
  }
}
