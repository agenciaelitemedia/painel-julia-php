<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonalizacaoAgente extends Model
{
    protected $table = 'personalizacao_agente';

    protected $fillable = [
        'nome_agente',
        'endereco',
        'cnpj',
        'advogados_oab',
        'telefone',
        'email',
        'site',
        'redes_sociais',
        'boasvindas_mensagem',
        'boasvindas_video',
        'resumo_mensagem',
        'resumo_video',
        'contrato_gerado_notificacao',
        'contrato_gerado_mensagem',
        'contrato_gerado_video',
        'contrato_assinado_notificacao',
        'contrato_assinado_mensagem',
        'contrato_assinado_video',
        'user_id',
        'produto_id',
        'explicacao_honorarios',
        'video_honorarios',
        'contrato',
    ];

    public function getBoasvindasVideoAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }

    public function getContratoAssinadoVideoAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }

    public function getResumoVideoAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }

    public function getContratoGeradoVideoAttribute($value)
    {
        if ($value) {
            return asset("storage/{$value}");
        } else {
            return null;
        }
    }
}
