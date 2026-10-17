<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PosTable;

class TableController extends Controller
{
    public function index()
    {
        $tables = PosTable::where('is_active', true)->orderBy('section')->get();
        return response()->json([
            'status' => 'success',
            'data' => $tables
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_number' => 'required|string|max:30|unique:tables,table_number',
            'section' => 'required|string|max:50',
            'capacity' => 'required|integer|min:1',
        ]);

        $table = PosTable::create([
            'table_number' => $validated['table_number'],
            'section' => $validated['section'],
            'capacity' => $validated['capacity'],
            'status' => 'available',
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Meja / Bar Seat berhasil ditambahkan!',
            'data' => $table
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $table = PosTable::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:available,occupied,reserved,open_tab',
            'current_guest_name' => 'nullable|string',
        ]);

        $table->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Status meja diperbarui!',
            'data' => $table
        ]);
    }
}
