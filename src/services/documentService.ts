import { API_BASE_URL, request } from "./apiClient";
import type {
  Attachment,
  AttachmentListResponse,
  AttachmentFilters,
  StorageUsage,
  UploadAttachmentParams,
} from "@/types/documents";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const documentService = {
  // ─── List Attachments ──────────────────────────────────────────────────────

  async listAttachments(
    filters: AttachmentFilters,
    token: string
  ): Promise<AttachmentListResponse> {
    const params = new URLSearchParams();
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.entityId) params.set("entityId", filters.entityId);
    if (filters.page) params.set("page", filters.page.toString());
    if (filters.limit) params.set("limit", filters.limit.toString());

    const qs = params.toString();
    const res = await request<ApiResponse<AttachmentListResponse>>(
      `${API_BASE_URL}/documents${qs ? `?${qs}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Normalize: backend may nest data differently
    const raw = res.data as unknown as Record<string, unknown>;
    return {
      data: Array.isArray(raw.data) ? (raw.data as Attachment[]) : Array.isArray(res.data) ? (res.data as unknown as Attachment[]) : [],
      total: Number(raw.total ?? 0),
      page: Number(raw.page ?? 1),
      limit: Number(raw.limit ?? 20),
      totalPages: Number(raw.totalPages ?? 1),
    };
  },

  // ─── Get Single Attachment ─────────────────────────────────────────────────

  async getAttachment(id: string, token: string): Promise<Attachment> {
    const res = await request<ApiResponse<Attachment>>(
      `${API_BASE_URL}/documents/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // ─── Upload File ───────────────────────────────────────────────────────────

  async uploadAttachment(
    params: UploadAttachmentParams,
    token: string,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("entityType", params.entityType);
    formData.append("entityId", params.entityId);
    if (params.description) formData.append("description", params.description);

    // Use XMLHttpRequest for upload progress tracking
    if (onProgress) {
      return new Promise<Attachment>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/documents/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        });

        xhr.addEventListener("load", () => {
          try {
            const json = JSON.parse(xhr.responseText) as ApiResponse<Attachment>;
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json.data);
            } else {
              reject(new Error((json as unknown as { message?: string }).message ?? "Upload failed"));
            }
          } catch {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.send(formData);
      });
    }

    // Fallback: no progress tracking
    const res = await request<ApiResponse<Attachment>>(
      `${API_BASE_URL}/documents/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    return res.data;
  },

  // ─── Download File ─────────────────────────────────────────────────────────

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  async downloadAttachment(
    id: string,
    originalName: string,
    token: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // ─── Delete Attachment ─────────────────────────────────────────────────────

  async deleteAttachment(id: string, token: string): Promise<void> {
    await request<ApiResponse<null>>(
      `${API_BASE_URL}/documents/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  // ─── Storage Usage ─────────────────────────────────────────────────────────

  async getStorageUsage(token: string): Promise<StorageUsage> {
    const res = await request<ApiResponse<StorageUsage>>(
      `${API_BASE_URL}/documents/storage-usage`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};

export default documentService;
