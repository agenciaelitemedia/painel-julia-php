-- Adicionar política RLS de DELETE para admins poderem excluir clientes
CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));