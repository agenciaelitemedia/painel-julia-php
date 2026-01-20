<?php

namespace App\Traits;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

trait HandlesEvolution
{


    public function verificarStatus($instanceId, $apiKey, $urlEvo)
    {
        $client = new Client();

        $urlDefault = $urlEvo;

        $url = "https://$urlDefault/instance/connectionState/$instanceId"; // Substitua pela URL correta da API
        $urlProfile = "https://$urlDefault/instance/fetchInstances";


        try {
            $response = $client->request('GET', $url, [
                'headers' => [
                    'apikey' => "$apiKey"
                ]
            ]);

            $profileName = 'Não Conectado';
            $profilePictureUrl = 'http://via.placeholder.com/120x120';
            $profileNumber = '---';
            $profileStatus = 'close';

            $retunStatus = json_decode($response->getBody(), true);

            if (isset($retunStatus['instance']['state']) && $retunStatus['instance']['state'] === 'open') {

                $responseProfile = $client->request('GET', $urlProfile, [
                    'headers' => [
                        'apikey' => "$apiKey"
                    ]
                ]);

                $retunProfile = json_decode($responseProfile->getBody(), true);

                if (isset($retunProfile[0])) {
                    $profileName = $retunProfile[0]['profileName'];
                    $profilePictureUrl = $retunProfile[0]['profilePicUrl'];
                    $profileNumber =  preg_replace('/\D/', '', $retunProfile[0]['ownerJid']);
                    $profileStatus = $retunProfile[0]['connectionStatus'];
                }
            }

            return [
                'profileName' => $profileName,
                'profilePictureUrl' => $profilePictureUrl,
                'profileNumber' => $profileNumber,
                'profileStatus' => $profileStatus
            ];
        } catch (\Exception $e) {
            return [
                'profileName' => 'Erro ao conectar',
                'profilePictureUrl' => 'http://via.placeholder.com/120x120',
                'profileNumber' => '---',
                'profileStatus' => 'close',
                'error' => $e->getMessage()
            ];
        }
    }

    public function gerarQRCode($instanceId, $apiKey, $urlEvo)
    {
        $client = new Client();

        $urlDefault = $urlEvo;

        $urlState = "https://$urlDefault/instance/connectionState/$instanceId";
        $urlRestart = "https://$urlDefault/instance/logout/$instanceId";
        $url = "https://$urlDefault/instance/connect/$instanceId";

        try {

            $response = $client->request('GET', $urlState, [
                'headers' => [
                    'apikey' => "$apiKey"
                ]
            ]);
            $retunStatus = json_decode($response->getBody(), true);

            if (isset($retunStatus['instance']['state']) && $retunStatus['instance']['state'] !== 'open') {

                if ($retunStatus['instance']['state'] !== 'close') {
                    $response = $client->request('DELETE', $urlRestart, [
                        'headers' => [
                            'apikey' => "$apiKey"
                        ]
                    ]);
                }

                $response = $client->request('GET', $url, [
                    'headers' => [
                        'apikey' => "$apiKey"
                    ]
                ]);

                $retunStatus = json_decode($response->getBody(), true);

                return $retunStatus;
            }

            return array('pairingCode' => 'connected');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function findGroups($instanceId, $apiKey, $urlEvo, $participants = 'false')
    {
        $client = new Client();
        $urlDefault = $urlEvo;
        $url = "https://$urlDefault/group/fetchAllGroups/$instanceId?getParticipants=$participants";

        try {
            $response = $client->request('GET', $url, [
                'headers' => [
                    'apikey' => "$apiKey"
                ]
            ]);

            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
