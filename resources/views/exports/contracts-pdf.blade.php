<!DOCTYPE html>
<html>
<head>
    <title>Contratos</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h2>Lista de Contratos</h2>
    <table>
        <thead>
            <tr>
                <th>Data do Contrato</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Status do Documento</th>
                <th>CPF</th>
                <th>UF</th>
                <th>Cidade</th>
                <th>Bairro</th>
                <th>Endereço</th>
                <th>CEP</th>
                <th>Resumo do Caso</th>
                <th>Link do Documento</th>
            </tr>
        </thead>
        <tbody>
            @foreach($contracts as $contract)
            <tr>
                <td>{{ Carbon\Carbon::parse($contract->created_at)->setTimezone('America/Sao_Paulo')->format('d/m/Y H:i') }}</td>
                <td>{{ $contract->signer_name }}</td>
                <td>{{ formata_telefone($contract->whatsapp_number) }}</td>
                <td>{{ $contract->status_document }}</td>
                <td>{{ $contract->signer_cpf }}</td>
                <td>{{ $contract->signer_uf }}</td>
                <td>{{ $contract->signer_cidade }}</td>
                <td>{{ $contract->signer_bairro }}</td>
                <td>{{ $contract->signer_endereco }}</td>
                <td>{{ $contract->signer_cep }}</td>
                <td>{{ $contract->resume_case }}</td>
                <td>{{ 'https://app.zapsign.com.br/verificar/' . $contract->cod_document }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
