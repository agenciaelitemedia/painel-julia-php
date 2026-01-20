<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Carbon\Carbon;

class ContractsExport implements FromCollection, WithHeadings
{
    protected $contracts;

    public function __construct($contracts)
    {
        $this->contracts = $contracts;
    }

    public function collection()
    {
        return $this->contracts->map(function ($contract) {
            return [
                'Data do Contrato' => Carbon::parse($contract->created_at)->setTimezone('America/Sao_Paulo')->format('d/m/Y H:i'),
                'Escritório' => mask_data($contract->name, 'name'),
                'Nome' => mask_data($contract->signer_name, 'name'),
                'Telefone' => mask_data(formata_telefone($contract->whatsapp_number), 'phone'),
                'Status do Documento' => $contract->status_document,
                'CPF' => mask_data($contract->signer_cpf, 'cpf'),
                'UF' => $contract->signer_uf,
                'Cidade' => $contract->signer_cidade,
                'Bairro' => mask_data($contract->signer_bairro, 'name'),
                'Endereço' => mask_data($contract->signer_endereco, 'name'),
                'CEP' => mask_data($contract->signer_cep, 'cep'),
                'Resumo do Caso' => mask_data($contract->resume_case, 'name'),
                'Link do Documento' => 'https://app.zapsign.com.br/verificar/' . mask_data($contract->cod_document, 'text')
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Data do Contrato',
            'Escritório',
            'Nome',
            'Telefone',
            'Status do Documento',
            'CPF',
            'UF',
            'Cidade',
            'Bairro',
            'Endereço',
            'CEP',
            'Resumo do Caso',
            'Link do Documento'
        ];
    }
}
