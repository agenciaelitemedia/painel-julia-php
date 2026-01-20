/**
 * Types para o sistema de Tools do AI Agent
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  name: string;
  content: string;
}

export interface ToolExecutionContext {
  supabase: any;
  agent_id: string;
  client_id: string;
  remote_jid: string;
  conversation_id: string;
}

export interface BookingToolConfig {
  calendar_id: string;
}

export interface ToolsConfig {
  enabled_tools: string[];
  booking?: BookingToolConfig;
}
