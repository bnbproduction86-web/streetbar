<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Street Bar POS.
     */
    public function up(): void
    {
        // 1. Outlets
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->default('Street Bar & Lounge');
            $table->string('legal_name', 150)->nullable();
            $table->string('phone', 30)->default('0812-3456-7890');
            $table->string('email', 100)->nullable()->default('info@streetbar.pos');
            $table->text('address');
            $table->decimal('tax_percentage', 5, 2)->default(10.00);
            $table->decimal('service_percentage', 5, 2)->default(5.00);
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('currency_symbol', 10)->default('Rp');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Modify or Enhance Users
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'outlet_id')) {
                $table->foreignId('outlet_id')->nullable()->after('id')->constrained('outlets')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'pin_code')) {
                $table->string('pin_code', 6)->default('123456')->after('password');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['super_admin', 'manager', 'cashier', 'bartender'])->default('cashier')->after('pin_code');
            }
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('avatar_url');
            }
        });

        // 3. Work Shifts
        Schema::create('work_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->string('shift_number', 30);
            $table->decimal('opening_cash', 15, 2)->default(0.00);
            $table->decimal('closing_cash_actual', 15, 2)->nullable();
            $table->decimal('closing_cash_expected', 15, 2)->nullable();
            $table->decimal('cash_difference', 15, 2)->nullable();
            $table->decimal('total_cash_in', 15, 2)->default(0.00);
            $table->decimal('total_cash_out', 15, 2)->default(0.00);
            $table->decimal('total_sales_cash', 15, 2)->default(0.00);
            $table->decimal('total_sales_non_cash', 15, 2)->default(0.00);
            $table->unsignedInteger('total_orders_count')->default(0);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['outlet_id', 'status']);
            $table->index('opened_at');
        });

        // 4. Cash Movements (Petty Cash)
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('work_shifts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->enum('type', ['cash_in', 'cash_out']);
            $table->decimal('amount', 15, 2);
            $table->string('category', 60);
            $table->string('notes', 255)->nullable();
            $table->string('receipt_proof_url', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('shift_id');
            $table->index('type');
        });

        // 5. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 100)->unique();
            $table->string('description', 255)->nullable();
            $table->string('icon', 50)->default('martini');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['sort_order', 'is_active']);
        });

        // 6. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('sku', 50)->unique();
            $table->string('barcode', 50)->nullable()->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('unit', 20)->default('portion');
            $table->decimal('cost_price', 15, 2)->default(0.00);
            $table->decimal('selling_price', 15, 2)->default(0.00);
            $table->boolean('track_stock')->default(true);
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_alert')->default(5);
            $table->boolean('is_favorite')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category_id', 'is_active']);
            $table->index('barcode');
        });

        // 7. Product Variants
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('sku', 60)->nullable()->unique();
            $table->decimal('additional_price', 15, 2)->default(0.00);
            $table->decimal('cost_price', 15, 2)->default(0.00);
            $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
        });

        // 8. Modifier Groups
        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->enum('selection_type', ['single', 'multiple'])->default('single');
            $table->boolean('is_required')->default(false);
            $table->integer('min_select')->default(0);
            $table->integer('max_select')->default(1);
            $table->timestamps();
        });

        // 9. Modifier Items
        Schema::create('modifier_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('modifier_groups')->cascadeOnDelete();
            $table->string('name', 80);
            $table->decimal('price', 15, 2)->default(0.00);
            $table->decimal('cost_price', 15, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('group_id');
        });

        // 10. Product Modifier Groups Pivot
        Schema::create('product_modifier_groups', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->constrained('modifier_groups')->cascadeOnDelete();
            $table->primary(['product_id', 'modifier_group_id']);
        });

        // 11. Inventory Logs
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->enum('type', ['initial', 'sale', 'sale_void', 'restock', 'adjustment', 'waste_spoilage']);
            $table->integer('quantity_change');
            $table->integer('previous_stock');
            $table->integer('current_stock');
            $table->string('reference_id', 100)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['product_id', 'created_at']);
        });

        // 12. Tables (Bar / Dining Tables)
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->string('table_number', 30)->unique();
            $table->string('section', 50)->default('Bar Counter');
            $table->integer('capacity')->default(4);
            $table->enum('status', ['available', 'occupied', 'reserved', 'open_tab'])->default('available');
            $table->string('current_guest_name', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['section', 'status']);
        });

        // 13. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('phone', 30)->unique();
            $table->string('email', 100)->nullable();
            $table->enum('tier', ['regular', 'silver', 'gold', 'platinum_vip'])->default('regular');
            $table->integer('loyalty_points')->default(0);
            $table->decimal('total_spend', 15, 2)->default(0.00);
            $table->timestamp('last_visit')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('phone');
        });

        // 14. Promotions
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 40)->nullable()->unique();
            $table->enum('type', ['percentage', 'fixed_amount', 'buy_x_get_y', 'happy_hour']);
            $table->decimal('discount_value', 15, 2)->default(0.00);
            $table->decimal('min_order_amount', 15, 2)->default(0.00);
            $table->decimal('max_discount_amount', 15, 2)->nullable();
            $table->integer('buy_quantity')->default(0);
            $table->integer('get_quantity')->default(0);
            $table->foreignId('applicable_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('days_active', 50)->nullable()->default('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
            $table->boolean('is_active')->default(true);
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'start_date', 'end_date']);
        });

        // 15. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('shift_id')->constrained('work_shifts')->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->enum('order_type', ['dine_in', 'takeaway', 'bar_tab', 'delivery'])->default('dine_in');
            $table->enum('status', ['pending', 'completed', 'voided', 'refunded'])->default('completed');
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->foreignId('promotion_id')->nullable()->constrained('promotions')->nullOnDelete();
            $table->decimal('tax_amount', 15, 2)->default(0.00);
            $table->decimal('service_charge', 15, 2)->default(0.00);
            $table->decimal('grand_total', 15, 2)->default(0.00);
            $table->decimal('total_cost_price', 15, 2)->default(0.00);
            $table->decimal('paid_amount', 15, 2)->default(0.00);
            $table->decimal('change_amount', 15, 2)->default(0.00);
            $table->enum('payment_method', ['cash', 'qris', 'debit_card', 'credit_card', 'bank_transfer', 'split'])->default('cash');
            $table->string('payment_reference', 100)->nullable();
            $table->string('notes', 255)->nullable();
            $table->integer('printed_count')->default(0);
            $table->string('void_reason', 255)->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('invoice_number');
            $table->index(['outlet_id', 'created_at', 'status']);
            $table->index('shift_id');
        });

        // 16. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('product_name', 120);
            $table->string('variant_name', 80)->nullable();
            $table->decimal('cost_price', 15, 2)->default(0.00);
            $table->decimal('unit_price', 15, 2)->default(0.00);
            $table->integer('quantity')->default(1);
            $table->decimal('subtotal_price', 15, 2)->default(0.00);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');
        });

        // 17. Order Item Modifiers
        Schema::create('order_item_modifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('modifier_item_id')->nullable()->constrained('modifier_items')->nullOnDelete();
            $table->string('modifier_name', 80);
            $table->decimal('additional_price', 15, 2)->default(0.00);

            $table->index('order_item_id');
        });

        // 18. Order Payments (Split Bill)
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->enum('payment_method', ['cash', 'qris', 'debit_card', 'credit_card', 'bank_transfer']);
            $table->decimal('amount', 15, 2);
            $table->string('reference_number', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('order_id');
        });

        // 19. System Settings
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key', 60)->unique();
            $table->text('setting_value')->nullable();
            $table->string('category', 40)->default('general');
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('order_payments');
        Schema::dropIfExists('order_item_modifiers');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('tables');
        Schema::dropIfExists('inventory_logs');
        Schema::dropIfExists('product_modifier_groups');
        Schema::dropIfExists('modifier_items');
        Schema::dropIfExists('modifier_groups');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('work_shifts');
        Schema::dropIfExists('outlets');
    }
};
