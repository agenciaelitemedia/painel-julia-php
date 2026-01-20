<?php

use App\Http\Controllers\EvolutionController;
use App\Http\Controllers\JuliaController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadCampanhaController;
use App\Http\Controllers\Settings\FollowupIaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\ArquivoController;
use App\Http\Controllers\FinanceiroController;
use App\Http\Controllers\LegalCaseController;
use App\Http\Controllers\CriativoController;
use App\Http\Controllers\CategoriaCriativoController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\PersonalizacaoController;
use App\Http\Controllers\ProdutoClienteController;
use App\Http\Controllers\ContratoProdutoClienteController;


Auth::routes();

Route::get('/verificar-status/{instanceId}', [EvolutionController::class, 'verificarStatus']);

#Route::get('/aiagents/onboard', [JuliaController::class, 'onboard'])->name('aiagents.onboard');
#Route::get('/aiagents/qrcode', [JuliaController::class, 'qrcode'])->name('aiagents.qrcode');

#Route::put('/aiagents/agent/{uuid}/{agentId}/settings', [JuliaController::class, 'updateSettings'])->name('aiagents.agent.updateSettings');




Route::get('/linkstorage', [App\Http\Controllers\HomeController::class, 'linkstorage']);

Route::middleware([App\Http\Middleware\CheckPaymentStatus::class, 'auth'])->group(function () {
    Route::get('/', [JuliaController::class, 'onboard'])->name('aiagents.onboard');
    Route::get('/aiagents/onboard', [JuliaController::class, 'onboard'])->name('aiagents.onboard');
    Route::get('/aiagents/qrcode', [JuliaController::class, 'qrcode'])->name('aiagents.qrcode');
    Route::get('/aiagents/followup', [JuliaController::class, 'followup'])->name('aiagents.followup');
    Route::get('/aiagents/personalize', [SettingController::class, 'personalize'])->name('aiagents.personalize');
    Route::put('/aiagents/personalize', [SettingController::class, 'updatePersonalize'])->name('aiagents.personalize.update');
    Route::get('/notification/leads-chart', [NotificationController::class, 'leadsChart'])->name('notification.leads-chart');
    Route::get('/leads/contracts', [LeadController::class, 'contracts'])->name('leads.contracts');
    Route::get('/leads/my-contracts', [LeadController::class, 'myContracts'])->name('leads.my-contracts');
    Route::get('leads/contracts/export-pdf', [LeadController::class, 'exportPdf'])->name('leads.contracts.export-pdf');
    Route::get('leads/contracts/export-excel', [LeadController::class, 'exportExcel'])->name('leads.contracts.export-excel');
    Route::post('/julia/update-data-mask', [JuliaController::class, 'updateDataMask'])->name('julia.update-data-mask');
    Route::get('/leads/campaign', [LeadCampanhaController::class, 'index'])->name('leads.campaign');
    Route::get('/leads/source-stats', [LeadCampanhaController::class, 'sourceStats'])->name('leads.source-stats');

    //CRM
    Route::get('/crm', [CrmController::class, 'index'])->name('crm');
    Route::get('/crm/search_agent', [CrmController::class, 'searchAgent'])->name('crm.search_agent');

    Route::get('/settings/followup-ia', [FollowupIaController::class, 'index'])->name('settings.followup-ia.index');
    Route::post('/settings/followup-ia', [FollowupIaController::class, 'store'])->name('settings.followup-ia.store');
    Route::get('/settings/followup-ia/row', [FollowupIaController::class, 'getRow'])->name('settings.followup-ia.row');

    Route::resource('users', UserController::class);

    Route::get('/agents', [AgentController::class, 'index'])->name('agents.index');
    Route::get('/agents/create', [AgentController::class, 'create'])->name('agents.create');
    Route::post('/agents', [AgentController::class, 'store'])->name('agents.store');
    Route::get('/agents/{id}/edit', [AgentController::class, 'edit'])->name('agents.edit');
    Route::put('/agents/{id}', [AgentController::class, 'update'])->name('agents.update');

    //PERSONALIZACAO
    //Route::get('/personalizacao', [PersonalizacaoController::class, 'index'])->name('personalizacao.index');


    Route::get('/personalizacao/list', [PersonalizacaoController::class, 'list'])->name('personalizacao.list');
    Route::get('/personalizacao', [PersonalizacaoController::class, 'index'])->name('personalizacao.index');
    Route::post('/personalizacao', [PersonalizacaoController::class, 'store'])->name('personalizacao.store');
    Route::put('/personalizacao/{id}', [PersonalizacaoController::class, 'update'])->name('personalizacao.update');

    Route::post('/personalizacao/store', [PersonalizacaoController::class, 'store'])->name('personalizacao.store');
    Route::post('/personalizacao/search', [PersonalizacaoController::class, 'search'])->name('personalizacao.search');
    Route::post('/personalizacao/delete', [PersonalizacaoController::class, 'delete'])->name('personalizacao.delete');

    //PRODUTOS CLIENTES 
    Route::delete('/contrato-produto/{id}', [ContratoProdutoClienteController::class, 'destroy'])->name('contrato-produto.destroy');
    Route::post('/contrato-produto', [ContratoProdutoClienteController::class, 'store'])->name('contrato-produto.store');
    Route::post('/produto-cliente/search', [ProdutoClienteController::class, 'search'])->name('produto-cliente.search');
    Route::get('/produto-cliente/{produto_id}', [ProdutoClienteController::class, 'editar'])->name('produto-cliente.editar');
    Route::post('/produto-cliente', [ProdutoClienteController::class, 'store'])->name('produto-cliente.store');
    Route::post('/produto-cliente/delete', [ProdutoClienteController::class, 'delete'])->name('produto-cliente.delete');
    //Route::put('/produto-cliente/update', [ProdutoClienteController::class, 'update'])->name('produto-cliente.update');
    Route::put('/produto-cliente/{produtoCliente}', [ProdutoClienteController::class, 'update'])->name('produto-cliente.update');


    //PRODUTOS
    Route::get('/produtos', [ProdutoController::class, 'index'])->name('produtos.index');
    Route::get('/produtos/{id}', [ProdutoController::class, 'editar'])->name('produtos.editar');
    Route::post('/produtos/store', [ProdutoController::class, 'store'])->name('produtos.store');
    Route::put('/produtos/{id}', [ProdutoController::class, 'update'])->name('produtos.update');
    Route::post('/produtos/search', [ProdutoController::class, 'search'])->name('produtos.search');
    Route::post('/produtos/delete', [ProdutoController::class, 'delete'])->name('produtos.delete');

    //ARQUIVOS
    Route::get('/arquivos', [ArquivoController::class, 'index'])->name('arquivos.index');
    Route::get('/arquivos/list', [ArquivoController::class, 'list'])->name('arquivos.list');
    Route::post('/arquivos/upload', [ArquivoController::class, 'upload'])->name('arquivos.upload');
    Route::post('/arquivos/search', [ArquivoController::class, 'search'])->name('arquivos.search');
    Route::post('/arquivos/delete', [ArquivoController::class, 'delete'])->name('arquivos.delete');

    Route::get('/criativos/categorias', [CategoriaCriativoController::class, 'index'])->name('categorias.criativos.index');
    Route::post('/criativos/categorias/store', [CategoriaCriativoController::class, 'store'])->name('categorias.criativos.store');
    Route::post('/criativos/categorias/delete', [CategoriaCriativoController::class, 'delete'])->name('categorias.delete');
    Route::post('/criativos/categorias/edit', [CategoriaCriativoController::class, 'edit'])->name('categorias.criativos.edit');
    Route::get('/criativos/create', [CriativoController::class, 'create'])->name('criativos.create');
    Route::get('/criativos/{criativo_id}/edit', [CriativoController::class, 'edit'])->name('criativos.edit');
    Route::post('/criativos/{criativo_id}', [CriativoController::class, 'update'])->name('criativos.update');
    Route::get('/criativos', [CriativoController::class, 'index'])->name('criativos.index');
    Route::post('/criativos/upload', [CriativoController::class, 'upload'])->name('criativos.upload');
    Route::post('/criativos/search', [CriativoController::class, 'search'])->name('criativos.search');
    Route::post('/criativos/delete', [CriativoController::class, 'delete'])->name('criativos.delete');

    // Rotas do Financeiro
    Route::prefix('financeiro')->group(function () {
        Route::get('/', [FinanceiroController::class, 'cobrancas'])->name('financeiro.index');
        Route::get('/cobrancas', [FinanceiroController::class, 'cobrancas'])->name('financeiro.cobrancas');
        Route::get('/cobrancas/criar', [FinanceiroController::class, 'criarCobranca'])->name('financeiro.cobrancas.criar');
        Route::post('/cobrancas/store', [FinanceiroController::class, 'storeCobranca'])->name('financeiro.cobrancas.store');
        Route::get('/cobrancas/{id}', [FinanceiroController::class, 'showCobranca'])->name('financeiro.cobrancas.show');
        Route::delete('/cobrancas/{id}', [FinanceiroController::class, 'deleteCobranca'])->name('financeiro.cobrancas.delete');
        Route::get('/clientes', [FinanceiroController::class, 'clientes'])->name('financeiro.clientes');
        Route::get('/clientes/criar', [FinanceiroController::class, 'criarCliente'])->name('financeiro.clientes.criar');
        Route::post('/clientes/store', [FinanceiroController::class, 'storeCliente'])->name('financeiro.clientes.store');
    });

    Route::resource('legal-cases', LegalCaseController::class);
});


Route::get('/gerar-senha', function (\Illuminate\Http\Request $request) {
    $senha = $request->query('pass');

    if (!$senha) {
        return response()->json(['erro' => 'A senha é obrigatória'], 400);
    }

    $senhaCriptografada = Hash::make($senha);

    return response()->json(['senha_criptografada' => $senhaCriptografada]);
});
