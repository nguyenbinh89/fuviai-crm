'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { TeamMember, UserRole, UserStatus } from '@/hooks/useTeam';
import { RoleBadge, StatusDot } from './RoleBadge';

const ROLES: UserRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

interface MemberRowProps {
  member: TeamMember;
  currentUserId: string;
  currentUserRole: UserRole;
  onRoleChange: (id: string, role: UserRole) => void;
  onStatusChange: (id: string, status: UserStatus) => void;
  onRemove: (id: string) => void;
}

export function MemberRow({
  member,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onStatusChange,
  onRemove,
}: MemberRowProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const isMe = member.id === currentUserId;
  const canManage = !isMe && currentUserRole === 'OWNER' && member.role !== 'OWNER'
    || !isMe && currentUserRole === 'ADMIN' && !['OWNER', 'ADMIN'].includes(member.role);
  const initials = `${member.firstName[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {member.firstName} {member.lastName}
              {isMe && <span className="ml-1.5 text-xs text-gray-400">(Tôi)</span>}
            </p>
            <p className="text-xs text-gray-500">{member.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        {canManage && currentUserRole === 'OWNER' ? (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1 hover:opacity-80"
            >
              <RoleBadge role={member.role} />
              <span className="text-gray-400 text-xs">▾</span>
            </button>
            {showRoleMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32 overflow-hidden">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { onRoleChange(member.id, r); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                      member.role === r ? 'font-semibold text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <RoleBadge role={member.role} />
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusDot status={member.status} />
      </td>

      {/* Last login */}
      <td className="px-4 py-3 text-xs text-gray-400">
        {member.lastLoginAt
          ? formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true, locale: vi })
          : 'Chưa đăng nhập'}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {canManage && (
          <div className="flex items-center justify-end gap-1">
            {member.status === 'ACTIVE' ? (
              <button
                onClick={() => onStatusChange(member.id, 'INACTIVE')}
                className="text-xs text-gray-500 hover:text-yellow-600 px-2 py-1 rounded hover:bg-yellow-50"
              >
                Tạm dừng
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(member.id, 'ACTIVE')}
                className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
              >
                Kích hoạt
              </button>
            )}
            <button
              onClick={() => onRemove(member.id)}
              className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Xóa
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
