'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type Plan = 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PlanLimits {
  contacts: number;
  deals: number;
  users: number;
  workflows: number;
  campaigns: number;
  aiCredits: number;
}

export interface PlanDefinition {
  plan: Plan;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  features: string[];
}

export interface Subscription {
  plan: Plan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
}

export interface UsageStats {
  contacts: number;
  deals: number;
  users: number;
  workflows: number;
  campaigns: number;
}

export interface CurrentPlanData {
  subscription: Subscription;
  planDefinition: PlanDefinition;
  usage: UsageStats;
  limits: PlanLimits;
}

export interface BillingRecord {
  id: string;
  plan: Plan;
  billingCycle: BillingCycle;
  amount: number;
  status: PaymentStatus;
  description?: string;
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
}

// =====================
// HOOKS
// =====================

export function usePlans() {
  return useQuery<PlanDefinition[]>({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const res = await api.get('/billing/plans');
      return res.data.data;
    },
    staleTime: Infinity, // Plans không thay đổi thường xuyên
  });
}

export function useCurrentPlan() {
  return useQuery<CurrentPlanData>({
    queryKey: ['billing', 'current'],
    queryFn: async () => {
      const res = await api.get('/billing/current');
      return res.data.data;
    },
  });
}

export function useUsage() {
  return useQuery<{ plan: Plan; limits: PlanLimits; usage: UsageStats }>({
    queryKey: ['billing', 'usage'],
    queryFn: async () => {
      const res = await api.get('/billing/usage');
      return res.data.data;
    },
  });
}

export function useBillingHistory() {
  return useQuery<BillingRecord[]>({
    queryKey: ['billing', 'history'],
    queryFn: async () => {
      const res = await api.get('/billing/history');
      return res.data.data;
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plan: Plan; billingCycle: BillingCycle }) => {
      const res = await api.post('/billing/change-plan', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      await api.post('/billing/cancel', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
