<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return view('users.index', compact('users'));
    }

    public function create()
    {
        return view('users.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|unique:users|max:191',
            'password' => 'required|min:6',
            'role' => 'required|in:user,admin',
            'cod_agent' => 'nullable|numeric',
            'evo_url' => 'nullable|string|max:100',
            'evo_instance' => 'nullable|string|max:50',
            'evo_apikey' => 'nullable|string|max:50',
            'data_mask' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);

        return redirect()->route('users.index')->with('success', 'User created successfully');
    }

    public function edit(User $user)
    {
        return view('users.edit', compact('user'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id), 'max:191'],
            'role' => 'required|in:user,admin',
            'cod_agent' => 'nullable|numeric',
            'evo_url' => 'nullable|string|max:100',
            'evo_instance' => 'nullable|string|max:50',
            'evo_apikey' => 'nullable|string|max:50',
            'data_mask' => 'boolean',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return redirect()->route('users.index')->with('success', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('users.index')->with('success', 'User deleted successfully');
    }
} 
