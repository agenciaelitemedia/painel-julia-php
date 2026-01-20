@extends('layouts.guest')
@section('title')
    Login
@endsection
@section('content')
    <div class="section-authentication-cover">
        <div class="">
            <div class="row g-0">
                <div
                    class="col-12 col-xl-7 col-xxl-8 auth-cover-left align-items-center justify-content-center d-none d-xl-flex border-end bg-transparent">

                    <div class="card rounded-0 mb-0 border-0 shadow-none bg-transparent bg-none">
                        <div class="card-body">
                            <img src="{{ URL::asset('build/images/auth/login1.png') }}" class="img-fluid auth-img-cover-login"
                                width="650" alt="">
                        </div>
                    </div>

                </div>

                <div
                    class="col-12 col-xl-5 col-xxl-4 auth-cover-right align-items-center justify-content-center border-top border-4 border-primary border-gradient-1">
                    <div class="card rounded-0 m-3 mb-0 border-0 shadow-none bg-none">
                        <div class="card-body p-sm-5">
                            <img src="{{ URL::asset('build/images/logo_julia.png') }}" class="mb-4" width="145"
                                alt="">
                            <h4 class="fw-bold">Começe Agora</h4>
                            <p class="mb-0">Insira suas credenciais para acessar sua conta.</p>


                            <div class="form-body mt-4">
                                <form method="POST" action="{{ route('login') }}" class="row g-3">
                                    @csrf

                                    <div class="col-12">
                                        <label for="email" class="form-label">Email <span
                                                class="text-danger">*</span></label>
                                        <input type="email" class="form-control @error('email') is-invalid @enderror"
                                            id="email" name="email" placeholder="seuemail@exemplo.com.br" value="{{ old('email') }}"
                                            required autocomplete="email" autofocus>

                                        @error('email')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                    <div class="col-12">
                                        <label for="password" class="form-label">Senha <span
                                                class="text-danger">*</span></label>
                                        <div class="input-group" id="show_hide_password">
                                            <input type="password" type="password"
                                                class="form-control @error('password') is-invalid @enderror" name="password"
                                                required autocomplete="current-password" placeholder="Entre com sua senha">
                                            <a href="javascript:void(0);" class="input-group-text bg-transparent"><i
                                                    class="bi bi-eye-slash-fill"></i></a>

                                            @error('password')
                                                <span class="invalid-feedback" role="alert">
                                                    <strong>{{ $message }}</strong>
                                                </span>
                                            @enderror
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="checkbox"
                                                {{ old('remember') ? 'checked' : '' }}>
                                            <label class="form-check-label" for="checkbox">Lembrar-se</label>
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <div class="d-grid">
                                            <button type="submit" class="btn btn-grd-primary">
                                                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                                <span class="button-text">Acessar</span>
                                            </button>
                                        </div>
                                    </div>


                                </form>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@push('script')
    <script>
        $(document).ready(function() {
            $("#show_hide_password a").on('click', function(event) {
                event.preventDefault();
                if ($('#show_hide_password input').attr("type") == "text") {
                    $('#show_hide_password input').attr('type', 'password');
                    $('#show_hide_password i').addClass("bi-eye-slash-fill");
                    $('#show_hide_password i').removeClass("bi-eye-fill");
                } else if ($('#show_hide_password input').attr("type") == "password") {
                    $('#show_hide_password input').attr('type', 'text');
                    $('#show_hide_password i').removeClass("bi-eye-slash-fill");
                    $('#show_hide_password i').addClass("bi-eye-fill");
                }
            });

            $('form').on('submit', function() {
                const button = $(this).find('button[type="submit"]');
                const spinner = button.find('.spinner-border');
                const buttonText = button.find('.button-text');

                spinner.removeClass('d-none');
                buttonText.text('Processando...');
                button.prop('disabled', true);
            });
        });
    </script>
@endpush
