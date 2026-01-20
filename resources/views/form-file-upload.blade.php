@extends('layouts.app')
@section('title')
    File Upload
@endsection
@push('css')
    <link href="{{ URL::asset('build/plugins/fancy-file-uploader/fancy_fileupload.css') }}" rel="stylesheet">
    <link href="{{ URL::asset('build/plugins/Drag-And-Drop/dist/imageuploadify.min.css') }}" rel="stylesheet">
@endpush
@section('content')
    <x-page-title title="Form" subtitle="File Upload" />

    <div class="row">
        <div class="col-xl-9 mx-auto">
            <h6 class="mb-0 text-uppercase">Fancy File Upload</h6>
            <hr>
            <div class="card">
                <div class="card-body">
                    <input id="fancy-file-upload" type="file" name="files" accept=".jpg, .png, image/jpeg, image/png"
                        multiple>
                </div>
            </div>
        </div>
    </div>
    <!--end row-->
    <div class="row">
        <div class="col-xl-9 mx-auto">
            <h6 class="mb-0 text-uppercase">Image Uploadify</h6>
            <hr>
            <div class="card">
                <div class="card-body">
                    <form>
                        <input id="image-uploadify" type="file"
                            accept=".xlsx,.xls,image/*,.doc,audio/*,.docx,video/*,.ppt,.pptx,.txt,.pdf" multiple>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!--end row-->
@endsection
@push('script')
    <!--plugins-->
    <script src="{{ URL::asset('build/plugins/perfect-scrollbar/js/perfect-scrollbar.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/metismenu/metisMenu.min.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/fancy-file-uploader/jquery.ui.widget.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/fancy-file-uploader/jquery.fileupload.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/fancy-file-uploader/jquery.iframe-transport.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/fancy-file-uploader/jquery.fancy-fileupload.js') }}"></script>
    <script src="{{ URL::asset('build/plugins/Drag-And-Drop/dist/imageuploadify.min.js') }}"></script>
    <script>
        $('#fancy-file-upload').FancyFileUpload({
            params: {
                action: 'fileuploader'
            },
            maxfilesize: 1000000
        });
    </script>
    <script>
        $(document).ready(function() {
            $('#image-uploadify').imageuploadify();
        })
    </script>
    <script src="{{ URL::asset('build/plugins/simplebar/js/simplebar.min.js') }}"></script>
    <script src="{{ URL::asset('build/js/main.js') }}"></script>
@endpush
