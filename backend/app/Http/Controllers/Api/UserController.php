<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::select('id', 'outlet_id', 'name', 'email', 'phone', 'pin_code', 'role', 'is_active', 'created_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'pin_code' => 'required|string|size:6',
            'role' => 'required|in:super_admin,manager,cashier,bartender',
            'password' => 'nullable|string|min:6',
        ]);

        $user = User::create([
            'outlet_id' => 1,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'pin_code' => $validated['pin_code'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password'] ?? '123456'),
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Karyawan / Kasir baru berhasil didaftarkan!',
            'data' => $user
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:30',
            'pin_code' => 'sometimes|string|size:6',
            'role' => 'sometimes|in:super_admin,manager,cashier,bartender',
            'is_active' => 'sometimes|boolean',
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data kasir / karyawan berhasil diperbarui!',
            'data' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        if ($user->role === 'super_admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Super Admin utama tidak dapat dihapus!'
            ], 403);
        }

        $user->update(['is_active' => false]);

        return response()->json([
            'status' => 'success',
            'message' => 'Karyawan dinonaktifkan.'
        ]);
    }
}
