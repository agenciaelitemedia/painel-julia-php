<?php

use Carbon\Carbon;

if (! function_exists('tempo_relativo')) {
    function tempo_relativo($data)
    {

        // Ajuste para o fuso horário UTC-3
        $data = Carbon::parse($data); //->setTimezone('America/Sao_Paulo');

        // Obtenha o momento atual no fuso horário UTC-3
        $agora = Carbon::now();

        // Verifique se a data está no futuro
        if ($data->isFuture()) {
            return 'Data no futuro';
        }

        // Calcule a diferença em segundos
        $diferencaEmSegundos = $data->diffInSeconds($agora);

        if ($diferencaEmSegundos < 60) {
            return 'agora há pouco';
        } elseif ($diferencaEmSegundos < 3600) {
            $minutos = floor($diferencaEmSegundos / 60);
            return 'à ' . $minutos . ($minutos == 1 ? ' minuto' : ' minutos');
        } elseif ($diferencaEmSegundos < 86400) {
            $horas = floor($diferencaEmSegundos / 3600);
            return 'à ' . $horas . ($horas == 1 ? ' hora' : ' horas');
        } else {
            $dias = floor($diferencaEmSegundos / 86400);
            return 'à ' . $dias . ($dias == 1 ? ' dia' : ' dias');
        }
    }
}


if (! function_exists('diferenca_tempo')) {
    function diferenca_tempo($data_inicial, $data_final) {
        // Se alguma das datas for nula, retorna ---
        if (!$data_inicial || !$data_final) {
            return '---';
        }

        // Converte as datas para timestamp em segundos
        $inicio = Carbon::parse($data_inicial)->timestamp;
        $fim = Carbon::parse($data_final)->timestamp;

        // Calcula a diferença em segundos
        $diferenca = $fim - $inicio;

        // Se a diferença for negativa, retorna ---
        if ($diferenca < 0) {
            return '---';
        }

        // Calcula dias, horas e minutos
        $dias = floor($diferenca / 86400); // 86400 segundos = 1 dia
        $horas = floor(($diferenca % 86400) / 3600); // 3600 segundos = 1 hora
        $minutos = floor(($diferenca % 3600) / 60);

        // Retorna o formato apropriado baseado no tempo decorrido
        if ($dias > 0) {
            return $dias . ($dias == 1 ? ' dia' : ' dias');
        } elseif ($horas > 0) {
            return $horas . ($horas == 1 ? ' hora' : ' horas');
        } else {
            return $minutos . ($minutos == 1 ? ' min' : ' min');
        }
    }
}


if (! function_exists('formata_telefone')) {
    function formata_telefone($telefone) {
        // Remove todos os caracteres não numéricos
        $numero = preg_replace('/[^0-9]/', '', $telefone);

        // Verifica se tem o tamanho mínimo necessário (DDI + DDD + número)
        if (strlen($numero) < 12) {
            return $telefone; // Retorna original se não tiver tamanho mínimo
        }

        // Extrai DDI, DDD e número
        $ddi = substr($numero, 0, 2);
        $ddd = substr($numero, 2, 2);
        $numero_final = substr($numero, 4);

        // Se o número tiver 8 dígitos e começar com 5,6,7,8,9, adiciona o 9
        if (strlen($numero_final) == 8) {
            $primeiro_digito = substr($numero_final, 0, 1);
            if (in_array($primeiro_digito, ['5','6','7','8','9'])) {
                $numero_final = '9' . $numero_final;
            }
        }

        // Formata o número final
        if (strlen($numero_final) == 9) {
            return "($ddd) " . substr($numero_final, 0, 5) . "-" . substr($numero_final, 5);
        } else {
            return "($ddd) " . substr($numero_final, 0, 4) . "-" . substr($numero_final, 4);
        }
    }
}


if (! function_exists('mask_data')) {
    function mask_data($data, $type) {
        if (empty($data)) {
            return $data;
        }

        // Verifica se o usuário tem permissão para ver dados mascarados
        if (!auth()->user()->data_mask) {
            return $data;
        }

        switch (strtolower($type)) {
            case 'phone':
                // Remove caracteres não numéricos
                $numero = preg_replace('/[^0-9]/', '', $data);

                // Pega os 4 últimos dígitos
                $ultimos_digitos = substr($numero, -4);

                // Monta máscara com asteriscos
                if (strlen($numero) >= 11) { // Celular com DDD
                    return "(**) *****-" . $ultimos_digitos;
                } else if (strlen($numero) >= 10) { // Fixo com DDD
                    return "(**) ****-" . $ultimos_digitos;
                }
                return str_repeat('*', strlen($numero) - 4) . $ultimos_digitos;

            case 'email':
                if (!filter_var($data, FILTER_VALIDATE_EMAIL)) {
                    return $data;
                }

                list($nome, $dominio) = explode('@', $data);

                // Mostra 3 primeiros caracteres do nome
                $nome_mascarado = substr($nome, 0, 3) . str_repeat('*', strlen($nome) - 3);

                return $nome_mascarado . '@' . $dominio;
            case 'cpf':
                // Remove caracteres não numéricos
                $cpf = preg_replace('/[^0-9]/', '', $data);

                // Verifica se tem 11 dígitos
                if (strlen($cpf) != 11) {
                    return $data;
                }

                // Pega os 5 últimos dígitos
                $ultimos_digitos = substr($cpf, -5);

                // Monta a máscara
                return "***.***.{$ultimos_digitos[0]}{$ultimos_digitos[1]}{$ultimos_digitos[2]}-{$ultimos_digitos[3]}{$ultimos_digitos[4]}";
            case 'cep':
                // Remove caracteres não numéricos
                $cep = preg_replace('/[^0-9]/', '', $data);

                // Verifica se tem 8 dígitos
                if (strlen($cep) != 8) {
                    return $data;
                }

                // Pega os 5 primeiros dígitos
                $primeiros_digitos = substr($cep, 0, 5);

                // Formata o CEP com máscara
                return substr($primeiros_digitos, 0, 2) . '.' . substr($primeiros_digitos, 2, 3) . '-***';

            case 'name':
                // Divide o nome em palavras
                $palavras = explode(' ', trim($data));
                $palavras_mascaradas = [];
                static $mapa_nomes = [];

                foreach ($palavras as $palavra) {
                    // Se for número, mantém como está
                    if (is_numeric($palavra)) {
                        $palavras_mascaradas[] = $palavra;
                        continue;
                    }

                    $palavra_lower = strtolower($palavra);

                    // Se a palavra já foi mascarada antes, usa a mesma máscara
                    if (!isset($mapa_nomes[$palavra_lower])) {
                        $letras = str_split($palavra);
                        shuffle($letras);
                        $mapa_nomes[$palavra_lower] = implode('', $letras);
                    }

                    $palavras_mascaradas[] = $mapa_nomes[$palavra_lower];
                }

                return implode(' ', $palavras_mascaradas);

            default:
                return md5($data);
        }
    }
}
