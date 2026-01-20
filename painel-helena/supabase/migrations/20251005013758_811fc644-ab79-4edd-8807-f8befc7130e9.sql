-- Criar função para adicionar valores ao enum system_module
CREATE OR REPLACE FUNCTION public.add_system_module_enum_value(new_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adicionar valor ao enum se não existir
  EXECUTE format('ALTER TYPE system_module ADD VALUE IF NOT EXISTS %L', new_value);
EXCEPTION
  WHEN duplicate_object THEN
    -- Valor já existe, ignorar
    NULL;
END;
$$;

-- Garantir que usuários autenticados possam executar a função
GRANT EXECUTE ON FUNCTION public.add_system_module_enum_value(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_system_module_enum_value(text) TO service_role;