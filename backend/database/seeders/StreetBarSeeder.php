<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ModifierGroup;
use App\Models\ModifierItem;
use App\Models\PosTable;
use App\Models\Promotion;
use App\Models\Customer;
use App\Models\WorkShift;
use App\Models\CashMovement;
use App\Models\SystemSetting;

class StreetBarSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Outlet
        $outlet = Outlet::create([
            'id' => 1,
            'name' => 'Street Bar & Lounge',
            'legal_name' => 'PT Street Bar Hospitality',
            'phone' => '0812-8899-7766',
            'email' => 'contact@streetbar.id',
            'address' => 'Jl. Senopati No. 45, Jakarta Selatan',
            'tax_percentage' => 10.00,
            'service_percentage' => 5.00,
            'receipt_header' => "WELCOME TO STREET BAR\nCraft Cocktails & Culinary Vibe",
            'receipt_footer' => "Thank you for chilling with us!\nInstagram: @streetbar.jkt\nWiFi: StreetBarGuest / Pass: goldstreet2026",
            'currency_symbol' => 'Rp',
            'is_active' => true,
        ]);

        // 2. Settings
        SystemSetting::insert([
            ['setting_key' => 'printer_thermal_size', 'setting_value' => '80mm', 'category' => 'hardware', 'description' => 'Ukuran printer struk thermal: 58mm atau 80mm'],
            ['setting_key' => 'printer_auto_cut', 'setting_value' => 'true', 'category' => 'hardware', 'description' => 'Auto cut paper on print'],
            ['setting_key' => 'tax_enabled', 'setting_value' => 'true', 'category' => 'tax', 'description' => 'Aktifkan PB1 10%'],
            ['setting_key' => 'service_charge_enabled', 'setting_value' => 'true', 'category' => 'tax', 'description' => 'Aktifkan Service Charge 5%'],
            ['setting_key' => 'theme_gold_accent', 'setting_value' => '#D4AF37', 'category' => 'ui', 'description' => 'Warna gold aksen utama'],
        ]);

        // 3. Staff Users
        $admin = User::create([
            'outlet_id' => 1,
            'name' => 'Bramantyo (Owner)',
            'email' => 'admin@streetbar.id',
            'phone' => '081234567891',
            'password' => Hash::make('admin123'),
            'pin_code' => '112233',
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $manager = User::create([
            'outlet_id' => 1,
            'name' => 'Rian Satria (Manager)',
            'email' => 'manager@streetbar.id',
            'phone' => '081234567892',
            'password' => Hash::make('manager123'),
            'pin_code' => '998877',
            'role' => 'manager',
            'is_active' => true,
        ]);

        $cashier = User::create([
            'outlet_id' => 1,
            'name' => 'Nabila Putri (Kasir 1)',
            'email' => 'nabila@streetbar.id',
            'phone' => '081234567893',
            'password' => Hash::make('cashier123'),
            'pin_code' => '123456',
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $bartender = User::create([
            'outlet_id' => 1,
            'name' => 'Dimas Prayoga (Head Bartender)',
            'email' => 'dimas@streetbar.id',
            'phone' => '081234567894',
            'password' => Hash::make('bartender123'),
            'pin_code' => '556677',
            'role' => 'bartender',
            'is_active' => true,
        ]);

        // 4. Categories
        $catCocktails = Category::create(['id' => 1, 'name' => 'Signature Cocktails', 'slug' => 'signature-cocktails', 'icon' => 'martini', 'sort_order' => 1]);
        $catMocktails = Category::create(['id' => 2, 'name' => 'Mocktails & Chillers', 'slug' => 'mocktails-chillers', 'icon' => 'glass-water', 'sort_order' => 2]);
        $catBeers = Category::create(['id' => 3, 'name' => 'Beers & Draught', 'slug' => 'beers-draught', 'icon' => 'beer', 'sort_order' => 3]);
        $catSpirits = Category::create(['id' => 4, 'name' => 'Whiskey & Spirits', 'slug' => 'whiskey-spirits', 'icon' => 'wine', 'sort_order' => 4]);
        $catCoffee = Category::create(['id' => 5, 'name' => 'Artisan Coffee & Tea', 'slug' => 'coffee-tea', 'icon' => 'coffee', 'sort_order' => 5]);
        $catTapas = Category::create(['id' => 6, 'name' => 'Street Tapas & Bites', 'slug' => 'tapas-bites', 'icon' => 'utensils', 'sort_order' => 6]);
        $catMains = Category::create(['id' => 7, 'name' => 'Main Kitchen & Steaks', 'slug' => 'main-kitchen', 'icon' => 'flame', 'sort_order' => 7]);

        // 5. Products
        $p1 = Product::create([
            'category_id' => 1,
            'sku' => 'CKT-GOLD-01',
            'barcode' => '899100101',
            'name' => 'Golden Smoked Old Fashioned',
            'description' => 'Bourbon, gold leaf flakes, aromatic bitters, orange peel, oakwood smoke aroma',
            'image_url' => '/images/menu/gold_old_fashioned.jpg',
            'unit' => 'glass',
            'cost_price' => 45000.00,
            'selling_price' => 145000.00,
            'track_stock' => true,
            'current_stock' => 60,
            'min_stock_alert' => 10,
            'is_favorite' => true,
        ]);

        $p2 = Product::create([
            'category_id' => 1,
            'sku' => 'CKT-MID-02',
            'barcode' => '899100102',
            'name' => 'Midnight Velvet Negroni',
            'description' => 'Botanical Gin, Campari, Sweet Vermouth, dehydrated blood orange wheel',
            'image_url' => '/images/menu/midnight_negroni.jpg',
            'unit' => 'glass',
            'cost_price' => 38000.00,
            'selling_price' => 135000.00,
            'track_stock' => true,
            'current_stock' => 45,
            'min_stock_alert' => 8,
            'is_favorite' => true,
        ]);

        $p3 = Product::create([
            'category_id' => 1,
            'sku' => 'CKT-STR-03',
            'barcode' => '899100103',
            'name' => 'Street Bar Espresso Martini',
            'description' => 'Vodka, artisanal espresso roast, kahlua, vanilla bean froth',
            'image_url' => '/images/menu/espresso_martini.jpg',
            'unit' => 'glass',
            'cost_price' => 32000.00,
            'selling_price' => 120000.00,
            'track_stock' => true,
            'current_stock' => 50,
            'min_stock_alert' => 10,
            'is_favorite' => true,
        ]);

        $p4 = Product::create([
            'category_id' => 2,
            'sku' => 'MCK-SUN-01',
            'barcode' => '899200101',
            'name' => 'Golden Sunset Fizz Mocktail',
            'description' => 'Yuzu purée, passion fruit, fresh mint, sparkling tonic, butterfly pea splash',
            'image_url' => '/images/menu/sunset_fizz.jpg',
            'unit' => 'glass',
            'cost_price' => 18000.00,
            'selling_price' => 65000.00,
            'track_stock' => true,
            'current_stock' => 80,
            'min_stock_alert' => 15,
            'is_favorite' => true,
        ]);

        $p5 = Product::create([
            'category_id' => 3,
            'sku' => 'BER-DRT-01',
            'barcode' => '899300101',
            'name' => 'Street Craft IPA Pint',
            'description' => 'Fresh draft craft IPA with citrus floral hops aroma (500ml)',
            'image_url' => '/images/menu/craft_ipa.jpg',
            'unit' => 'pint',
            'cost_price' => 28000.00,
            'selling_price' => 85000.00,
            'track_stock' => true,
            'current_stock' => 120,
            'min_stock_alert' => 20,
            'is_favorite' => true,
        ]);

        $p6 = Product::create([
            'category_id' => 6,
            'sku' => 'TPS-TRF-01',
            'barcode' => '899600101',
            'name' => 'Truffle Parmesan Hand-cut Fries',
            'description' => 'Crispy Idaho potato fries tossed in white truffle oil, rosemary, aged parmesan',
            'image_url' => '/images/menu/truffle_fries.jpg',
            'unit' => 'portion',
            'cost_price' => 18000.00,
            'selling_price' => 68000.00,
            'track_stock' => true,
            'current_stock' => 95,
            'min_stock_alert' => 15,
            'is_favorite' => true,
        ]);

        $p7 = Product::create([
            'category_id' => 7,
            'sku' => 'MN-WGY-01',
            'barcode' => '899700101',
            'name' => 'Wagyu MB5 Tenderloin Steak 200g',
            'description' => 'Grilled premium Australian Wagyu MB5, mashed potato, asparagus, red wine jus',
            'image_url' => '/images/menu/wagyu_tenderloin.jpg',
            'unit' => 'portion',
            'cost_price' => 140000.00,
            'selling_price' => 345000.00,
            'track_stock' => true,
            'current_stock' => 25,
            'min_stock_alert' => 5,
            'is_favorite' => false,
        ]);

        // 6. Tables
        PosTable::insert([
            ['table_number' => 'BAR-01', 'section' => 'Bar Counter', 'capacity' => 2, 'status' => 'available'],
            ['table_number' => 'BAR-02', 'section' => 'Bar Counter', 'capacity' => 2, 'status' => 'available'],
            ['table_number' => 'BAR-03', 'section' => 'Bar Counter', 'capacity' => 2, 'status' => 'occupied'],
            ['table_number' => 'T-01', 'section' => 'Indoor Lounge', 'capacity' => 4, 'status' => 'available'],
            ['table_number' => 'T-02', 'section' => 'Indoor Lounge', 'capacity' => 4, 'status' => 'available'],
            ['table_number' => 'VIP-GOLD', 'section' => 'VIP Mezzanine', 'capacity' => 10, 'status' => 'reserved'],
        ]);

        // 7. Customers
        Customer::insert([
            ['name' => 'Alexander Wijaya', 'phone' => '08111222333', 'email' => 'alex.wijaya@gmail.com', 'tier' => 'platinum_vip', 'loyalty_points' => 450, 'total_spend' => 4850000.00],
            ['name' => 'Jessica Tan', 'phone' => '08129876543', 'email' => 'jessica.tan@hotmail.com', 'tier' => 'gold', 'loyalty_points' => 280, 'total_spend' => 2900000.00],
            ['name' => 'Reza Rahardian', 'phone' => '08137788990', 'email' => 'reza.rahardian@yahoo.com', 'tier' => 'silver', 'loyalty_points' => 110, 'total_spend' => 1250000.00],
        ]);

        // 8. Promotions
        Promotion::insert([
            [
                'name' => 'Happy Hour Cocktails 25% Off',
                'code' => 'HAPPYHOUR',
                'type' => 'happy_hour',
                'discount_value' => 25.00,
                'min_order_amount' => 100000.00,
                'max_discount_amount' => 200000.00,
                'start_time' => '17:00:00',
                'end_time' => '20:00:00',
                'days_active' => 'Mon,Tue,Wed,Thu,Fri',
                'is_active' => true,
            ],
            [
                'name' => 'Gold Member Discount Rp 50.000',
                'code' => 'GOLD50K',
                'type' => 'fixed_amount',
                'discount_value' => 50000.00,
                'min_order_amount' => 250000.00,
                'max_discount_amount' => 50000.00,
                'start_time' => null,
                'end_time' => null,
                'days_active' => 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
                'is_active' => true,
            ]
        ]);

        // 9. Active Shift
        $shift = WorkShift::create([
            'outlet_id' => 1,
            'cashier_id' => $cashier->id,
            'shift_number' => 'SHIFT-20261016-01',
            'opening_cash' => 500000.00,
            'total_cash_in' => 100000.00,
            'total_cash_out' => 50000.00,
            'total_sales_cash' => 850000.00,
            'total_sales_non_cash' => 1240000.00,
            'total_orders_count' => 8,
            'status' => 'open',
            'opened_at' => now()->subHours(4),
            'notes' => 'Shift Malam Kasir Nabila. Kas awal laci Rp 500.000.',
        ]);

        // 10. Cash Movements
        CashMovement::create([
            'shift_id' => $shift->id,
            'user_id' => $cashier->id,
            'type' => 'cash_in',
            'amount' => 100000.00,
            'category' => 'Uang Pecahan Kas',
            'notes' => 'Tukar uang receh Rp 2.000 & Rp 5.000',
        ]);

        CashMovement::create([
            'shift_id' => $shift->id,
            'user_id' => $cashier->id,
            'type' => 'cash_out',
            'amount' => 50000.00,
            'category' => 'Pembelian Es Batu Tube',
            'notes' => 'Beli 2 karung es batu kristal',
        ]);
    }
}
