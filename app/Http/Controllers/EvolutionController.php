<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Illuminate\Support\Str;

class EvolutionController extends Controller
{

    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = 'b146f1f8b6f061b98e63abe12656cc3e';
        $this->baseUrl = 'https://evo001.atendejulia.com.br';
    }

    public function verificarStatus($instanceId)
    {
        $client = new Client();
        $apiKey = $this->apiKey;
        $baseUrl = $this->baseUrl;
        $url = "$baseUrl/instance/connectionState/$instanceId";
        $urlProfile = "$baseUrl/instance/fetchInstances";

        try {
            $response = $client->request('GET', $url, [
                'headers' => [
                    'apikey' => "$apiKey"
                ]
            ]);

            $profileName = 'Não Conectado';
            $profilePictureUrl = 'http://via.placeholder.com/120x120';

            $retunStatus = json_decode($response->getBody(), true);

            if (isset($retunStatus['instance']['state']) && $retunStatus['instance']['state'] === 'open') {

                $responseProfile = $client->request('GET', $urlProfile, [
                    'headers' => [
                        'apikey' => "$apiKey"
                    ]
                ]);

                $retunProfile = json_decode($responseProfile->getBody(), true);

                if (isset($retunProfile[0]['instance'])) {
                    $profileName = $retunProfile[0]['instance']['profileName'];
                    $profilePictureUrl = $retunProfile[0]['instance']['profilePictureUrl'];
                }

            }

            return response()->json([
                'profileName' => $profileName,
                'profilePictureUrl' => $profilePictureUrl
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function createInstance($instanceName, $token)
    {
        $client = new Client([
            'verify' => false  // Desabilita verificação SSL temporariamente
        ]);

        $apiKey = $this->apiKey;
        $baseUrl = $this->baseUrl;
        $url = "$baseUrl/instance/create";

        try {
            // Log para debug
            \Log::info('Evolution API Request:', [
                'url' => $url,
                'instanceName' => $instanceName,
                'token' => $token
            ]);

            $response = $client->request('POST', $url, [
                'headers' => [
                    'apikey' => "$apiKey",
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'instanceName' => $instanceName,
                    'qrcode' => true,
                    'integration' => 'WHATSAPP-BAILEYS',
                    'token' => $token ?? Str::uuid()->toString(),
                    "groupsIgnore"=> false,
                    "webhook"=> [
                        "url"=> "https://webhook.atendejulia.com.br/webhook/ia-julia-v7-1",
                        "events"=> [
                            "MESSAGES_UPSERT"
                        ]
                    ],
                ],
                'timeout' => 30, // Aumenta o timeout
                'connect_timeout' => 30
            ]);

            $result = json_decode($response->getBody(), true);

            // Log da resposta
            \Log::info('Evolution API Response:', $result);

            return response()->json($result, 200);

        } catch (\GuzzleHttp\Exception\RequestException $e) {
            \Log::error('Evolution API Error:', [
                'message' => $e->getMessage(),
                'url' => $url,
                'response' => $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : null
            ]);

            return response()->json([
                'success' => false,
                'message' => "Erro na conexão com Evolution API: " . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Evolution API General Error:', [
                'message' => $e->getMessage(),
                'url' => $url
            ]);

            return response()->json([
                'success' => false,
                'message' => "Erro geral: " . $e->getMessage()
            ], 500);
        }
    }
}
