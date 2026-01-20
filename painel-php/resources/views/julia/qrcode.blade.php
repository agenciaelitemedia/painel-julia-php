@php
    if( !is_null($qrcodeWhatsApp['pairingCode'] ) ){
        header("Location: ". route('aiagents.onboard'));
        exit();
    }
@endphp

@extends('layouts.app')
@section('title')
    QRCode
@endsection
@section('content')

    <x-page-title title="QRCode" subtitle="Conectar WhatsApp" />

    <div class="row">
        <div class="col-xl-4 col-xxl-4 d-flex align-items-stretch">
            <div class="card w-100 rounded-4">
                <div class="card-body">
                    <div class="text-center">
                        <h3>Conecte seu WhatsApp</h3>
                        <img src="{{ $qrcodeWhatsApp['base64'] }}" height="350" width="350">
                        <p class="mb-0 font-12">Aponte a camera do seu whatsapp </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xxl-8 d-flex align-items-stretch">
            <div class="card w-100 overflow-hidden rounded-4">
                <div class="card-body position-relative p-4">
                    <div class="row">
                        <div class="col-12 col-sm-12">
                            <h3>Conectar um dispositivo com QRCode</h3><br>
                                <h5>Android</h5>
                                    <ul>
                                        <li>Abra o WhatsApp no seu celular Android principal.</li>
                                        <li>Toque no ícone de mais opções e, em seguida, em Dispositivos conectados > Conectar um dispositivo.</li>
                                        <li>Desbloqueie seu celular principal:
                                                <br>- Se a autenticação biométrica estiver ativada, siga as instruções na tela.
                                                <br>- Se a autenticação biométrica não estiver ativada, informe o PIN usado para desbloquear o celular.</li>
                                        <li>Aponte seu celular Android para a tela do dispositivo que você deseja conectar para escanear o código QR</li>
                                    </ul>
                                    <h5>Iphone</h5>
                                    <ul>
                                        <li>Abra o WhatsApp no seu iPhone principal.</li>
                                        <li>Toque em Configurações > Dispositivos conectados > Conectar um dispositivo.</li>
                                        <li>Se você estiver usando o iOS 14 ou posterior, desbloqueie seu celular:
                                            <br>- Use o Touch ID ou o Face ID para desbloquear.
                                            <br>- Se a autenticação biométrica não estiver ativada, informe o código usado para desbloquear o celular
                                        </li>
                                        <li>Aponte seu celular para a tela do dispositivo que você deseja conectar para escanear o código QR.</li>
                                    </ul>
                                </p>
                        </div>
                    </div><!--end row-->
                </div>
            </div>
        </div>
    </div>
@endsection
@push('script')
    <script>
        setTimeout(function(){
            location.reload();
        }, 30000); // 50 segundos em milissegundos
    </script>
@endpush
