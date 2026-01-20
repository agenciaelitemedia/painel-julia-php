<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-bs-theme="blue-theme">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>JulIA - Seu escritório Inteligente com Agentes Inteligentes</title>
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="{{ URL::asset('build/images/favicon-32x32.png') }}" type="image/png">

    @include('layouts.head-css')
    
</head>

<body>

    @include('layouts.topbar')

    @include('layouts.sidebar')

    <!--start main wrapper-->
    <main class="main-wrapper" style="margin-top: 0px!important;">
        <div class="main-content">
            @yield('content')
        </div>
    </main>

    <!--start overlay-->
    <div class="overlay btn-toggle"></div>
    <!--end overlay-->


    <script>
        // Aguarda o carregamento completo da página
        window.addEventListener('load', function() {
            // Seleciona o elemento com a classe _poweredBy_me40k_322
            const elemento = document.querySelector('._poweredBy_me40k_322');
            // Verifica se o elemento existe
            if (elemento) {
                // Esconde o elemento
                elemento.style.display = 'none';
            }
        });
    </script>
    
    @include('layouts.common-scripts')
    

</body>

</html>
