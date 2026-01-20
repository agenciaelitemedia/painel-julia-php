<?php

namespace App\Http\Controllers;

use App\Models\LegalCase;
use Illuminate\Http\Request;

class LegalCaseController extends Controller
{
    public function index(Request $request)
    {
        $cases = LegalCase::query()
            ->filterByType($request->type)
            ->filterByName($request->name)
            ->orderBy('created_at', 'desc')
            ->get();

        $types = $this->getTypes();

        return view('legal-cases.index', compact('cases', 'types'));
    }

    public function create()
    {
        $types = $this->getTypes();
        return view('legal-cases.create', compact('types'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'name' => 'required|string|max:100',
            'questions' => 'required|string'
        ]);

        LegalCase::create($validated);

        return redirect()
            ->route('legal-cases.index')
            ->with('success', 'Caso legal criado com sucesso!');
    }

    public function edit(LegalCase $legalCase)
    {
        $types = $this->getTypes();
        return view('legal-cases.edit', compact('legalCase', 'types'));
    }

    public function update(Request $request, LegalCase $legalCase)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'name' => 'required|string|max:100',
            'questions' => 'required|string'
        ]);

        $legalCase->update($validated);

        return redirect()
            ->route('legal-cases.index')
            ->with('success', 'Caso legal atualizado com sucesso!');
    }

    public function destroy(LegalCase $legalCase)
    {
        $legalCase->delete();

        return redirect()
            ->route('legal-cases.index')
            ->with('success', 'Caso legal excluído com sucesso!');
    }

    private function getTypes()
    {
        return collect([
            'BANCÁRIO',
            'FAMÍLIA',
            'PREVIDENCIÁRIO',
            'TRABALHISTA'
        ])->sort()->values();
    }
}
