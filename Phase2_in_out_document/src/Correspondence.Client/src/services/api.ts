import type { Document, DocStatus, UrgencyLevel, ConfidentialityLevel, DeadlineFlag } from '../types';

// API Service for Correspondence System (.NET 8 Web API)
const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dvs_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const otpToken = sessionStorage.getItem('dvs_otp_token');
  if (otpToken) {
    headers['X-OTP-Token'] = otpToken;
  }
  return headers;
}

function getUploadHeaders(): HeadersInit {
  const token = localStorage.getItem('dvs_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const otpToken = sessionStorage.getItem('dvs_otp_token');
  if (otpToken) headers['X-OTP-Token'] = otpToken;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.detail || data.title || data.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export function mapDtoToDocument(dto: any): Document {
  let status: DocStatus = 'registered';
  const s = (dto.status || '').toLowerCase();
  if (s === 'pendingreceive' || s === 'pending-acceptance') status = 'pending-acceptance';
  else if (s === 'inprogress' || s === 'in-progress') status = 'in-progress';
  else if (s === 'awaitingreturn' || s === 'awaiting-physical-return') status = 'awaiting-physical-return';
  else if (s === 'delivered') status = 'delivered';
  else if (s === 'completed') status = 'completed';
  else if (s === 'cancelled') status = 'cancelled';
  else if (s === 'attached') status = 'attached';
  else if (s === 'ready-to-send') status = 'ready-to-send';
  else if (s === 'sent') status = 'sent';

  let urgency: UrgencyLevel = 'normal';
  const u = (dto.urgency || '').toLowerCase();
  if (u === 'urgent') urgency = 'urgent';
  else if (u === 'veryurgent' || u === 'very-urgent') urgency = 'very-urgent';

  let confidentiality: ConfidentialityLevel = 'normal';
  const c = (dto.confidentiality || '').toLowerCase();
  if (c === 'secret' || c === 'confidential') confidentiality = 'confidential';
  else if (c === 'topsecret' || c === 'top-secret') confidentiality = 'top-secret';

  let deadlineFlag: DeadlineFlag = 'on-track';
  const df = (dto.deadlineFlag || '').toLowerCase();
  if (df === 'due-soon' || df === 'duesoon') deadlineFlag = 'due-soon';
  else if (df === 'overdue') deadlineFlag = 'overdue';
  else if (df === 'cleared') deadlineFlag = 'cleared';

  return {
    id: dto.id?.toString() || '',
    docNumber: dto.documentNumber || dto.edrOutgoingNumberTh || '',
    docNumberEN: dto.edrOutgoingNumberEn || undefined,
    originNumber: dto.originNumber || '',
    subject: dto.title || '',
    type: (dto.docChannel || '').toLowerCase() === 'email' ? 'email' : 'physical',
    channel: (dto.docChannel || '').toLowerCase() === 'email' ? 'email' : 'physical',
    urgency,
    confidentiality,
    status,
    deadlineFlag,
    originDepartment: dto.originDepartmentName || 'ฝ่ายบริหารทั่วไป',
    department: dto.responsibleDepartmentName || 'ฝ่ายบริหารทั่วไป',
    sender: dto.senderAgency || dto.createdByName || '',
    receiver: dto.destinationAgency || dto.responsibleDepartmentName || '',
    deadline: dto.dueDate ? new Date(dto.dueDate).toLocaleDateString('th-TH') : '-',
    progress: dto.progressPercent ?? 0,
    docDirection: (dto.docDirection || '').toLowerCase() === 'outgoing' ? 'outgoing' : 'incoming',
    currentHolder: dto.currentHolderName || 'สารบรรณกลาง',
    currentHolderDept: dto.originDepartmentName || 'ฝ่ายบริหารทั่วไป',
    receivedAt: dto.registeredAt ? new Date(dto.registeredAt).toLocaleDateString('th-TH') : '',
    description: dto.description || '',
    attachments: (dto.attachments || []).map((a: any) => typeof a === 'string' ? a : a.fileName),
    rawAttachments: dto.attachments || [],
    assignedTo: (dto.assignments || []).map((a: any) => a.assigneeName),
    assignments: dto.assignments || [],
    custodyLogs: dto.custodyLogs || [],
    histories: dto.histories || [],
    isRestrictedAttachment: dto.isRestrictedAttachment || false,
    deliveryMethod: dto.deliveryMethodName,
    createdBy: dto.createdById || dto.createdByName || ''
  };
}

export const authApi = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ token: string; user: any }>(res);
    localStorage.setItem('dvs_token', data.token);
    localStorage.setItem('dvs_user', JSON.stringify(data.user));
    return data;
  },
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },
  logout() {
    localStorage.removeItem('dvs_token');
    localStorage.removeItem('dvs_user');
    sessionStorage.removeItem('dvs_otp_token');
  }
};

export const docsApi = {
  async getDocuments(params?: { direction?: string; status?: string; urgency?: string; search?: string; departmentId?: number }) {
    const q = new URLSearchParams();
    if (params?.direction) q.append('direction', params.direction);
    if (params?.status) q.append('status', params.status);
    if (params?.urgency) q.append('urgency', params.urgency);
    if (params?.search) q.append('search', params.search);
    if (params?.departmentId) q.append('departmentId', params.departmentId.toString());

    const res = await fetch(`${API_BASE}/documents?${q.toString()}`, {
      headers: getAuthHeaders(),
    });
    const dtoList = await handleResponse<any[]>(res);
    return dtoList.map(mapDtoToDocument);
  },

  async getDocumentById(id: number | string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async registerIncoming(payload: any) {
    const res = await fetch(`${API_BASE}/documents/incoming`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async registerOutgoing(payload: any) {
    const res = await fetch(`${API_BASE}/documents/outgoing`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async accept(id: number | string, assignmentId: string, remarks?: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignmentId, remarks }),
    });
    return handleResponse<any>(res);
  },

  async delegate(id: number | string, subordinateUserIds: string[], remarks?: string, parentAssignmentId?: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/delegate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parentAssignmentId, subordinateUserIds, remarks }),
    });
    return handleResponse<any>(res);
  },

  async forward(id: number | string, targetDepartmentId: string, targetUserIds: string[], remarks?: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/forward`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetDepartmentId, targetUserIds, remarks }),
    });
    return handleResponse<any>(res);
  },

  async reject(id: number | string, remarks: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });
    return handleResponse<any>(res);
  },

  async complete(id: number | string, assignmentId: string, remarks?: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignmentId, remarks }),
    });
    return handleResponse<any>(res);
  },

  async deliver(id: number | string, payload: { trackingNumber?: string; deliveredToPerson?: string; remarks?: string; evidenceAttachment?: any }) {
    const res = await fetch(`${API_BASE}/documents/${id}/deliver`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async recall(id: number | string, remarks: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/recall`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });
    return handleResponse<any>(res);
  },

  async cancel(id: number | string, remarks: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });
    return handleResponse<any>(res);
  },

  async requestOtp(id: number | string, deliveryEmail?: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/otp/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deliveryEmail }),
    });
    return handleResponse<any>(res);
  },

  async verifyOtp(id: number | string, otpCode: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/otp/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ otpCode }),
    });
    const data = await handleResponse<{ token: string; message: string }>(res);
    sessionStorage.setItem('dvs_otp_token', data.token);
    return data;
  },

  async addAttachment(id: number | string, file: File, options?: { isEvidence?: boolean; isCameraCapture?: boolean }) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.isEvidence) formData.append('isEvidence', 'true');
    if (options?.isCameraCapture) formData.append('isCameraCapture', 'true');
    const res = await fetch(`${API_BASE}/documents/${id}/attachments`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    });
    return handleResponse<any>(res);
  },

  async downloadAttachment(url: string, fileName: string) {
    const res = await fetch(url, { headers: getUploadHeaders() });
    if (!res.ok) await handleResponse(res);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },

  async deleteAttachment(id: number | string, attId: number) {
    const res = await fetch(`${API_BASE}/documents/${id}/attachments/${attId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  }
};

export const masterApi = {
  async getDepartments() {
    const res = await fetch(`${API_BASE}/master/departments`, { headers: getAuthHeaders() });
    const list = await handleResponse<any[]>(res);
    return list.map(d => ({
      ...d,
      name: d.nameTh || d.name || ''
    }));
  },
  async getWorkgroups(departmentId?: number) {
    const q = departmentId ? `?departmentId=${departmentId}` : '';
    const res = await fetch(`${API_BASE}/master/workgroups${q}`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },
  async updateDepartmentHead(id: string, headUserRef: string) {
    const res = await fetch(`${API_BASE}/master/departments/${encodeURIComponent(id)}/head`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ headUserRef }),
    });
    return handleResponse<any>(res);
  },
  async getDeliveryMethods() {
    const res = await fetch(`${API_BASE}/master/delivery-methods`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },
  async getMonitors() {
    const res = await fetch(`${API_BASE}/master/monitors`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },
  async saveMonitor(payload: any) {
    const res = await fetch(`${API_BASE}/master/monitors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },
  async deleteMonitor(id: number | string) {
    const res = await fetch(`${API_BASE}/master/monitors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },
  async getReminderIntervals() {
    const res = await fetch(`${API_BASE}/master/reminder-intervals`, { headers: getAuthHeaders() });
    return handleResponse<{ normal: number; urgent: number; veryUrgent: number }>(res);
  },
  async saveReminderIntervals(payload: { normal: number; urgent: number; veryUrgent: number }) {
    const res = await fetch(`${API_BASE}/master/reminder-intervals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  }
};

export const edrApi = {
  async getContext() {
    const res = await fetch(`${API_BASE}/edr/context`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },
  async requestNumber(payload: any) {
    const res = await fetch(`${API_BASE}/edr/request-number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  }
};

export const reportsApi = {
  async getDashboard() {
    const res = await fetch(`${API_BASE}/reports/dashboard`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },
  async generateReport(payload: any) {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  }
};

export const adminApi = {
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },
  async searchLdap(query: string) {
    const res = await fetch(`${API_BASE}/admin/ldap/search?query=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },
  async provisionUser(payload: any) {
    const res = await fetch(`${API_BASE}/admin/users/provision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },
  async updateUser(id: number, payload: any) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  }
};
