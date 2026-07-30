import {apiClient} from '../utils/api';
import {ApiResponse, PartnerInvites, SendPartnerInviteResult, User} from '../types';

/**
 * Fluxo de vínculo de parceiro com consentimento: convidar, aceitar/recusar,
 * cancelar e desvincular. O vínculo só acontece quando o convidado aceita
 * (ou quando os dois se convidam mutuamente).
 */
export const partnerService = {
  async sendInvite(partnerEmail: string): Promise<ApiResponse<SendPartnerInviteResult>> {
    return await apiClient.post<SendPartnerInviteResult>('/partner/invite', {partnerEmail});
  },

  async getInvites(): Promise<ApiResponse<PartnerInvites>> {
    return await apiClient.get<PartnerInvites>('/partner/invites');
  },

  async acceptInvite(inviteId: string): Promise<ApiResponse<User>> {
    return await apiClient.post<User>(`/partner/invites/${inviteId}/accept`);
  },

  async declineInvite(inviteId: string): Promise<ApiResponse<{message: string}>> {
    return await apiClient.post<{message: string}>(`/partner/invites/${inviteId}/decline`);
  },

  async cancelInvite(inviteId: string): Promise<ApiResponse<{message: string}>> {
    return await apiClient.post<{message: string}>(`/partner/invites/${inviteId}/cancel`);
  },

  async unlink(): Promise<ApiResponse<User>> {
    return await apiClient.post<User>('/partner/unlink');
  },
};
