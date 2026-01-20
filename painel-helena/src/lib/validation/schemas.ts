import { z } from 'zod';

// Client Validation
export const clientSchema = z.object({
  client_code: z.string()
    .trim()
    .max(20, { message: "Código deve ter no máximo 20 caracteres" })
    .optional()
    .or(z.literal('')),
  name: z.string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" }),
  cpf_cnpj: z.string()
    .trim()
    .max(20, { message: "CPF/CNPJ deve ter no máximo 20 caracteres" })
    .optional()
    .or(z.literal('')),
  max_connections: z.number()
    .min(1, { message: "Mínimo de 1 conexão" })
    .max(99, { message: "Máximo de 99 conexões" }),
  max_team_members: z.number()
    .min(0, { message: "Mínimo de 0" })
    .max(99, { message: "Máximo de 99 membros" }),
  max_agents: z.number()
    .min(1, { message: "Mínimo de 1 agente" })
    .max(99, { message: "Máximo de 99 agentes" }),
  password: z.string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .max(72, { message: "Senha deve ter no máximo 72 caracteres" })
    .optional()
    .or(z.literal('')),
});

// Team Member Validation
export const teamMemberSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" }),
  password: z.string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .max(72, { message: "Senha deve ter no máximo 72 caracteres" })
    .optional()
    .or(z.literal('')),
});

// Contact Validation
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  phone: z.string()
    .trim()
    .min(10, { message: "Telefone deve ter pelo menos 10 dígitos" })
    .max(20, { message: "Telefone deve ter no máximo 20 dígitos" })
    .regex(/^[0-9+\s()-]+$/, { message: "Telefone contém caracteres inválidos" }),
});

// Message Validation
export const messageSchema = z.object({
  text: z.string()
    .trim()
    .min(1, { message: "Mensagem não pode estar vazia" })
    .max(4096, { message: "Mensagem deve ter no máximo 4096 caracteres" }),
  phone: z.string()
    .trim()
    .min(10, { message: "Telefone inválido" })
    .max(20, { message: "Telefone inválido" }),
});

// Settings Validation
export const settingSchema = z.object({
  key: z.string()
    .trim()
    .min(1, { message: "Chave é obrigatória" })
    .max(100, { message: "Chave deve ter no máximo 100 caracteres" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Chave deve conter apenas letras, números, _ e -" }),
  value: z.string()
    .trim()
    .max(1000, { message: "Valor deve ter no máximo 1000 caracteres" }),
});
