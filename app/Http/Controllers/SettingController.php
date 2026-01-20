<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Traits\HandlesSettings;
use App\Models\ViewClient;
use App\Models\Agent;
use Illuminate\Support\Facades\Auth;
use App\Traits\HandlesEvolution;

class SettingController extends Controller
{
    use HandlesSettings, HandlesEvolution;

    public function __construct()
    {
        $this->middleware('auth');
    }
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function personalize()
    {

        $codAgent = Auth::user()->cod_agent;
        $user = Auth::user();
        $client = ViewClient::selectClientByCodAgent($codAgent);
        $agents = Agent::selectClientByCodClient($codAgent);
        $settings = $agents->settings;
        $dataGroups = $this->findGroups(Auth::user()->evo_instance, Auth::user()->evo_apikey, Auth::user()->evo_url) ;
        dd($dataGroups);
        //$dataGroups = collect($dataGroups)->sortBy('subject')->values()->all();
        if (isset($dataGroups->original['success']) && $dataGroups->original['success'] === false) {
            $dataGroups = [];
        }
/*
array:3 [▼ // app/Http/Controllers/SettingController.php:34
  0 => array:12 [▼
    "id" => "120363368507645137@g.us"
    "subject" => "Notificação em Grupo"
    "subjectOwner" => "553488860163@s.whatsapp.net"
    "subjectTime" => 1732403185
    "pictureUrl" => "
https://pps.whatsapp.net/v/t61.24694-24/467633310_374741638993538_3712849514184223135_n.jpg?ccb=11-4&oh=01_Q5AaIAXospVPeOnkIeIbG_z0Pje_G3FxIIKOSK1AqpJcdiB-&oe=6
 ▶
"
    "size" => 2
    "creation" => 1732400578
    "owner" => "553488860163@s.whatsapp.net"
    "restrict" => false
    "announce" => false
    "isCommunity" => false
    "isCommunityAnnounce" => false
  ]
  1 => array:12 [▼
    "id" => "556194402560-1522256726@g.us"
    "subject" => "Mídias/Files"
    "subjectTime" => 1522256726
    "pictureUrl" => "
https://pps.whatsapp.net/v/t61.24694-24/212379526_101139295555310_7398956540195719922_n.jpg?ccb=11-4&oh=01_Q5AaIMKMPatmJTWINI0snW18s6ofssKku1GATwXR9aS3YXS2&oe=6
 ▶
"
    "size" => 2
    "creation" => 1522256726
    "desc" => "Meus arquivos pessoais compartilhados comigo mesmo."
    "descId" => "3EB0A88C477BD9FEC8DB"
    "restrict" => true
    "announce" => false
    "isCommunity" => false
    "isCommunityAnnounce" => false
  ]
  2 => array:12 [▼
    "id" => "120363367122755682@g.us"
    "subject" => "JURIS - CONTRATOS EM CURSO"
    "subjectOwner" => "558499506625@s.whatsapp.net"
    "subjectTime" => 1735294745
    "pictureUrl" => null
    "size" => 3
    "creation" => 1735294745
    "owner" => "558499506625@s.whatsapp.net"
    "restrict" => false
    "announce" => false
    "isCommunity" => false
    "isCommunityAnnounce" => false
  ]
]
*/
        return view('julia.agent-configuration', compact('client','user', 'agents', 'settings', 'dataGroups'));
    }

    // Função para atualizar as configurações
    public function updatePersonalize(Request $request)
    {

        // Usar a trait para salvar as configurações
        $result = $this->saveSettingsPersonalize($request);

        // Verificar se a atualização foi bem-sucedida
        if ($result) {
            return redirect()->route('aiagents.personalize')->with('success', 'Configurações atualizadas com sucesso!');
        } else {
            return redirect()->route('aiagents.personalize')->with('error', 'Falha ao atualizar as configurações.');
        }
    }

    // Função para atualizar as configurações
    public function updateSettingsCampaigns(Request $request)
    {

        // Usar a trait para salvar as configurações
        $result = $this->saveSettingsCampaigns($request);

        // Verificar se a atualização foi bem-sucedida
        if ($result) {
            return redirect()->route('aiagents.personalize')->with('success', 'Configurações atualizadas com sucesso!');
        } else {
            return redirect()->route('aiagents.personalize')->with('error', 'Falha ao atualizar as configurações.');
        }
    }

}
