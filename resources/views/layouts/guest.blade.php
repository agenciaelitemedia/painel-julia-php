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

<body class="{{ isset($bodyClass) ? $bodyClass : '' }}">

    @yield('content')

    @include('layouts.common-scripts')
</body>

</html>
