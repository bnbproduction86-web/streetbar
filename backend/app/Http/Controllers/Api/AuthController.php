<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Fast Touchscreen Cashier Login via 6-digit PIN
     */
    public function pinLogin(Request $request)
    {
        $validated = $request->validate([
            'pin_code' => 'required|string|size:6',
        ]);

        $user = User::where('pin_code', $validated['pin_code'])
            ->where('is_active', true)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'PIN salah atau akun tidak aktif!',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil!',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'outlet_id' => $user->outlet_id,
                ]
            ]
        ]);
    }

    /**
     * Standard Email/Password Login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau kata sandi tidak cocok!',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil!',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'outlet_id' => $user->outlet_id,
                ]
            ]
        ]);
    }

    /**
     * List all staff cashiers for touchscreen selector
     */
    public function getStaffList()
    {
        $staff = User::where('is_active', true)
            ->select('id', 'name', 'role', 'avatar_url')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $staff
        ]);
    }
}
