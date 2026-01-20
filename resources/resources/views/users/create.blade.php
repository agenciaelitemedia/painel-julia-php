@extends('layouts.app')
@section('title')
    Create User
@endsection
@section('content')
    <x-page-title title="Users" subtitle="Create New User" />

    <div class="card">
        <div class="card-body">
            <form action="{{ route('users.store') }}" method="POST">
                @csrf
                <div class="mb-3">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror"
                           name="name" value="{{ old('name') }}" required>
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control @error('email') is-invalid @enderror"
                           name="email" value="{{ old('email') }}" required>
                    @error('email')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control @error('password') is-invalid @enderror"
                           name="password" required>
                    @error('password')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label class="form-label">Role</label>
                    <select class="form-select @error('role') is-invalid @enderror" name="role" required>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    @error('role')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <!-- Additional fields -->
                <div class="mb-3">
                    <label class="form-label">Agent Code</label>
                    <input type="number" class="form-control" name="cod_agent" value="{{ old('cod_agent') }}">
                </div>

                <div class="mb-3">
                    <label class="form-label">EVO URL</label>
                    <input type="text" class="form-control" name="evo_url" value="{{ old('evo_url') }}">
                </div>

                <div class="mb-3">
                    <label class="form-label">EVO Instance</label>
                    <input type="text" class="form-control" name="evo_instance" value="{{ old('evo_instance') }}">
                </div>

                <div class="mb-3">
                    <label class="form-label">EVO API Key</label>
                    <input type="text" class="form-control" name="evo_apikey" value="{{ old('evo_apikey') }}">
                </div>

                <div class="mb-3">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" name="data_mask" value="1"
                               {{ old('data_mask') ? 'checked' : '' }}>
                        <label class="form-check-label">Data Mask</label>
                    </div>
                </div>

                <div class="text-end">
                    <button type="submit" class="btn btn-primary">Create User</button>
                </div>
            </form>
        </div>
    </div>
@endsection 
