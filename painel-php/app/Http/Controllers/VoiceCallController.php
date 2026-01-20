<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class VoiceCallController extends Controller
{
    public function makeCall(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . config('services.velip.token')
            ])->post('https://vox.velip.com.br/api/v2/MakeTTSCall', [
                'type' => '0',
                'content' => $request->content,
                'priority' => '0',
                'free' => '1',
                'dest' => $request->dest,
                'nome' => $request->nome ?? ''
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
