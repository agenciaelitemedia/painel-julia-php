<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\FollowupConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FollowupIaController extends Controller
{
    public function index()
    {
        $config = FollowupConfig::where('cod_agent', Auth::user()->cod_agent)->first();
        return view('settings.followup-ia.index', compact('config'));
    }

    public function store(Request $request)
    {
        // try {
            // Validação inicial dos campos
            $request->validate([
                'auto_message' => 'boolean',
                'start_hours' => 'required|integer|between:0,23',
                'end_hours' => 'required|integer|between:0,23',
                'step_cadence' => 'required|array',
                'msg_cadence' => 'required|array',
                'title_cadence' => 'required|array',
            ]);

            // Monta o step_cadence combinando value e unit
            $stepCadence = [];
            $msgCadence = [];
            $titleCadence = [];
            $count = 0;
            foreach ($request->step_cadence as $index => $value) {

                $key = 'cadence_' . ($count + 1);
                $stepCadence[$key] = $request->step_cadence[$index];
                $msgCadence[$key] = $request->msg_cadence[$index];
                $titleCadence[$key] = $request->title_cadence[$index];
                $count++;
            }

            // Salva os dados
            FollowupConfig::updateOrCreate(
                ['cod_agent' => Auth::user()->cod_agent],
                [
                    'auto_message' => $request->boolean('auto_message'),
                    'start_hours' => $request->start_hours,
                    'end_hours' => $request->end_hours,
                    'step_cadence' => ($stepCadence),
                    'msg_cadence' => ($msgCadence),
                    'title_cadence' => ($titleCadence),
                    'followup_from' => $request->followup_from,
                    'followup_to' => $request->followup_to,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Configuração salva com sucesso!'
            ]);
        // } catch (\Exception $e) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Erro ao salvar configuração: ' . $e->getMessage()
        //    ], 422);
        // }
    }


}
