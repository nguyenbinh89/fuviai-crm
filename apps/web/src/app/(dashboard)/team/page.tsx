'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useTeamStats,
  useTeamMembers,
  usePendingInvitations,
  useUpdateMemberRole,
  useUpdateMemberStatus,
  useRemoveMember,
  useInviteMember,
  useRevokeInvitation,
} from '@/hooks/useTeam';
import type { UserRole, UserStatus } from '@/hooks/useTeam';
import { MemberRow } from '@/components/team/MemberRow';
import { RoleBadge } from '@/components/team/RoleBadge';
import { InviteDialog } from '@/components/team/InviteDialog';

// Giả lập lấy currentUser từ store — trong thực tế dùng useAuthStore
function useCurrentUser() {
  // TODO: lấy từ Zustand auth store
  return { id: '', role: 'OWNER' as UserRole };
}

export default function TeamPage() {
  const [tab, setTab] = useState<'members' | 'invitations'>('members');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | undefined>();

  const currentUser = useCurrentUser();
  const { data: stats } = useTeamStats();
  const { data: members = [], isLoading: loadingMembers } = useTeamMembers();
  const { data: invitations = [], isLoading: loadingInvitations } = usePendingInvitations();

  const { mutate: updateRole } = useUpdateMemberRole();
  const { mutate: updateStatus } = useUpdateMemberStatus();
  const { mutate: removeMember } = useRemoveMember();
  const { mutate: inviteMember, isPending: inviting } = useInviteMember();
  const { mutate: revokeInvitation } = useRevokeInvitation();

  const handleRemove = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;
    removeMember(id);
  };

  const handleInvite = (data: { email: string; role: UserRole }) => {
    inviteMember(data, {
      onSuccess: (res) => setInviteResult(res.acceptUrl),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thành viên và phân quyền trong tổ chức</p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteResult(undefined); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Mời thành viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng thành viên', value: stats?.total ?? 0, color: 'text-gray-800' },
          { label: 'Admin', value: stats?.byRole?.ADMIN ?? 0, color: 'text-blue-600' },
          { label: 'Member', value: stats?.byRole?.MEMBER ?? 0, color: 'text-gray-600' },
          { label: 'Đang hoạt động', value: stats?.byStatus?.ACTIVE ?? 0, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('members')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thành viên ({members.length})
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'invitations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lời mời đang chờ ({invitations.length})
        </button>
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingMembers ? (
            <div className="p-8 text-center text-gray-400">Đang tải...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Chưa có thành viên nào</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành viên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đăng nhập lần cuối</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserId={currentUser.id}
                    currentUserRole={currentUser.role}
                    onRoleChange={(id, role) => updateRole({ id, role })}
                    onStatusChange={(id, status) => updateStatus({ id, status })}
                    onRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invitations tab */}
      {tab === 'invitations' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingInvitations ? (
            <div className="p-8 text-center text-gray-400">Đang tải...</div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-3xl mb-2">📨</p>
              <p className="text-sm text-gray-500">Không có lời mời nào đang chờ</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mời bởi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hết hạn</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{inv.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={inv.role} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.invitedBy.firstName} {inv.invitedBy.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true, locale: vi })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => revokeInvitation(inv.id)}
                        className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Thu hồi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Role legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-600 mb-3">Phân quyền theo Role</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { role: 'OWNER' as UserRole, desc: 'Toàn quyền, bao gồm billing và xóa org' },
            { role: 'ADMIN' as UserRole, desc: 'Quản lý data + team (trừ Owner settings)' },
            { role: 'MEMBER' as UserRole, desc: 'Tạo/sửa contacts, deals, activities' },
            { role: 'VIEWER' as UserRole, desc: 'Chỉ xem, không chỉnh sửa' },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-white border border-gray-100 rounded-lg p-3">
              <RoleBadge role={role} />
              <p className="text-xs text-gray-500 mt-1.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite dialog */}
      {showInvite && (
        <InviteDialog
          onClose={() => { setShowInvite(false); setInviteResult(undefined); }}
          onSubmit={handleInvite}
          isPending={inviting}
          acceptUrl={inviteResult}
        />
      )}
    </div>
  );
}
