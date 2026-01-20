import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LegalRepresentativeData } from "./usePublicContractTemplates";

interface UploadTemplateParams {
  file: File;
  templateName: string;
  codAgent: string;
  caseId?: number;
  isLegalRepresentative?: boolean;
  legalRepresentativeData?: LegalRepresentativeData;
  sessionToken: string;
}

interface UploadResult {
  storage_path: string;
  file_name: string;
  file_size: number;
  variables: string[];
  template_name: string;
  cod_agent: string;
  agent_case_legal_id: number | null;
  is_legal_representative: boolean;
  legal_representative_data: LegalRepresentativeData;
  status: string;
}

export function useUploadTemplate() {
  return useMutation({
    mutationFn: async (params: UploadTemplateParams): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('template_name', params.templateName);
      formData.append('cod_agent', params.codAgent);
      
      if (params.caseId) {
        formData.append('case_id', params.caseId.toString());
      }
      if (params.isLegalRepresentative) {
        formData.append('is_legal_representative', 'true');
      }
      if (params.legalRepresentativeData) {
        formData.append('legal_representative_data', JSON.stringify(params.legalRepresentativeData));
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-session-token': params.sessionToken,
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.data;
    }
  });
}

interface TestTemplateParams {
  storagePath: string;
  testData: Record<string, string>;
  sessionToken: string;
}

interface TestResult {
  preview_content: string;
  remaining_variables: string[];
  all_replaced: boolean;
}

export function useTestTemplate() {
  return useMutation({
    mutationFn: async (params: TestTemplateParams): Promise<TestResult> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'x-session-token': params.sessionToken,
          },
          body: JSON.stringify({
            storage_path: params.storagePath,
            test_data: params.testData
          })
        }
      );

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const result = await response.json();
      return result.data;
    }
  });
}

interface GeneratePreviewParams {
  storagePath: string;
  testData: Record<string, string>;
  sessionToken: string;
}

interface GeneratePreviewResult {
  base64_content: string;
  file_name: string;
  remaining_variables: string[];
}

export function useGeneratePreview() {
  return useMutation({
    mutationFn: async (params: GeneratePreviewParams): Promise<GeneratePreviewResult> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/generate-preview`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'x-session-token': params.sessionToken,
          },
          body: JSON.stringify({
            storage_path: params.storagePath,
            test_data: params.testData
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generate preview failed: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Generate preview failed');
      }

      return result.data;
    }
  });
}

interface CreateZapSignTemplateParams {
  storagePath: string;
  templateName: string;
  folderName?: string;
  variables: string[];
  sessionToken: string;
}

interface CreateZapSignResult {
  zapsign_template_id: string;
  zapsign_doc_token: string;
  status: string;
}

export function useCreateZapSignTemplate() {
  return useMutation({
    mutationFn: async (params: CreateZapSignTemplateParams): Promise<CreateZapSignResult> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/create-template`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'x-session-token': params.sessionToken,
          },
          body: JSON.stringify({
            storage_path: params.storagePath,
            template_name: params.templateName,
            folder_name: params.folderName,
            variables: params.variables
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create template failed: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Create template failed');
      }

      return result.data;
    }
  });
}

interface AddAttachmentParams {
  parentTemplateId: string;
  storagePath: string;
  attachmentName: string;
  sessionToken: string;
}

export function useAddAttachment() {
  return useMutation({
    mutationFn: async (params: AddAttachmentParams) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/add-attachment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'x-session-token': params.sessionToken,
          },
          body: JSON.stringify({
            parent_template_id: params.parentTemplateId,
            storage_path: params.storagePath,
            attachment_name: params.attachmentName
          })
        }
      );

      if (!response.ok) {
        throw new Error('Add attachment failed');
      }

      const result = await response.json();
      return result.data;
    }
  });
}

interface DeleteStorageParams {
  storagePath: string;
  sessionToken: string;
}

export function useDeleteFromStorage() {
  return useMutation({
    mutationFn: async (params: DeleteStorageParams) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/template/${encodeURIComponent(params.storagePath)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-session-token': params.sessionToken,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return true;
    }
  });
}

interface UpdateObserversParams {
  templateToken: string;
  observers: string[];
  sessionToken: string;
}

interface UpdateObserversResult {
  observers: string[];
}

export function useUpdateTemplateObservers() {
  return useMutation({
    mutationFn: async (params: UpdateObserversParams): Promise<UpdateObserversResult> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapsign-templates/update-observers`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'x-session-token': params.sessionToken,
          },
          body: JSON.stringify({
            template_token: params.templateToken,
            observers: params.observers
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update observers failed: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Update observers failed');
      }

      return result.data;
    }
  });
}
