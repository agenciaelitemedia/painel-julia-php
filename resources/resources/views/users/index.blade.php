@extends('layouts.app')
@section('title')
    Users Management
@endsection
@section('content')

    <x-page-title title="Users" subtitle="Management" />

    <div class="row g-3">
        <div class="col-auto">
            <div class="position-relative">
                <input class="form-control px-5" type="search" placeholder="Search Users">
                <span class="material-icons-outlined position-absolute ms-3 translate-middle-y start-0 top-50 fs-5">search</span>
            </div>
        </div>
        <div class="col-auto">
            <div class="d-flex align-items-center gap-2 justify-content-lg-end">
                <a href="{{ route('users.create') }}" class="btn btn-primary px-4">
                    <i class="bi bi-plus-lg me-2"></i>Add User
                </a>
            </div>
        </div>
    </div>

    <div class="card mt-4">
        <div class="card-body">
            <div class="table-responsive white-space-nowrap">
                <table class="table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($users as $user)
                            <tr>
                                <td>{{ $user->name }}</td>
                                <td>{{ $user->email }}</td>
                                <td>{{ $user->role }}</td>
                                <td>{{ $user->created_at }}</td>
                                <td>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-filter dropdown-toggle dropdown-toggle-nocaret"
                                            type="button" data-bs-toggle="dropdown">
                                            <i class="bi bi-three-dots"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li>
                                                <a class="dropdown-item" href="{{ route('users.edit', $user) }}">Edit</a>
                                            </li>
                                            <li>
                                                <form action="{{ route('users.destroy', $user) }}" method="POST">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="dropdown-item"
                                                            onclick="return confirm('Are you sure?')">Delete</button>
                                                </form>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
