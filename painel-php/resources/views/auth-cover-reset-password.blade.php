@extends('layouts.guest')
@section('title')
    Reset Password
@endsection
@section('content')

    <!--authentication-->
    <div class="section-authentication-cover">
        <div class="">
            <div class="row g-0">

                <div
                    class="col-12 col-xl-7 col-xxl-8 auth-cover-left align-items-center justify-content-center d-none d-xl-flex border-end bg-transparent">

                    <div class="card rounded-0 mb-0 border-0 shadow-none bg-transparent bg-none">
                        <div class="card-body">
                            <img src="{{ URL::asset('build/images/auth/forgot-password1.png') }}" class="img-fluid auth-img-cover-login"
                                width="550" alt="">
                        </div>
                    </div>

                </div>

                <div class="col-12 col-xl-5 col-xxl-4 auth-cover-right align-items-center justify-content-center">
                    <div class="card rounded-0 m-3 mb-0 border-0 shadow-none bg-none">
                        <div class="card-body p-5">
                            <img src="{{ URL::asset('build/images/logo1.png') }}" class="mb-4" width="145" alt="">
                            <h4 class="fw-bold">Genrate New Password</h4>
                            <p class="mb-0">We received your reset password request. Please enter your new password!</p>
                            <div class="form-body mt-4">
                                <form class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label" for="NewPassword">New Password</label>
                                        <input type="text" class="form-control" id="NewPassword"
                                            placeholder="Enter new password">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label" for="ConfirmPassword">Confirm Password</label>
                                        <input type="text" class="form-control" id="ConfirmPassword"
                                            placeholder="Confirm password">
                                    </div>
                                    <div class="col-12">
                                        <div class="d-grid gap-2">
                                            <button type="button" class="btn btn-grd-branding">Change Password</button>
                                            <a href="{{ url('/auth-cover-login') }}" class="btn btn-grd-royal">Back to Login</a>
                                        </div>
                                    </div>
                                </form>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
            <!--end row-->
        </div>
    </div>
    <!--authentication-->

@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/js/jquery.min.js') }}"></script>

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
        });
    </script>
@endpush
