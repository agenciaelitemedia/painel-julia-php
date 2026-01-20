import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-request-timestamp, x-referer',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const ZAPSIGN_API_URL = "https://api.zapsign.com.br/api/v1";

// Standard ZapSign variables (only extract these clean variable names)
const ZAPSIGN_STANDARD_VARIABLES = [
  'Nome', 'CPF', 'RG', 'Naturalidade', 'Estado Civil',
  'Endereço Completo', 'Bairro', 'Cidade', 'Estado', 'CEP',
  'Telefone', 'DATA', 'ProfissaoCliente', 'EmailCliente',
  'Nome_Filho', 'CPF_Filho', 'DataNascimento_Filho',
  'REPRESENTANTE_NOME', 'REPRESENTANTE_CPF', 'REPRESENTANTE_RELACAO',
  'MENOR_NOME', 'MENOR_DATA_NASCIMENTO',
  'SIGNATARIO_NOME', 'SIGNATARIO_EMAIL', 'SIGNATARIO_TELEFONE'
];

// Helper function to extract text content from Word XML
function extractTextFromWordXml(xmlContent: string): string {
  // Remove all XML tags and get plain text
  // In Word XML, text is inside <w:t> tags
  const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  return textMatches.map(match => {
    const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
    return textMatch ? textMatch[1] : '';
  }).join('');
}

// Helper function to normalize Word XML by merging fragmented runs within paragraphs
// This fixes the problem where variables like {{Nome}} get split across multiple XML tags
function normalizeWordXml(xmlContent: string): string {
  // This regex finds patterns where variable markers {{ or }} are split across runs
  // We need to merge text runs (<w:r>) that contain parts of the same variable
  
  // Step 1: Find all <w:p> (paragraph) elements
  let result = xmlContent;
  
  // Step 2: Within each paragraph, merge consecutive <w:t> text segments that form variable patterns
  // Look for patterns where {{ and }} are separated by XML tags
  
  // Pattern to match fragmented variables: {{ followed by XML noise, then variable name, then XML noise, then }}
  const fragmentedPattern = /\{\{(<[^>]*>)*([^<{}]+)(<[^>]*>)*\}\}/g;
  
  // First, let's try a more aggressive approach: normalize text runs
  // Replace patterns like </w:t></w:r>...<w:r>...<w:t> with nothing between {{ and }}
  
  // Match: opening brace that might span tags
  result = result.replace(/\{\s*\{/g, '{{');
  result = result.replace(/\}\s*\}/g, '}}');
  
  // Clean up common Word XML noise between variable markers
  // Pattern: {{ followed by any combination of closing/opening tags, then variable content, then closing tags, then }}
  const cleanVariablePattern = /\{\{(<\/w:t>)?(<[^>]*>)*\s*(<w:t[^>]*>)?([A-Za-zÀ-ÿ0-9_\s]+)(<\/w:t>)?(<[^>]*>)*\s*(<w:t[^>]*>)?\}\}/g;
  
  result = result.replace(cleanVariablePattern, (match, ...groups) => {
    // Extract the variable name from the capture groups
    const varName = groups[3]; // The 4th capture group is the variable name
    if (varName && varName.trim()) {
      return `{{${varName.trim()}}}`;
    }
    return match;
  });
  
  // Also handle cases where the entire variable including braces is split
  // This handles: <w:t>{{</w:t></w:r><w:proofErr .../><w:r><w:t>NomeVariavel</w:t></w:r><w:r><w:t>}}</w:t>
  const splitVariablePattern = /<w:t[^>]*>\{\{<\/w:t>([^]*?)<w:t[^>]*>\}\}<\/w:t>/g;
  result = result.replace(splitVariablePattern, (match, middle) => {
    // Extract text content from the middle
    const textContent = middle.replace(/<[^>]*>/g, '').trim();
    if (textContent) {
      return `<w:t>{{${textContent}}}</w:t>`;
    }
    return match;
  });
  
  return result;
}

// Helper function to extract clean variables from DOCX XML content
function extractVariablesFromXml(xmlContent: string): string[] {
  const variables: string[] = [];
  
  // First normalize the XML
  const normalizedXml = normalizeWordXml(xmlContent);
  
  // Then extract all text content from the XML
  const plainText = extractTextFromWordXml(normalizedXml);
  
  // Then find variables in the plain text
  const variablePattern = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = variablePattern.exec(plainText)) !== null) {
    const varName = match[1].trim();
    // Only include if it's a clean variable name (no XML tags, alphanumeric + underscore + accents)
    if (varName && !varName.includes('<') && !varName.includes('>') && 
        /^[\w\sÀ-ÿ_-]+$/.test(varName) && !variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  // Also check directly in normalized XML for variables that might be intact
  const xmlVariablePattern = /\{\{([\w\sÀ-ÿ_-]+)\}\}/g;
  while ((match = xmlVariablePattern.exec(normalizedXml)) !== null) {
    const varName = match[1].trim();
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapsignToken = Deno.env.get('ZAPSIGN_API_TOKEN');

    if (!zapsignToken) {
      throw new Error('ZAPSIGN_API_TOKEN not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const url = new URL(req.url);
    const path = url.pathname.replace('/zapsign-templates', '');

    console.log(`[zapsign-templates] ${req.method} ${path}`);

    // POST /upload - Upload DOCX to Storage and extract variables
    if (req.method === 'POST' && path === '/upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const templateName = formData.get('template_name') as string;
      const codAgent = formData.get('cod_agent') as string;
      const caseId = formData.get('case_id') as string;
      const isLegalRepresentative = formData.get('is_legal_representative') === 'true';
      const legalRepData = formData.get('legal_representative_data') as string;

      if (!file || !templateName || !codAgent) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: file, template_name, cod_agent' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${codAgent}/${timestamp}_${sanitizedName}`;

      // Read file as ArrayBuffer for both storage and processing
      const fileBuffer = await file.arrayBuffer();
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-templates')
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('[zapsign-templates] Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Extract variables from DOCX using JSZip
      let variables: string[] = [];
      try {
        const zip = await JSZip.loadAsync(fileBuffer);
        const documentXml = await zip.file('word/document.xml')?.async('string');
        
        if (documentXml) {
          variables = extractVariablesFromXml(documentXml);
          console.log('[zapsign-templates] Variables found in document.xml:', variables);
        } else {
          console.warn('[zapsign-templates] word/document.xml not found in DOCX');
        }
      } catch (zipError) {
        console.error('[zapsign-templates] Error reading DOCX:', zipError);
        // Fallback: try to extract from raw content (for non-DOCX files)
        const textContent = await file.text();
        variables = extractVariablesFromXml(textContent);
      }

      // Add legal representative variables if applicable
      if (isLegalRepresentative) {
        const legalVars = [
          'REPRESENTANTE_NOME',
          'REPRESENTANTE_CPF',
          'REPRESENTANTE_RELACAO',
          'MENOR_NOME',
          'MENOR_DATA_NASCIMENTO'
        ];
        legalVars.forEach(v => {
          if (!variables.includes(v)) variables.push(v);
        });
      }

      const result = {
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        variables,
        template_name: templateName,
        cod_agent: codAgent,
        agent_case_legal_id: caseId ? parseInt(caseId) : null,
        is_legal_representative: isLegalRepresentative,
        legal_representative_data: legalRepData ? JSON.parse(legalRepData) : {},
        status: 'draft'
      };

      console.log('[zapsign-templates] Upload successful:', result);

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /generate-preview - Generate DOCX preview with test data
    if (req.method === 'POST' && path === '/generate-preview') {
      const body = await req.json();
      const { storage_path, test_data } = body;

      if (!storage_path) {
        return new Response(
          JSON.stringify({ error: 'Missing storage_path' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-templates')
        .download(storage_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      // Read DOCX as ArrayBuffer and load with JSZip
      const arrayBuffer = await fileData.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Read document.xml
      let documentXml = await zip.file('word/document.xml')?.async('string');
      
      if (!documentXml) {
        throw new Error('Invalid DOCX: word/document.xml not found');
      }

      // Replace variables with test data
      // First normalize the XML to merge fragmented variables
      documentXml = normalizeWordXml(documentXml);
      
      if (test_data) {
        for (const [key, value] of Object.entries(test_data)) {
          // Replace both exact match and variations with spaces
          const exactRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          documentXml = documentXml.replace(exactRegex, String(value));
          
          // Also try matching with potential XML noise inside
          const flexRegex = new RegExp(`\\{\\{(<[^>]*>)*\\s*${key}\\s*(<[^>]*>)*\\}\\}`, 'g');
          documentXml = documentXml.replace(flexRegex, String(value));
        }
      }

      // Find remaining unreplaced variables
      const remainingVars = extractVariablesFromXml(documentXml);

      // Update document.xml in the zip
      zip.file('word/document.xml', documentXml);

      // Generate the modified DOCX as Uint8Array
      const modifiedContent = await zip.generateAsync({ type: 'uint8array' });
      
      // Convert to base64
      const base64Content = uint8ArrayToBase64(modifiedContent);

      const fileName = storage_path.split('/').pop() || 'preview.docx';

      console.log('[zapsign-templates] Preview generated, remaining vars:', remainingVars);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            base64_content: base64Content,
            file_name: `preview_${fileName}`,
            remaining_variables: remainingVars
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /create-template - Create template in ZapSign
    if (req.method === 'POST' && path === '/create-template') {
      const body = await req.json();
      const { storage_path, template_name, folder_name, variables, signers } = body;

      if (!storage_path || !template_name) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-templates')
        .download(storage_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      // Convert to base64 properly
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Content = uint8ArrayToBase64(uint8Array);

      // Create DOCX template in ZapSign
      // Docs: POST https://api.zapsign.com.br/api/v1/templates/create/
      const zapsignPayload: any = {
        name: template_name,
        base64_docx: base64Content,
        lang: "pt-br",
      };

      // Add folder if provided
      if (folder_name) {
        zapsignPayload.folder_path = folder_name;
      }

      console.log('[zapsign-templates] Creating DOCX template in ZapSign...', {
        template_name,
        folder_name,
      });

      const zapsignResponse = await fetch(`${ZAPSIGN_API_URL}/templates/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zapsignToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(zapsignPayload)
      });

      if (!zapsignResponse.ok) {
        const errorText = await zapsignResponse.text();
        console.error('[zapsign-templates] ZapSign error:', errorText);
        throw new Error(`ZapSign API error: ${errorText}`);
      }

      const zapsignResult = await zapsignResponse.json();
      console.log('[zapsign-templates] Template created:', zapsignResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            zapsign_template_id: zapsignResult.token || zapsignResult.id,
            // Template creation does not return a document token; keep empty string for backwards compatibility
            zapsign_doc_token: zapsignResult.doc_token || "",
            status: 'active'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /test - Test template with sample data
    if (req.method === 'POST' && path === '/test') {
      const body = await req.json();
      const { storage_path, test_data } = body;

      if (!storage_path) {
        return new Response(
          JSON.stringify({ error: 'Missing storage_path' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-templates')
        .download(storage_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      // Read DOCX with JSZip
      const arrayBuffer = await fileData.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let documentXml = await zip.file('word/document.xml')?.async('string');
      
      if (!documentXml) {
        throw new Error('Invalid DOCX: word/document.xml not found');
      }

      // Replace variables
      if (test_data) {
        for (const [key, value] of Object.entries(test_data)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          documentXml = documentXml.replace(regex, String(value));
        }
      }

      // Find remaining unreplaced variables
      const remainingVars = extractVariablesFromXml(documentXml);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            preview_content: documentXml.substring(0, 5000), // Limit preview size
            remaining_variables: remainingVars,
            all_replaced: remainingVars.length === 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /add-attachment - Add attachment to existing template
    if (req.method === 'POST' && path === '/add-attachment') {
      const body = await req.json();
      const { parent_template_id, storage_path, attachment_name } = body;

      if (!parent_template_id || !storage_path) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-templates')
        .download(storage_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      // Convert to base64 properly
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Content = uint8ArrayToBase64(uint8Array);

      // Add as extra doc to ZapSign template
      const zapsignResponse = await fetch(`${ZAPSIGN_API_URL}/templates/${parent_template_id}/extra-docs/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zapsignToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: attachment_name || 'Documento Anexo',
          base64_pdf: base64Content
        })
      });

      if (!zapsignResponse.ok) {
        const errorText = await zapsignResponse.text();
        throw new Error(`ZapSign API error: ${errorText}`);
      }

      const result = await zapsignResponse.json();

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /update-observers - Update notification emails for a template
    if (req.method === 'PUT' && path === '/update-observers') {
      const body = await req.json();
      const { template_token, observers } = body;

      if (!template_token) {
        return new Response(
          JSON.stringify({ error: 'Missing template_token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate observers array (max 20 emails)
      const validObservers = (observers || [])
        .filter((email: string) => email && typeof email === 'string' && email.includes('@'))
        .slice(0, 20);

      console.log('[zapsign-templates] Updating observers for template:', template_token, validObservers);

      // Update template in ZapSign
      const zapsignResponse = await fetch(`${ZAPSIGN_API_URL}/templates/${template_token}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${zapsignToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          observers: validObservers
        })
      });

      if (!zapsignResponse.ok) {
        const errorText = await zapsignResponse.text();
        console.error('[zapsign-templates] ZapSign update observers error:', errorText);
        throw new Error(`ZapSign API error: ${errorText}`);
      }

      const result = await zapsignResponse.json();
      console.log('[zapsign-templates] Observers updated successfully:', result);

      return new Response(
        JSON.stringify({ success: true, data: { observers: validObservers } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /delete-zapsign/:template_token - Delete template from ZapSign
    if (req.method === 'DELETE' && path.startsWith('/delete-zapsign/')) {
      const templateToken = decodeURIComponent(path.replace('/delete-zapsign/', ''));
      
      if (!templateToken || templateToken === 'null' || templateToken === 'undefined') {
        // If no ZapSign token, nothing to delete
        console.log('[zapsign-templates] No ZapSign template token provided, skipping ZapSign deletion');
        return new Response(
          JSON.stringify({ success: true, message: 'No ZapSign template to delete' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[zapsign-templates] Deleting template from ZapSign:', templateToken);

      // Delete from ZapSign API
      const zapsignResponse = await fetch(`${ZAPSIGN_API_URL}/templates/${templateToken}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zapsignToken}`,
          'Content-Type': 'application/json'
        }
      });

      // 404 means template already deleted or doesn't exist - treat as success
      if (!zapsignResponse.ok && zapsignResponse.status !== 404) {
        const errorText = await zapsignResponse.text();
        console.error('[zapsign-templates] ZapSign delete error:', errorText);
        throw new Error(`ZapSign delete failed: ${errorText}`);
      }

      console.log('[zapsign-templates] Template deleted from ZapSign successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /template/:storage_path - Delete template from storage
    if (req.method === 'DELETE' && path.startsWith('/template/')) {
      const storagePath = decodeURIComponent(path.replace('/template/', ''));

      const { error: deleteError } = await supabase.storage
        .from('contract-templates')
        .remove([storagePath]);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /download/:storage_path - Get download URL
    if (req.method === 'GET' && path.startsWith('/download/')) {
      const storagePath = decodeURIComponent(path.replace('/download/', ''));

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('contract-templates')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (urlError) {
        throw new Error(`Failed to create signed URL: ${urlError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, data: { url: signedUrl.signedUrl } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[zapsign-templates] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
